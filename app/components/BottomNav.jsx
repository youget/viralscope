'use client'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Play, Bot, Star, Gamepad2, ExternalLink } from 'lucide-react'

const navItems = [
  { icon: Home,        label: 'Home',   href: '/' },
  { icon: Play,        label: 'Videos', href: '/videos' },
  { icon: Bot,         label: 'AI',     href: '/ai' },
  { icon: Star,        label: 'Favs',   href: '/favorites' },
  { icon: Gamepad2,    label: 'Game',   href: '/game' },
  { icon: ExternalLink,label: 'Pollin', href: 'https://enter.pollinations.ai', external: true },
]

export default function BottomNav() {
  const pathname = usePathname()

  const handleNav = (item) => {
    if (item.external) { window.open(item.href, '_blank'); return }
    window.location.href = item.href
  }

  const isActive = (item) => {
    if (item.href === '/') return pathname === '/'
    if (item.external) return false
    return pathname?.startsWith(item.href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 vs-glass border-t vs-border">
      <div className="flex items-center justify-around h-[68px] max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <button
              key={item.href}
              onClick={() => handleNav(item)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors"
              style={{ color: active ? 'var(--vs-accent)' : 'var(--vs-text-sub)' }}
            >
              <Icon size={20} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
