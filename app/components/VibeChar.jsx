'use client'
import { useState, useEffect, useRef } from 'react'

const MESSAGES = [
  'what are you looking for? 👀',
  'videos? ai? games?',
  'your brain is calling',
  'all free, no cap fr',
  'built on a phone btw 📱',
  'drop a prompt below 👇',
  'good vibes only zone',
  'scroll down bestie',
]

export default function VibeChar() {
  const [blink, setBlink] = useState(false)
  const [pupil, setPupil] = useState({ x: 0, y: 0 })
  const [mood, setMood] = useState('happy')
  const [msgIdx, setMsgIdx] = useState(0)
  const [msgVisible, setMsgVisible] = useState(true)
  const [wiggle, setWiggle] = useState(false)
  const charRef = useRef(null)
  const blinkTimer = useRef(null)

  // ── Blink scheduler ──────────────────────────────────────────────
  useEffect(() => {
    function scheduleBlink() {
      const delay = 2200 + Math.random() * 4000
      blinkTimer.current = setTimeout(() => {
        setBlink(true)
        setTimeout(() => {
          setBlink(false)
          scheduleBlink()
        }, 130)
      }, delay)
    }
    scheduleBlink()
    return () => clearTimeout(blinkTimer.current)
  }, [])

  // ── Pupil eye-tracking ───────────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      if (!charRef.current) return
      const r = charRef.current.getBoundingClientRect()
      const cx = r.left + r.width * 0.5
      const cy = r.top + r.height * 0.38
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx)
      const dist = Math.min(4, Math.hypot(e.clientX - cx, e.clientY - cy) / 55)
      setPupil({
        x: parseFloat((Math.cos(angle) * dist).toFixed(2)),
        y: parseFloat((Math.sin(angle) * dist).toFixed(2)),
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Touch version — pupils look toward touch
  useEffect(() => {
    const onTouch = (e) => {
      if (!charRef.current || !e.touches[0]) return
      const r = charRef.current.getBoundingClientRect()
      const cx = r.left + r.width * 0.5
      const cy = r.top + r.height * 0.38
      const angle = Math.atan2(e.touches[0].clientY - cy, e.touches[0].clientX - cx)
      const dist = Math.min(4, 3)
      setPupil({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist })
    }
    window.addEventListener('touchstart', onTouch, { passive: true })
    return () => window.removeEventListener('touchstart', onTouch)
  }, [])

  // ── Scroll mood change ───────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y > 350) setMood('excited')
      else setMood('happy')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Click wiggle ─────────────────────────────────────────────────
  const handleClick = () => {
    setWiggle(true)
    setTimeout(() => setWiggle(false), 600)
  }

  // ── Message rotation ─────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      setMsgVisible(false)
      setTimeout(() => {
        setMsgIdx(i => (i + 1) % MESSAGES.length)
        setMsgVisible(true)
      }, 280)
    }, 3800)
    return () => clearInterval(iv)
  }, [])

  // Derived values
  const eyeRY = blink ? 1.5 : 13
  const eyeCY = blink ? 97 : 93
  const mouthD = mood === 'excited'
    ? 'M 60 128 Q 80 148 100 128'
    : 'M 63 126 Q 80 138 97 126'

  return (
    <div
      ref={charRef}
      onClick={handleClick}
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* CSS animations */}
      <style>{`
        @keyframes vibeFloat {
          0%,100% { transform: translateY(0px) rotate(-0.8deg); }
          50%      { transform: translateY(-13px) rotate(0.8deg); }
        }
        @keyframes vibeWiggle {
          0%,100% { transform: rotate(0deg); }
          20%     { transform: rotate(-8deg) scale(1.05); }
          40%     { transform: rotate(8deg) scale(0.97); }
          60%     { transform: rotate(-5deg) scale(1.03); }
          80%     { transform: rotate(4deg); }
        }
        @keyframes vibeMsgIn {
          from { opacity: 0; transform: translateY(5px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes vibeMsgOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes vibeSparkle {
          0%,100% { opacity: 0.2; transform: scale(0.7) rotate(0deg); }
          50%     { opacity: 1; transform: scale(1.1) rotate(20deg); }
        }
        @keyframes vibeSparkle2 {
          0%,100% { opacity: 0.15; transform: scale(0.6) rotate(0deg); }
          60%     { opacity: 0.9; transform: scale(1) rotate(-15deg); }
        }
      `}</style>

      {/* Speech bubble */}
      <div
        style={{
          background: 'var(--vs-card)',
          border: '1.5px solid var(--vs-border)',
          borderRadius: 14,
          padding: '7px 14px',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--vs-text)',
          whiteSpace: 'nowrap',
          marginBottom: 6,
          position: 'relative',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          animation: msgVisible
            ? 'vibeMsgIn 0.28s ease forwards'
            : 'vibeMsgOut 0.22s ease forwards',
        }}
      >
        {MESSAGES[msgIdx]}
        {/* Tail */}
        <div style={{
          position: 'absolute',
          bottom: -7,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: '7px solid var(--vs-border)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -5,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid var(--vs-card)',
        }} />
      </div>

      {/* Floating sparkles */}
      <div style={{ position: 'relative', width: 170, height: 195 }}>
        {/* Sparkle top-right */}
        <div style={{
          position: 'absolute', top: 14, right: 8,
          fontSize: 14, lineHeight: 1,
          animation: 'vibeSparkle 2.4s ease-in-out infinite',
          animationDelay: '0.3s',
          color: 'var(--vs-accent)',
        }}>✦</div>
        {/* Sparkle left */}
        <div style={{
          position: 'absolute', top: 55, left: 4,
          fontSize: 10, lineHeight: 1,
          animation: 'vibeSparkle2 3s ease-in-out infinite',
          animationDelay: '1.1s',
          color: 'var(--vs-accent2)',
        }}>✦</div>
        {/* Sparkle bottom-right */}
        <div style={{
          position: 'absolute', bottom: 28, right: 6,
          fontSize: 9, lineHeight: 1,
          animation: 'vibeSparkle 2.8s ease-in-out infinite',
          animationDelay: '0.8s',
          color: 'var(--vs-accent)',
        }}>✦</div>

        {/* Character with float + optional wiggle */}
        <svg
          viewBox="0 0 160 195"
          width="160"
          height="195"
          style={{
            display: 'block',
            animation: wiggle
              ? 'vibeWiggle 0.6s ease'
              : 'vibeFloat 3.2s ease-in-out infinite',
            transformOrigin: 'center bottom',
            overflow: 'visible',
          }}
        >
          {/* ── Drop shadow (subtle) ── */}
          <ellipse cx="80" cy="190" rx="44" ry="6"
            fill="currentColor" opacity="0.08" />

          {/* ── Body blob ── */}
          <path
            d="M80 12 C108 10,148 36,151 76 C154 116,136 162,100 174 C84 180,68 180,52 174 C20 162,6 118,9 78 C12 38,52 14,80 12 Z"
            style={{ fill: 'var(--vs-accent)' }}
          />
          {/* Body highlight — top shine */}
          <path
            d="M72 20 C90 16,118 30,126 52 C115 40,98 28,72 20 Z"
            fill="white" opacity="0.18"
          />

          {/* ── Headphones band ── */}
          <path
            d="M26 80 Q80 14 134 80"
            stroke="var(--vs-text)" strokeWidth="5.5" fill="none"
            strokeLinecap="round" opacity="0.85"
          />
          {/* Left ear cup outer */}
          <ellipse cx="20" cy="88" rx="13" ry="16"
            fill="var(--vs-text)" opacity="0.85" />
          {/* Left ear cup inner */}
          <ellipse cx="20" cy="88" rx="8" ry="10"
            style={{ fill: 'var(--vs-accent2)' }} />
          {/* Right ear cup outer */}
          <ellipse cx="140" cy="88" rx="13" ry="16"
            fill="var(--vs-text)" opacity="0.85" />
          {/* Right ear cup inner */}
          <ellipse cx="140" cy="88" rx="8" ry="10"
            style={{ fill: 'var(--vs-accent2)' }} />

          {/* ── Left eye ── */}
          <ellipse cx="57" cy={eyeCY} rx="17" ry={eyeRY}
            fill="white" />
          {!blink && (
            <>
              <circle cx={57 + pupil.x} cy={eyeCY + pupil.y} r="9"
                fill="#0f0f1a" />
              {/* Shine dot */}
              <circle cx={57 + pupil.x + 3.5} cy={eyeCY + pupil.y - 3.5} r="3"
                fill="white" opacity="0.85" />
            </>
          )}

          {/* ── Right eye ── */}
          <ellipse cx="103" cy={eyeCY} rx="17" ry={eyeRY}
            fill="white" />
          {!blink && (
            <>
              <circle cx={103 + pupil.x} cy={eyeCY + pupil.y} r="9"
                fill="#0f0f1a" />
              <circle cx={103 + pupil.x + 3.5} cy={eyeCY + pupil.y - 3.5} r="3"
                fill="white" opacity="0.85" />
            </>
          )}

          {/* ── Mouth ── */}
          <path
            d={mouthD}
            stroke="#0f0f1a" strokeWidth="2.8" fill="none"
            strokeLinecap="round"
            style={{ transition: 'd 0.4s ease' }}
          />
          {/* Teeth hint when excited */}
          {mood === 'excited' && (
            <path
              d="M 66 132 Q 80 140, 94 132 L 94 138 Q 80 146, 66 138 Z"
              fill="white" opacity="0.85"
            />
          )}

          {/* ── Cheek blushes ── */}
          <ellipse cx="40" cy="116" rx="12" ry="7"
            fill="white" opacity="0.22" />
          <ellipse cx="120" cy="116" rx="12" ry="7"
            fill="white" opacity="0.22" />

          {/* ── Tiny note on headphone (decorative) ── */}
          <text x="147" y="76" fontSize="9" fill="var(--vs-text-sub)"
            opacity="0.5" textAnchor="middle">♪</text>
        </svg>
      </div>

      {/* Tap hint */}
      <p style={{
        fontSize: 9,
        color: 'var(--vs-text-sub)',
        marginTop: 2,
        opacity: 0.55,
      }}>tap me</p>
    </div>
  )
}
