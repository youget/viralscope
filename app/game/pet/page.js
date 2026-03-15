'use client'
import { useState, useEffect } from 'react'
import { Heart, Apple, Gamepad2, Plus, Minus, RotateCcw, Sparkles } from 'lucide-react'
import { checkLevelRequirements, calculateBuyPrice } from './utils/levelSystem'

const PET_STORAGE_KEY = 'vs-digital-pet'
const DOPAMINE_STORAGE_KEY = 'vs-game-dopamine'

const evolutionData = [
  { maxLevel: 9, name: 'Slime', emoji: '🟣', description: 'gooey but cute' },
  { maxLevel: 24, name: 'Rabbit', emoji: '🐇', description: 'hoppy little chaos' },
  { maxLevel: 49, name: 'Fox', emoji: '🦊', description: 'sly and adorable' },
  { maxLevel: 79, name: 'Dragon', emoji: '🐉', description: 'literally a dragon' },
  { maxLevel: 99, name: 'Dragon Alpha', emoji: '🐲', description: 'ancient and powerful' },
  { maxLevel: Infinity, name: 'Dragon God', emoji: '🐉✨', description: 'ascended beyond mortal understanding' },
]

export default function DigitalPet() {
  // ===== STATE =====
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
    nextRequirement: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedPet = localStorage.getItem(PET_STORAGE_KEY)
    if (savedPet) {
      const data = JSON.parse(savedPet)
      setPet(data.pet)
      setToken(data.token || 0)
    }
    
    const dopamineData = localStorage.getItem(DOPAMINE_STORAGE_KEY)
    if (dopamineData) {
      const { totalClicks: clicks, token: dopamineToken, prestigeBonus: bonus } = JSON.parse(dopamineData)
      setTotalClicks(clicks || 0)
      setToken(prev => prev + (dopamineToken || 0)) // gabung token dari dopamine + token pet
      setPrestigeBonus(bonus || 0)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const reqs = checkLevelRequirements(pet.level, pet.level + 1, pet, totalClicks)
    setRequirements(reqs)
  }, [pet, totalClicks])

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(PET_STORAGE_KEY, JSON.stringify({ pet, token }))
    }
  }, [pet, token, loading])

  const feed = () => {
    setPet(prev => ({
      ...prev,
      hunger: Math.max(0, prev.hunger - 10),
      happiness: Math.min(100, prev.happiness + 5),
      health: Math.min(100, prev.health + 2)
    }))
  }

  const play = () => {
    setPet(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 15),
      lastPlayed: Date.now()
    }))
  }

  const heal = () => {
    setPet(prev => ({
      ...prev,
      health: Math.min(100, prev.health + 10),
      happiness: Math.max(0, prev.happiness - 2)
    }))
  }

  const levelUp = () => {
    if (!requirements.canLevelUp) return

    setPet(prev => ({
      ...prev,
      level: prev.level + 1,
      happiness: Math.min(100, prev.happiness + 5),
      health: Math.min(100, prev.health + 5)
    }))
  }

  const buyLevel = (levels = 1) => {
    const targetLevel = pet.level + levels
    const price = calculateBuyPrice(pet.level, targetLevel)

    if (token >= price) {
      setToken(prev => prev - price)
      setPet(prev => ({
        ...prev,
        level: targetLevel,
        happiness: Math.min(100, prev.happiness + 10),
        health: Math.min(100, prev.health + 10)
      }))
    }
  }

  const resetPet = () => {
    if (confirm('Reset your pet? All progress will be lost. For real.')) {
      setPet({
        level: 1,
        happiness: 50,
        health: 100,
        hunger: 20,
        lastFed: Date.now(),
        lastPlayed: Date.now(),
      })
      setToken(0)
      localStorage.removeItem(PET_STORAGE_KEY)
    }
  }

  const getEvolution = (level) => {
    return evolutionData.find(e => level <= e.maxLevel) || evolutionData[evolutionData.length - 1]
  }

  const currentEvo = getEvolution(pet.level)
  const nextEvo = getEvolution(pet.level + 1)

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

      {/* ===== STATS CARD ===== */}
      <div className="vs-card border vs-border rounded-2xl p-6 mb-6 text-center">
        <div className="text-8xl mb-2 animate-bounce">
          {currentEvo.emoji}
        </div>
        <p className="text-lg font-bold vs-text mb-1">{currentEvo.name}</p>
        <p className="text-[10px] vs-text-sub mb-3">{currentEvo.description}</p>
        <p className="text-xs vs-text-sub mb-3">Lvl {pet.level} {nextEvo.name !== currentEvo.name ? `→ ${nextEvo.name} at lvl ${nextEvo.maxLevel - (nextEvo.maxLevel === Infinity ? 0 : 99) + 1}` : ''}</p>

        {/* Status bars */}
        <div className="space-y-2 text-left">
          <div>
            <div className="flex justify-between text-[10px] vs-text-sub mb-1">
              <span>❤️ Happiness</span>
              <span>{pet.happiness}%</span>
            </div>
            <div className="h-2 bg-[var(--vs-border)] rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400" style={{ width: `${pet.happiness}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] vs-text-sub mb-1">
              <span>🍖 Hunger</span>
              <span>{pet.hunger}%</span>
            </div>
            <div className="h-2 bg-[var(--vs-border)] rounded-full overflow-hidden">
              <div className="h-full bg-orange-400" style={{ width: `${Math.min(100, pet.hunger)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] vs-text-sub mb-1">
              <span>💊 Health</span>
              <span>{pet.health}%</span>
            </div>
            <div className="h-2 bg-[var(--vs-border)] rounded-full overflow-hidden">
              <div className="h-full bg-green-400" style={{ width: `${pet.health}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== TOKEN DISPLAY ===== */}
      <div className="vs-card border vs-border rounded-xl p-3 mb-4 flex justify-between items-center">
        <span className="text-xs vs-text">Your stash</span>
        <div className="flex items-center gap-2">
          {prestigeBonus > 0 && (
            <span className="text-[10px] vs-text-sub">+{prestigeBonus}% bonus from prestige</span>
          )}
          <span className="text-sm font-bold vs-accent">🪙 {token}</span>
        </div>
      </div>

      {/* ===== TOTAL CLICKS ===== */}
      <div className="vs-card border vs-border rounded-xl p-2 mb-4 text-center">
        <p className="text-[10px] vs-text-sub">Total clicks (from Dopamine Miner)</p>
        <p className="text-lg font-bold vs-accent">{totalClicks.toLocaleString()}</p>
      </div>

      {requirements.nextRequirement && (
        <div className="vs-card border vs-border rounded-xl p-4 mb-4">
          <p className="text-xs font-bold vs-text mb-2">
            Requirements for Level {pet.level + 1}
            {requirements.canLevelUp && (
              <span className="ml-2 text-[10px] vs-accent">✓ Ready to level up!</span>
            )}
          </p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] vs-text-sub mb-1">
                <span>🖱️ Total Clicks</span>
                <span className={totalClicks >= requirements.nextRequirement.clicks ? 'text-green-400' : 'text-red-400'}>
                  {totalClicks.toLocaleString()} / {requirements.nextRequirement.clicks.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 bg-[var(--vs-border)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-400" 
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
                  className="h-full bg-yellow-400" 
                  style={{ width: `${(pet.happiness / requirements.nextRequirement.happiness) * 100}%` }} 
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
                  className="h-full bg-green-400" 
                  style={{ width: `${(pet.health / requirements.nextRequirement.health) * 100}%` }} 
                />
              </div>
            </div>

            {/* Hunger */}
            <div>
              <div className="flex justify-between text-[10px] vs-text-sub mb-1">
                <span>🍖 Hunger</span>
                <span className={pet.hunger <= 30 ? 'text-green-400' : 'text-red-400'}>
                  {pet.hunger}% ≤ 30%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--vs-border)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-400" 
                  style={{ width: `${(pet.hunger / 30) * 100}%` }} 
                />
              </div>
              {pet.hunger > 30 && (
                <p className="text-[9px] vs-text-sub mt-1">Feed your pet, bestie!</p>
              )}
            </div>
          </div>

          {/* Level up button */}
          {requirements.canLevelUp ? (
            <button
              onClick={levelUp}
              className="vs-btn w-full py-3 rounded-xl text-sm font-bold mt-4"
            >
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
                +5 levels ({calculateBuyPrice(pet.level, pet.level + 5).toLocaleString()} 🪙)
              </button>
              <button
                onClick={() => buyLevel(10)}
                className="flex-1 vs-btn-outline py-2 rounded-xl text-xs"
                disabled={token < calculateBuyPrice(pet.level, pet.level + 10)}
              >
                +10 levels ({calculateBuyPrice(pet.level, pet.level + 10).toLocaleString()} 🪙)
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={feed}
          className="vs-card border vs-border rounded-xl p-3 text-center vs-hover"
        >
          <Apple size={20} className="mx-auto mb-1 vs-accent" />
          <p className="text-xs font-semibold vs-text">Feed</p>
          <p className="text-[9px] vs-text-sub">-10 hunger</p>
        </button>
        <button
          onClick={play}
          className="vs-card border vs-border rounded-xl p-3 text-center vs-hover"
        >
          <Gamepad2 size={20} className="mx-auto mb-1 vs-accent" />
          <p className="text-xs font-semibold vs-text">Play</p>
          <p className="text-[9px] vs-text-sub">+15 happiness</p>
        </button>
        <button
          onClick={heal}
          className="vs-card border vs-border rounded-xl p-3 text-center vs-hover"
        >
          <Heart size={20} className="mx-auto mb-1 vs-accent" />
          <p className="text-xs font-semibold vs-text">Heal</p>
          <p className="text-[9px] vs-text-sub">+10 health</p>
        </button>
      </div>

      {/* ===== RESET BUTTON ===== */}
      <div className="text-center">
        <button
          onClick={resetPet}
          className="vs-btn-outline px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
        >
          <RotateCcw size={14} /> Reset Pet
        </button>
      </div>

      {/* ===== FOOTER ===== */}
      <p className="text-[9px] vs-text-sub text-center mt-6">
        ⚡ pet evolves at levels 10, 25, 50, 80, and 100+ • tokens shared with Dopamine Miner
      </p>
    </div>
  )
}
