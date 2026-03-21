'use client'
import { useState, useEffect, useCallback } from 'react'
import { Heart, Apple, Gamepad2, RotateCcw } from 'lucide-react'
import { checkLevelRequirements, calculateBuyPrice } from './utils/levelSystem'
import Link from 'next/link'

const PET_STORAGE_KEY = 'vs-digital-pet'
const DOPAMINE_STORAGE_KEY = 'vs-game-dopamine'
const ACTION_COOLDOWN = 5000 // 5 detik

const evolutionData = [
  { minLevel: 1,   maxLevel: 9,        name: 'Slime',        emoji: '🟣', description: 'gooey but cute' },
  { minLevel: 10,  maxLevel: 24,       name: 'Rabbit',       emoji: '🐇', description: 'hoppy little chaos' },
  { minLevel: 25,  maxLevel: 49,       name: 'Fox',          emoji: '🦊', description: 'sly and adorable' },
  { minLevel: 50,  maxLevel: 79,       name: 'Dragon',       emoji: '🐉', description: 'literally a dragon' },
  { minLevel: 80,  maxLevel: 99,       name: 'Dragon Alpha', emoji: '🐲', description: 'ancient and powerful' },
  { minLevel: 100, maxLevel: Infinity, name: 'Dragon God',   emoji: '🐉✨', description: 'ascended beyond mortal understanding' },
]

export default function DigitalPet() {
  const [pet, setPet] = useState({
    level: 1,
    happiness: 50,
    health: 100,
    hunger: 20,
    lastFed: Date.now(),
    lastPlayed: Date.now(),
  })
  const [token, setToken] = useState(0)
  const [totalClicks, setTotalClicks] = useState(0)
  const [prestigeBonus, setPrestigeBonus] = useState(0)
  const [requirements, setRequirements] = useState({
    canLevelUp: false,
    unmet: [],
    nextRequirement: null,
  })
  const [loading, setLoading] = useState(true)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // ===== Cooldown state =====
  const [cooldowns, setCooldowns] = useState({ feed: 0, play: 0, heal: 0 })
  const [now, setNow] = useState(Date.now())

  // Tick setiap 1 detik untuk update cooldown display
  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(ticker)
  }, [])

  // ===== LOAD =====
  useEffect(() => {
    const savedPet = localStorage.getItem(PET_STORAGE_KEY)
    if (savedPet) {
      const data = JSON.parse(savedPet)
      if (data.pet) setPet(data.pet)
    }

    // ✅ FIX: Token hanya READ dari dopamine storage, bukan ADD
    const dopamineData = localStorage.getItem(DOPAMINE_STORAGE_KEY)
    if (dopamineData) {
      const parsed = JSON.parse(dopamineData)
      setTotalClicks(parsed.totalClicks || 0)
      setToken(parsed.token || 0) // SET, bukan prev + token
      setPrestigeBonus(parsed.prestigeBonus || 0)
    }

    setLoading(false)
  }, [])

  // ===== Check level requirements =====
  useEffect(() => {
    const reqs = checkLevelRequirements(pet.level, pet.level + 1, pet, totalClicks)
    setRequirements(reqs)
  }, [pet, totalClicks])

  // ===== SAVE pet only (token lives in dopamine storage) =====
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(PET_STORAGE_KEY, JSON.stringify({ pet }))
    }
  }, [pet, loading])

  // ===== Sync token back to dopamine storage =====
  const syncTokenToDopamine = useCallback((newToken) => {
    const dopamineRaw = localStorage.getItem(DOPAMINE_STORAGE_KEY)
    if (dopamineRaw) {
      const dopamineData = JSON.parse(dopamineRaw)
      dopamineData.token = newToken
      localStorage.setItem(DOPAMINE_STORAGE_KEY, JSON.stringify(dopamineData))
    }
  }, [])

  // ===== TIME-BASED DECAY =====
  useEffect(() => {
    if (loading) return

    const decay = setInterval(() => {
      setPet((prev) => ({
        ...prev,
        hunger: Math.min(100, prev.hunger + 3),
        happiness: Math.max(0, prev.happiness - 2),
        health: prev.hunger > 80 ? Math.max(0, prev.health - 3) : prev.health,
      }))
    }, 30000) // setiap 30 detik

    return () => clearInterval(decay)
  }, [loading])

  // ===== Actions dengan cooldown =====
  const feed = () => {
    if (now < cooldowns.feed) return
    setPet((prev) => ({
      ...prev,
      hunger: Math.max(0, prev.hunger - 10),
      happiness: Math.min(100, prev.happiness + 5),
      health: Math.min(100, prev.health + 2),
      lastFed: Date.now(),
    }))
    setCooldowns((prev) => ({ ...prev, feed: Date.now() + ACTION_COOLDOWN }))
  }

  const play = () => {
    if (now < cooldowns.play) return
    setPet((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 15),
      hunger: Math.min(100, prev.hunger + 5), // main = lapar dikit
      lastPlayed: Date.now(),
    }))
    setCooldowns((prev) => ({ ...prev, play: Date.now() + ACTION_COOLDOWN }))
  }

  const heal = () => {
    if (now < cooldowns.heal) return
    setPet((prev) => ({
      ...prev,
      health: Math.min(100, prev.health + 10),
      happiness: Math.max(0, prev.happiness - 2),
    }))
    setCooldowns((prev) => ({ ...prev, heal: Date.now() + ACTION_COOLDOWN }))
  }

  const getCooldownRemaining = (action) => {
    const remaining = Math.max(0, Math.ceil((cooldowns[action] - now) / 1000))
    return remaining
  }

  // ===== Level up (free jika requirements met) =====
  const levelUp = () => {
    if (!requirements.canLevelUp) return
    setPet((prev) => ({
      ...prev,
      level: prev.level + 1,
      happiness: Math.min(100, prev.happiness + 5),
      health: Math.min(100, prev.health + 5),
    }))
  }

  // ===== Buy level (pakai token) =====
  const buyLevel = (levels = 1) => {
    const targetLevel = pet.level + levels
    const price = calculateBuyPrice(pet.level, targetLevel)

    if (token >= price) {
      const newToken = token - price
      setToken(newToken)
      syncTokenToDopamine(newToken)
      setPet((prev) => ({
        ...prev,
        level: targetLevel,
        happiness: Math.min(100, prev.happiness + 10),
        health: Math.min(100, prev.health + 10),
      }))
    }
  }

  // ===== Reset pet =====
  const resetPet = () => {
    setPet({
      level: 1,
      happiness: 50,
      health: 100,
      hunger: 20,
      lastFed: Date.now(),
      lastPlayed: Date.now(),
    })
    localStorage.removeItem(PET_STORAGE_KEY)
    setShowResetConfirm(false)
  }

  // ===== Evolution helpers =====
  const getEvolution = (level) => {
    return evolutionData.find((e) => level <= e.maxLevel) || evolutionData[evolutionData.length - 1]
  }

  const getNextEvolutionStage = (level) => {
    return evolutionData.find((e) => e.minLevel > level) || null
  }

  const currentEvo = getEvolution(pet.level)
  const nextEvoStage = getNextEvolutionStage(pet.level)

  // ===== Pet mood emoji =====
  const getPetMood = () => {
    if (pet.health < 20) return '😵'
    if (pet.hunger > 80) return '😫'
    if (pet.happiness < 20) return '😢'
    if (pet.happiness > 80 && pet.health > 80) return '✨'
    return ''
  }

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto text-center">
        <p className="text-sm vs-text-sub">Summoning your pet...</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black vs-text text-center mb-2">
        Digital <span className="vs-gradient-text">Pet</span>
      </h1>
      <p className="text-xs vs-text-sub text-center mb-6">
        your lil dopamine buddy. feed it or face the consequences.
      </p>

      {/* ===== PET STATS CARD ===== */}
      <div className="vs-card border vs-border rounded-2xl p-6 mb-6 text-center">
        <div className="text-8xl mb-2 animate-bounce">
          {currentEvo.emoji} {getPetMood()}
        </div>
        <p className="text-lg font-bold vs-text mb-1">{currentEvo.name}</p>
        <p className="text-[10px] vs-text-sub mb-3">{currentEvo.description}</p>
        <p className="text-xs vs-text-sub mb-3">
          Lvl {pet.level}
          {nextEvoStage && ` → ${nextEvoStage.name} at Lvl ${nextEvoStage.minLevel}`}
        </p>

        {/* Status bars */}
        <div className="space-y-2 text-left">
          <div>
            <div className="flex justify-between text-[10px] vs-text-sub mb-1">
              <span>❤️ Happiness</span>
              <span>{pet.happiness}%</span>
            </div>
            <div className="h-2 bg-[var(--vs-border)] rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${pet.happiness}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] vs-text-sub mb-1">
              <span>🍖 Hunger</span>
              <span>{pet.hunger}%</span>
            </div>
            <div className="h-2 bg-[var(--vs-border)] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${pet.hunger > 80 ? 'bg-red-500' : pet.hunger > 50 ? 'bg-orange-400' : 'bg-green-400'}`}
                style={{ width: `${Math.min(100, pet.hunger)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] vs-text-sub mb-1">
              <span>💊 Health</span>
              <span>{pet.health}%</span>
            </div>
            <div className="h-2 bg-[var(--vs-border)] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${pet.health < 30 ? 'bg-red-500' : 'bg-green-400'}`}
                style={{ width: `${pet.health}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== YOUR STASH + ADD STASH BUTTON ===== */}
      <div className="vs-card border vs-border rounded-xl p-3 mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs vs-text">Your stash</span>
          {prestigeBonus > 0 && (
            <span className="text-[10px] vs-text-sub">+{prestigeBonus}% prestige</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold vs-accent">🪙 {token}</span>
          <Link
            href="/game/dopamine"
            className="vs-btn px-3 py-1 rounded-lg text-[10px] font-semibold inline-flex items-center gap-1"
          >
            + Add Stash
          </Link>
        </div>
      </div>

      {/* ===== FEED / PLAY / HEAL (setelah your stash) ===== */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <button
          onClick={feed}
          disabled={now < cooldowns.feed}
          className="vs-card border vs-border rounded-xl p-3 text-center vs-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Apple size={20} className="mx-auto mb-1 vs-accent" />
          <p className="text-xs font-semibold vs-text">Feed</p>
          <p className="text-[9px] vs-text-sub">-10 hunger</p>
          {getCooldownRemaining('feed') > 0 && (
            <p className="text-[9px] vs-accent mt-1">{getCooldownRemaining('feed')}s</p>
          )}
        </button>
        <button
          onClick={play}
          disabled={now < cooldowns.play}
          className="vs-card border vs-border rounded-xl p-3 text-center vs-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Gamepad2 size={20} className="mx-auto mb-1 vs-accent" />
          <p className="text-xs font-semibold vs-text">Play</p>
          <p className="text-[9px] vs-text-sub">+15 happy</p>
          {getCooldownRemaining('play') > 0 && (
            <p className="text-[9px] vs-accent mt-1">{getCooldownRemaining('play')}s</p>
          )}
        </button>
        <button
          onClick={heal}
          disabled={now < cooldowns.heal}
          className="vs-card border vs-border rounded-xl p-3 text-center vs-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Heart size={20} className="mx-auto mb-1 vs-accent" />
          <p className="text-xs font-semibold vs-text">Heal</p>
          <p className="text-[9px] vs-text-sub">+10 health</p>
          {getCooldownRemaining('heal') > 0 && (
            <p className="text-[9px] vs-accent mt-1">{getCooldownRemaining('heal')}s</p>
          )}
        </button>
      </div>

      {/* ===== TOTAL CLICKS ===== */}
      <div className="vs-card border vs-border rounded-xl p-2 mb-4 text-center">
        <p className="text-[10px] vs-text-sub">Total clicks (from Dopamine Miner)</p>
        <p className="text-lg font-bold vs-accent">{totalClicks.toLocaleString()}</p>
      </div>

      {/* ===== REQUIREMENTS & LEVEL UP ===== */}
      {requirements.nextRequirement && (
        <div className="vs-card border vs-border rounded-xl p-4 mb-4">
          <p className="text-xs font-bold vs-text mb-2">
            Requirements for Level {pet.level + 1}
            {requirements.canLevelUp && (
              <span className="ml-2 text-[10px] vs-accent">✓ Ready!</span>
            )}
          </p>

          <div className="space-y-3">
            {/* Clicks */}
            <div>
              <div className="flex justify-between text-[10px] vs-text-sub mb-1">
                <span>🖱️ Total Clicks</span>
                <span className={totalClicks >= requirements.nextRequirement.clicks ? 'text-green-400' : 'text-red-400'}>
                  {totalClicks.toLocaleString()} / {requirements.nextRequirement.clicks.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 bg-[var(--vs-border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalClicks / requirements.nextRequirement.clicks) * 100)}%` }}
                />
              </div>
            </div>

            {/* Happiness */}
            <div>
              <div className="flex justify-between text-[10px] vs-text-sub mb-1">
                <span>❤️ Happiness</span>
                <span className={pet.happiness >= requirements.nextRequirement.happiness ? 'text-green-400' : 'text-red-400'}>
                  {pet.happiness}% / {requirements.nextRequirement.happiness}%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--vs-border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, (pet.happiness / requirements.nextRequirement.happiness) * 100)}%` }}
                />
              </div>
            </div>

            {/* Health */}
            <div>
              <div className="flex justify-between text-[10px] vs-text-sub mb-1">
                <span>💊 Health</span>
                <span className={pet.health >= requirements.nextRequirement.health ? 'text-green-400' : 'text-red-400'}>
                  {pet.health}% / {requirements.nextRequirement.health}%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--vs-border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, (pet.health / requirements.nextRequirement.health) * 100)}%` }}
                />
              </div>
            </div>

            {/* Hunger */}
            <div>
              <div className="flex justify-between text-[10px] vs-text-sub mb-1">
                <span>🍖 Hunger</span>
                <span className={pet.hunger <= requirements.nextRequirement.hunger ? 'text-green-400' : 'text-red-400'}>
                  {pet.hunger}% ≤ {requirements.nextRequirement.hunger}%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--vs-border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, (pet.hunger / requirements.nextRequirement.hunger) * 100)}%` }}
                />
              </div>
              {pet.hunger > requirements.nextRequirement.hunger && (
                <p className="text-[9px] vs-text-sub mt-1">Feed your pet, bestie!</p>
              )}
            </div>
          </div>

          {/* Level up / buy buttons */}
          {requirements.canLevelUp ? (
            <button onClick={levelUp} className="vs-btn w-full py-3 rounded-xl text-sm font-bold mt-4">
              Level Up to {pet.level + 1} (Free)
            </button>
          ) : (
            <button
              onClick={() => buyLevel(1)}
              className="vs-btn-outline w-full py-3 rounded-xl text-sm font-bold mt-4"
              disabled={token < calculateBuyPrice(pet.level, pet.level + 1)}
            >
              Buy Level {pet.level + 1} for {calculateBuyPrice(pet.level, pet.level + 1).toLocaleString()} 🪙
            </button>
          )}

          {pet.level < 100 && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => buyLevel(5)}
                className="flex-1 vs-btn-outline py-2 rounded-xl text-xs"
                disabled={token < calculateBuyPrice(pet.level, pet.level + 5)}
              >
                +5 ({calculateBuyPrice(pet.level, pet.level + 5).toLocaleString()} 🪙)
              </button>
              <button
                onClick={() => buyLevel(10)}
                className="flex-1 vs-btn-outline py-2 rounded-xl text-xs"
                disabled={token < calculateBuyPrice(pet.level, pet.level + 10)}
              >
                +10 ({calculateBuyPrice(pet.level, pet.level + 10).toLocaleString()} 🪙)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== RESET BUTTON ===== */}
      <div className="text-center">
        <button
          onClick={() => setShowResetConfirm(true)}
          className="vs-btn-outline px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
        >
          <RotateCcw size={14} /> Reset Pet
        </button>
      </div>

      {/* ===== FOOTER ===== */}
      <p className="text-[9px] vs-text-sub text-center mt-6">
        ⚡ pet evolves at levels 10, 25, 50, 80, and 100+ • stats decay over time — don't neglect your pet!
      </p>

      {/* ===== RESET CONFIRMATION POPUP ===== */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setShowResetConfirm(false)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={(e) => e.stopPropagation()}>
            <p className="text-4xl mb-3">😢</p>
            <h3 className="text-lg font-bold vs-text mb-2">Abandon your pet?</h3>
            <p className="text-sm vs-text-sub mb-5 leading-relaxed">
              Your {currentEvo.name} will vanish forever. Level, stats, everything — gone. Are you sure?
            </p>
            <div className="flex gap-3">
              <button onClick={resetPet} className="flex-1 vs-btn py-2.5 rounded-xl text-sm font-semibold">
                Reset
              </button>
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 vs-btn-outline py-2.5 rounded-xl text-sm font-semibold">
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
