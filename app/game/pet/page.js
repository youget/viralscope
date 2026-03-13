'use client'
import { useState, useEffect } from 'react'
import { Heart, Apple, Gamepad2, Plus, Minus } from 'lucide-react'

const PET_STORAGE_KEY = 'vs-digital-pet'

export default function DigitalPet() {
  const [pet, setPet] = useState({
    name: 'Lil Dopa',
    type: 'slime',
    level: 1,
    happiness: 50,
    hunger: 50,
    health: 100,
    lastFed: Date.now(),
    lastPlayed: Date.now()
  })
  const [inventory, setInventory] = useState({ food: 0, toy: 0, medicine: 0 })
  const [token, setToken] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem(PET_STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      setPet(data.pet)
      setInventory(data.inventory)
      setToken(data.token)
    }

    const gameData = localStorage.getItem('vs-game-dopamine')
    if (gameData) {
      const { token: gameToken, inventory: gameInv } = JSON.parse(gameData)
      setToken(gameToken || 0)
      setInventory(gameInv || { food: 0, toy: 0, medicine: 0 })
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(PET_STORAGE_KEY, JSON.stringify({ pet, inventory, token }))
  }, [pet, inventory, token])

  useEffect(() => {
    const interval = setInterval(() => {
      setPet(prev => ({
        ...prev,
        happiness: Math.max(0, prev.happiness - 1),
        hunger: Math.min(100, prev.hunger + 1),
        health: prev.hunger > 80 ? prev.health - 2 : prev.health
      }))
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const feed = () => {
    if (inventory.food > 0) {
      setInventory(prev => ({ ...prev, food: prev.food - 1 }))
      setPet(prev => ({
        ...prev,
        hunger: Math.max(0, prev.hunger - 20),
        happiness: prev.happiness + 5,
        health: Math.min(100, prev.health + 5)
      }))
    }
  }

  const play = () => {
    if (inventory.toy > 0) {
      setInventory(prev => ({ ...prev, toy: prev.toy - 1 }))
      setPet(prev => ({
        ...prev,
        happiness: Math.min(100, prev.happiness + 15),
        lastPlayed: Date.now()
      }))
    }
  }

  const heal = () => {
    if (inventory.medicine > 0) {
      setInventory(prev => ({ ...prev, medicine: prev.medicine - 1 }))
      setPet(prev => ({
        ...prev,
        health: Math.min(100, prev.health + 30)
      }))
    }
  }

  const buyItem = (item, cost) => {
    if (token >= cost) {
      setToken(prev => prev - cost)
      setInventory(prev => ({ ...prev, [item]: prev[item] + 1 }))
    }
  }

  const petEmoji = {
    slime: '🟣',
    rabbit: '🐇',
    fox: '🦊',
    dragon: '🐉'
  }

  const petType = pet.level >= 10 ? 'dragon' : 
                   pet.level >= 5 ? 'fox' : 
                   pet.level >= 2 ? 'rabbit' : 'slime'

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black vs-text text-center mb-2">
        Digital <span className="vs-gradient-text">Pet</span>
      </h1>
      <p className="text-xs vs-text-sub text-center mb-6">
        your lil dopamine buddy. feed it or face the consequences.
      </p>

      {/* Token display */}
      <div className="vs-card border vs-border rounded-xl p-3 mb-4 flex justify-between items-center">
        <span className="text-xs vs-text">Your stash</span>
        <span className="text-sm font-bold vs-accent">🪙 {token}</span>
      </div>

      {/* Pet display */}
      <div className="vs-card border vs-border rounded-2xl p-6 mb-6 text-center">
        <div className="text-8xl mb-2 animate-bounce">
          {petEmoji[petType]}
        </div>
        <p className="text-lg font-bold vs-text mb-1">{pet.name}</p>
        <p className="text-[10px] vs-text-sub mb-3">Lvl {pet.level} • {petType}</p>

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
              <div className="h-full bg-orange-400" style={{ width: `${pet.hunger}%` }} />
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

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={feed}
          disabled={inventory.food === 0}
          className="vs-card border vs-border rounded-xl p-3 text-center vs-hover disabled:opacity-50"
        >
          <Apple size={20} className="mx-auto mb-1 vs-accent" />
          <p className="text-xs font-semibold vs-text">Feed</p>
          <p className="text-[9px] vs-text-sub">x{inventory.food}</p>
        </button>
        <button
          onClick={play}
          disabled={inventory.toy === 0}
          className="vs-card border vs-border rounded-xl p-3 text-center vs-hover disabled:opacity-50"
        >
          <Gamepad2 size={20} className="mx-auto mb-1 vs-accent" />
          <p className="text-xs font-semibold vs-text">Play</p>
          <p className="text-[9px] vs-text-sub">x{inventory.toy}</p>
        </button>
        <button
          onClick={heal}
          disabled={inventory.medicine === 0}
          className="vs-card border vs-border rounded-xl p-3 text-center vs-hover disabled:opacity-50"
        >
          <Heart size={20} className="mx-auto mb-1 vs-accent" />
          <p className="text-xs font-semibold vs-text">Heal</p>
          <p className="text-[9px] vs-text-sub">x{inventory.medicine}</p>
        </button>
      </div>

      {/* Shop */}
      <div className="vs-card border vs-border rounded-xl p-4">
        <p className="text-xs font-bold vs-text mb-3">Pet Shop 🏪</p>
        <div className="space-y-2">
          <button
            onClick={() => buyItem('food', 1)}
            disabled={token < 1}
            className="w-full flex items-center justify-between p-2 rounded-lg vs-hover disabled:opacity-50"
          >
            <span className="text-xs vs-text">🍎 Pet Food</span>
            <span className="text-xs vs-accent">1 🪙</span>
          </button>
          <button
            onClick={() => buyItem('toy', 2)}
            disabled={token < 2}
            className="w-full flex items-center justify-between p-2 rounded-lg vs-hover disabled:opacity-50"
          >
            <span className="text-xs vs-text">🧸 Chew Toy</span>
            <span className="text-xs vs-accent">2 🪙</span>
          </button>
          <button
            onClick={() => buyItem('medicine', 3)}
            disabled={token < 3}
            className="w-full flex items-center justify-between p-2 rounded-lg vs-hover disabled:opacity-50"
          >
            <span className="text-xs vs-text">💊 Med Kit</span>
            <span className="text-xs vs-accent">3 🪙</span>
          </button>
        </div>
      </div>

      {/* Hint */}
      <p className="text-[9px] vs-text-sub text-center mt-6">
        ⚡ pet evolves every 10 levels • get tokens from Dopamine Miner
      </p>
    </div>
  )
}
