'use client'
import { useState, useEffect } from 'react'
import { Sparkles, RotateCcw } from 'lucide-react'

const GAME_STORAGE_KEY = 'vs-game-dopamine'

export default function GamePage() {
  const [score, setScore] = useState(0)
  const [clickPower, setClickPower] = useState(1)
  const [autoClicker, setAutoClicker] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(GAME_STORAGE_KEY)
    if (saved) {
      const { score, clickPower, autoClicker } = JSON.parse(saved)
      setScore(score || 0)
      setClickPower(clickPower || 1)
      setAutoClicker(autoClicker || false)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify({ score, clickPower, autoClicker }))
  }, [score, clickPower, autoClicker])

  // Auto-clicker effect
  useEffect(() => {
    if (!autoClicker) return
    const interval = setInterval(() => {
      setScore(prev => prev + clickPower)
    }, 1000)
    return () => clearInterval(interval)
  }, [autoClicker, clickPower])

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
    if (score >= 50 && !autoClicker) {
      setScore(prev => prev - 50)
      setAutoClicker(true)
    }
  }

  const resetGame = () => {
    if (confirm('Reset? Poof! All your dopamine gains vanish. For real.')) {
      setScore(0)
      setClickPower(1)
      setAutoClicker(false)
      localStorage.removeItem(GAME_STORAGE_KEY)
    }
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-black vs-text mb-1">
        Dopamine <span className="vs-gradient-text">Miner</span>
      </h1>
      <p className="text-xs vs-text-sub mb-6">tap tap — stack that dopamine</p>

      {/* Score display */}
      <div className="vs-card border vs-border rounded-2xl p-8 mb-6">
        <div className="text-5xl font-black vs-gradient-text mb-2">
          {score.toLocaleString()}
        </div>
        <div className="text-xs vs-text-sub">$DOPAMINE</div>
      </div>

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
          disabled={autoClicker || score < 50}
        >
          <p className="text-xs font-semibold vs-text">Auto-Clicker</p>
          <p className="text-lg font-bold vs-accent">{autoClicker ? '✅ Active' : '🔒'}</p>
          <p className="text-[10px] vs-text-sub">Price: 50 $DOPE</p>
        </button>
      </div>

      <button
        onClick={resetGame}
        className="vs-btn-outline px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
      >
        <RotateCcw size={14} /> Reset Game
      </button>

      <p className="text-[10px] vs-text-sub mt-8">
        psst... soon you can flex these $DOPAMINE as real tokens
      </p>
    </div>
  )
}
