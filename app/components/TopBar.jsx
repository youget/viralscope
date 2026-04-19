'use client'
import { useState, useEffect } from 'react'
import { Menu, X, ExternalLink, Download } from 'lucide-react'
import { usePathname } from 'next/navigation'

const sideMenuItems = [
  { label: 'About', href: '/about' },
  { label: 'Disclaimer', href: '/disclaimer' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Pollinations.ai', href: 'https://enter.pollinations.ai', external: true },
]

export default function TopBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    if (pathname !== '/') return
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      const dismissed = localStorage.getItem('vs-install-dismissed')
      if (!dismissed) setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [pathname])

  // Only render on landing page
  if (pathname !== '/') return null

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') {
      setShowInstallBanner(false)
      setInstallPrompt(null)
    }
  }

  function dismissBanner() {
    setShowInstallBanner(false)
    localStorage.setItem('vs-install-dismissed', 'true')
  }

  return (
    <>
      {/* Install Banner */}
      {showInstallBanner && (
        <div className="fixed top-14 left-0 right-0 z-50 px-4 py-2">
          <div className="vs-card border vs-border rounded-xl p-3 flex items-center gap-3 max-w-5xl mx-auto shadow-lg">
            <span className="text-xl">📲</span>
            <div className="flex-1">
              <p className="text-xs font-bold vs-text">Add ViralScape to home screen</p>
              <p className="text-[10px] vs-text-sub">Quick access, app-like experience</p>
            </div>
            <button onClick={handleInstall} className="vs-btn px-3 py-1.5 rounded-lg text-[10px] font-bold">
              Install
            </button>
            <button onClick={dismissBanner} className="vs-text-sub p-1">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 vs-glass border-b vs-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-5xl mx-auto">
          <a href="/" className="text-xl font-extrabold tracking-tight vs-gradient-text">
            ViralScape
          </a>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-xl vs-hover transition-colors vs-text"
              aria-label="Menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Side Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside
            className="absolute right-0 top-14 w-64 h-full vs-card border-l vs-border p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold vs-text-sub uppercase tracking-wider px-4 mb-3">
              Menu
            </p>
            <nav className="flex flex-col gap-1">
              {sideMenuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium vs-text vs-hover transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                  {item.external && <ExternalLink size={14} className="vs-text-sub" />}
                </a>
              ))}

              {installPrompt && (
                <button
                  onClick={() => { handleInstall(); setMenuOpen(false) }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium vs-text vs-hover transition-colors"
                >
                  Install App
                  <Download size={14} className="vs-text-sub" />
                </button>
              )}
            </nav>

            <div className="mt-6 px-4">
              <p className="text-xs font-semibold vs-text-sub uppercase tracking-wider mb-2">API Key</p>
              <KeyStatus />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

function KeyStatus() {
  const [hasKey, setHasKey] = useState(false)

  useEffect(() => {
    setHasKey(!!localStorage.getItem('vs-user-polli-key'))
  }, [])

  if (hasKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs vs-text-sub">Key active</span>
        <button
          onClick={() => {
            localStorage.removeItem('vs-user-polli-key')
            setHasKey(false)
          }}
          className="text-[10px] vs-text-sub hover:underline ml-auto"
        >
          remove
        </button>
      </div>
    )
  }

  return (
    <a href="/ai" className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-gray-400" />
      <span className="text-xs vs-text-sub">No key — using free tier</span>
    </a>
  )
}
