'use client'
import { useState, useEffect } from 'react'
import { Sparkles, RotateCcw, Clock } from 'lucide-react'

const GAME_STORAGE_KEY = 'vs-game-dopamine'
const AUTO_CLICKER_DURATION = 60 * 60 * 1000
const BASE_AUTO_CLICKER_COST = 50

export default function GamePage() {
  const [score, setScore] = useState(0)
  const [clickPower, setClickPower] = useState(1)
  const [autoClickerActive, setAutoClickerActive] = useState(false)
  const [autoClickerEndTime, setAutoClickerEndTime] = useState(null)
  const [autoClickerCount, setAutoClickerCount] = useState(0)
  const [token, setToken] = useState(0)
  const [inventory, setInventory] = useState({ food: 0, toy: 0, medicine: 0 })
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(GAME_STORAGE_KEY)
    if (saved) {
      const { 
        score, clickPower, autoClickerActive, autoClickerEndTime, autoClickerCount,
        token, inventory 
      } = JSON.parse(saved)
      setScore(score || 0)
      setClickPower(clickPower || 1)
      setAutoClickerActive(autoClickerActive || false)
      setAutoClickerEndTime(autoClickerEndTime || null)
      setAutoClickerCount(autoClickerCount || 0)
      setToken(token || 0)
      setInventory(inventory || { food: 0, toy: 0, medicine: 0 })
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify({ 
      score, clickPower, autoClickerActive, autoClickerEndTime, autoClickerCount,
      token, inventory 
    }))
  }, [score, clickPower, autoClickerActive, autoClickerEndTime, autoClickerCount, token, inventory])

  useEffect(() => {
    if (!autoClickerActive) return

    const interval = setInterval(() => {
      if (autoClickerEndTime && Date.now() > autoClickerEndTime) {
        setAutoClickerActive(false)
        setAutoClickerEndTime(null)
        return
      }
      setScore(prev => prev + clickPower)
    }, 1000)

    return () => clearInterval(interval)
  }, [autoClickerActive, autoClickerEndTime, clickPower])

  const handleClick = () => {
    setScore(prev => prev + clickPower)
  }

  const buyUpgrade = () => {
    const cost = 10 * clickPower
    if (score >= cost) {
      setScore(prev => prev - cost)
      setClickPower(prev => prev + 1)
    }
  }

  const buyAutoClicker = () => {
    const cost = BASE_AUTO_CLICKER_COST * (autoClickerCount + 1)
    if (score >= cost) {
      setScore(prev => prev - cost)
      const now = Date.now()
      setAutoClickerEndTime(now + AUTO_CLICKER_DURATION)
      setAutoClickerActive(true)
      setAutoClickerCount(prev => prev + 1)
    }
  }

  const convertToToken = () => {
    if (score >= 100) {
      const newTokens = Math.floor(score / 100)
      setToken(prev => prev + newTokens)
      setScore(prev => prev - (newTokens * 100))
    }
  }

  const getRemainingTime = () => {
    if (!autoClickerActive || !autoClickerEndTime) return 0
    const remaining = Math.max(0, Math.floor((autoClickerEndTime - Date.now()) / 1000))
    return remaining
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}h ${m}m ${s}s`
  }

  const remaining = getRemainingTime()

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-black vs-text mb-1">
        Dopamine <span className="vs-gradient-text">Miner</span>
      </h1>
      <p className="text-xs vs-text-sub mb-6">tap tap — stack that dopamine</p>

      {/* Token display */}
      <div className="flex justify-between items-center mb-4">
        <div className="vs-card border vs-border rounded-xl px-3 py-1.5 text-xs">
          🪙 Token: {token}
        </div>
        <button
          onClick={convertToToken}
          className="vs-btn-outline px-3 py-1.5 rounded-xl text-xs"
          disabled={score < 100}
        >
          Convert 100 → 1 🪙
        </button>
      </div>

      {/* Score display */}
      <div className="vs-card border vs-border rounded-2xl p-8 mb-6">
        <div className="text-5xl font-black vs-gradient-text mb-2">
          {score.toLocaleString()}
        </div>
        <div className="text-xs vs-text-sub">$DOPAMINE</div>
      </div>

      {/* Auto-clicker status */}
      {autoClickerActive && (
        <div className="flex items-center justify-center gap-2 mb-4 text-xs vs-text-sub">
          <Clock size={14} />
          <span>Auto-clicker active: {formatTime(remaining)}</span>
        </div>
      )}

      {/* Main button */}
      <button
        onClick={handleClick}
        className="vs-btn w-40 h-40 rounded-full text-2xl font-bold mb-8 mx-auto flex items-center justify-center shadow-lg"
        style={{ background: 'var(--vs-accent)', color: '#fff' }}
      >
        <Sparkles size={48} />
      </button>

      {/* Upgrade area */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={buyUpgrade}
          className="vs-card border vs-border rounded-xl p-4 text-left vs-hover"
          disabled={score < 10 * clickPower}
        >
          <p className="text-xs font-semibold vs-text">Click Power</p>
          <p className="text-lg font-bold vs-accent">+{clickPower}</p>
          <p className="text-[10px] vs-text-sub">Price: {10 * clickPower} $DOPE</p>
        </button>

        <button
          onClick={buyAutoClicker}
          className="vs-card border vs-border rounded-xl p-4 text-left vs-hover"
          disabled={score < BASE_AUTO_CLICKER_COST * (autoClickerCount + 1)}
        >
          <p className="text-xs font-semibold vs-text">Auto-Clicker</p>
          <p className="text-lg font-bold vs-accent">
            {autoClickerActive ? '⏳ Active' : '🔒'}
          </p>
          <p className="text-[10px] vs-text-sub">
            Price: {BASE_AUTO_CLICKER_COST * (autoClickerCount + 1)} $DOPE
          </p>
          <p className="text-[8px] vs-text-sub">Lasts 1 hour • {autoClickerCount} bought</p>
        </button>
      </div>

      {/* Reset button */}
      <button
  onClick={() => setShowResetConfirm(true)}
  className="vs-btn-outline px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
>
  <RotateCcw size={14} /> Reset Game
</button>

{/* Reset popup */}
{showResetConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setShowResetConfirm(false)}>
    <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={(e) => e.stopPropagation()}>
      <p className="text-4xl mb-3">🧹</p>
      <h3 className="text-lg font-bold vs-text mb-2">Reset? fr fr?</h3>
      <p className="text-sm vs-text-sub mb-5 leading-relaxed">
        All your dopamine gains, tokens, and progress will vanish. 
        Like, poof. Gone. For real.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => {
            setScore(0)
            setClickPower(1)
            setAutoClickerActive(false)
            setAutoClickerEndTime(null)
            setAutoClickerCount(0)
            setToken(0)
            setInventory({ food: 0, toy: 0, medicine: 0 })
            localStorage.removeItem(GAME_STORAGE_KEY)
            setShowResetConfirm(false)
          }}
          className="flex-1 vs-btn py-2.5 rounded-xl text-sm font-semibold"
        >
          Yup, reset
        </button>
        <button
          onClick={() => setShowResetConfirm(false)}
          className="flex-1 vs-btn-outline py-2.5 rounded-xl text-sm font-semibold"
        >
          Nah, cancel
        </button>
      </div>
    </div>
  </div>
)}

      {/* Hint */}
      <p className="text-[10px] vs-text-sub mt-8">
        psst... soon you can flex these $DOPAMINE as real tokens
      </p>
    </div>
  )
}
