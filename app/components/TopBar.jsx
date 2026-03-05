'use client'
import { useState } from 'react'
import { Sun, Moon, Menu, X, ExternalLink } from 'lucide-react'
import { useTheme } from './ThemeProvider'

const sideMenuItems = [
  { label: 'About', href: '/about' },
  { label: 'Disclaimer', href: '/disclaimer' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Pollinations.ai', href: 'https://enter.pollinations.ai', external: true },
]

export default function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 vs-glass border-b vs-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-5xl mx-auto">
          <span className="text-xl font-extrabold tracking-tight vs-gradient-text">
            ViralScope
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-xl vs-hover transition-colors vs-text"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
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
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}
