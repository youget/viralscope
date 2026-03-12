'use client'
import { useState, useEffect, useRef } from 'react'
import { RotateCcw } from 'lucide-react'

const GAME_STORAGE_KEY = 'vs-game-rabbit'

export default function RabbitGame() {
  const canvasRef = useRef(null)
  const [gameState, setGameState] = useState('menu') // 'menu', 'playing', 'gameover'
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(GAME_STORAGE_KEY)
    if (saved) {
      const { highScore } = JSON.parse(saved)
      setHighScore(highScore || 0)
    }
  }, [])

  useEffect(() => {
    if (highScore > 0) {
      localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify({ highScore }))
    }
  }, [highScore])

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    let animationFrame
    let frameCount = 0
    let obstacleX = canvas.width
    let obstacleSpeed = 5
    let playerY = canvas.height - 60
    let playerVelocity = 0
    let gravity = 0.5
    let jumpPower = -10
    let isJumping = false
    let gameScore = 0

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (isJumping) {
        playerVelocity += gravity
        playerY += playerVelocity
        
        if (playerY >= canvas.height - 60) {
          playerY = canvas.height - 60
          playerVelocity = 0
          isJumping = false
        }
      }

      // Update obstacle
      obstacleX -= obstacleSpeed
      if (obstacleX < -30) {
        obstacleX = canvas.width + Math.random() * 200 + 100
        gameScore += 10
        setScore(gameScore)
      }

      // Collision
      if (
        obstacleX < 70 && 
        obstacleX > 20 && 
        playerY > canvas.height - 90
      ) {
        setGameState('gameover')
        if (gameScore > highScore) {
          setHighScore(gameScore)
        }
        return
      }

      ctx.fillStyle = '#FF6B9D'
      ctx.beginPath()
      ctx.arc(50, playerY, 20, 0, Math.PI * 2)
      ctx.fill()
    
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(42, playerY - 5, 4, 0, Math.PI * 2)
      ctx.arc(58, playerY - 5, 4, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(42, playerY - 5, 2, 0, Math.PI * 2)
      ctx.arc(58, playerY - 5, 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#FF6B9D'
      ctx.fillRect(35, playerY - 35, 10, 20)
      ctx.fillRect(55, playerY - 35, 10, 20)

      ctx.fillStyle = '#3B82F6'
      ctx.fillRect(obstacleX, canvas.height - 50, 20, 40)

      ctx.strokeStyle = 'var(--vs-border)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, canvas.height - 30)
      ctx.lineTo(canvas.width, canvas.height - 30)
      ctx.stroke()

      ctx.fillStyle = 'var(--vs-text)'
      ctx.font = 'bold 16px system-ui'
      ctx.fillText(`🏃 ${gameScore}`, 10, 30)

      animationFrame = requestAnimationFrame(render)
    }

    render()

    const handleJump = () => {
      if (!isJumping) {
        playerVelocity = jumpPower
        isJumping = true
      }
    }

    canvas.addEventListener('click', handleJump)
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      handleJump()
    })

    return () => {
      cancelAnimationFrame(animationFrame)
      canvas.removeEventListener('click', handleJump)
      canvas.removeEventListener('touchstart', handleJump)
    }
  }, [gameState])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setGameStarted(true)
  }

  const resetGame = () => {
    setGameState('menu')
    setScore(0)
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black vs-text text-center mb-2">
        Rabbit <span className="vs-gradient-text">Run</span>
      </h1>
      <p className="text-xs vs-text-sub text-center mb-4">
        tap to jump. avoid the blue thing. it's not your friend.
      </p>

      {/* Game */}
      <div className="relative w-full aspect-video bg-[var(--vs-bg2)] rounded-2xl border vs-border overflow-hidden mb-4">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: gameState === 'playing' ? 'block' : 'none' }}
        />

        {gameState !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            {gameState === 'menu' && (
              <>
                <p className="text-4xl mb-3">🐇</p>
                <p className="text-sm font-bold vs-text mb-2">ready to hop?</p>
                <p className="text-xs vs-text-sub mb-4 max-w-xs">
                  high score: {highScore} • tap the screen to jump
                </p>
                <button
                  onClick={startGame}
                  className="vs-btn px-6 py-2.5 rounded-xl text-sm font-semibold"
                >
                  Start Hopping
                </button>
              </>
            )}

            {gameState === 'gameover' && (
              <>
                <p className="text-4xl mb-3">💀</p>
                <p className="text-sm font-bold vs-text mb-2">you got bonked</p>
                <p className="text-xs vs-text-sub mb-1">score: {score}</p>
                <p className="text-xs vs-text-sub mb-4">
                  {score > highScore ? '🎉 new record!' : `best: ${highScore}`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={startGame}
                    className="vs-btn px-6 py-2.5 rounded-xl text-sm font-semibold"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={resetGame}
                    className="vs-btn-outline px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1"
                  >
                    <RotateCcw size={14} /> Menu
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls hint */}
      <p className="text-[9px] vs-text-sub text-center">
        ⚡ tap anywhere on the game to jump • high score saved in your browser
      </p>
    </div>
  )
}
