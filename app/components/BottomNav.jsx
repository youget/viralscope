'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Home, Play, Bot, Star, ExternalLink, Gamepad2 } from 'lucide-react'

const popupData = {
  tiktok: {
    emoji: '🚧',
    title: "TikTok? Hold up bestie.",
    desc: "Still trying to crack TikTok's API without catching a lawsuit. Legal team is 'on it.' Probably napping though.",
  },
  instagram: {
    emoji: '🚧',
    title: "IG? Not yet fam.",
    desc: "Meta said 'talk to my lawyer.' Working on it. Somewhere between never and eventually.",
  },
}

const subMenus = {
  videos: [
    { label: 'YouTube', icon: '▶', href: '/videos' },
    { label: 'TikTok', icon: '♪', popup: 'tiktok' },
    { label: 'Instagram', icon: '◉', popup: 'instagram' },
  ],
  ai: [
    { label: 'Chat', icon: '💬', href: '/ai/chat' },
    { label: 'Create', icon: '✨', href: '/ai/create' },
  ],
  favorites: [
    { label: 'Videos', icon: '▶', href: '/favorites?tab=videos' },
    { label: 'Chat', icon: '💬', href: '/favorites?tab=chat' },
    { label: 'Image', icon: '🖼️', href: '/favorites?tab=image' },
  ],
}

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Play, label: 'Videos', menu: 'videos' },
  { icon: Bot, label: 'AI', menu: 'ai' },
  { icon: Star, label: 'Favs', menu: 'favorites' },
  { icon: Gamepad2, label: 'Game', href: '/game' },
  { icon: ExternalLink, label: 'Pollin', href: 'https://enter.pollinations.ai', external: true },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [activeMenu, setActiveMenu] = useState(null)
  const [popup, setPopup] = useState(null)

  const isGameActive = pathname?.startsWith('/game/') || pathname === '/game'

  const handleNav = (item) => {
    if (item.href && !item.external) { window.location.href = item.href; setActiveMenu(null) }
    else if (item.external) { window.open(item.href, '_blank') }
    else if (item.menu) { setActiveMenu(activeMenu === item.menu ? null : item.menu) }
  }

  const handleSubItem = (sub) => {
    setActiveMenu(null)
    if (sub.popup) setPopup(sub.popup)
    else if (sub.href) window.location.href = sub.href
  }

  return (
    <>
      {/* Sub-menu drawer */}
      {activeMenu && (
        <div className="fixed inset-0 z-30" onClick={() => setActiveMenu(null)}>
          <div
            className="absolute bottom-[68px] left-0 right-0 vs-card border-t vs-border rounded-t-2xl p-4 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: 'var(--vs-border)' }} />
            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
              {subMenus[activeMenu]?.map((sub, i) => (
                <button key={i} onClick={() => handleSubItem(sub)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl vs-hover transition-colors">
                  <span className="text-2xl">{sub.icon}</span>
                  <span className="text-xs font-medium vs-text">{sub.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom popup (no native alert) */}
      {popup && popupData[popup] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setPopup(null)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={e => e.stopPropagation()}>
            <p className="text-4xl mb-3">{popupData[popup].emoji}</p>
            <h3 className="text-lg font-bold vs-text mb-2">{popupData[popup].title}</h3>
            <p className="text-sm vs-text-sub mb-5 leading-relaxed">{popupData[popup].desc}</p>
            <button onClick={() => setPopup(null)} className="vs-btn px-6 py-2.5 rounded-xl text-sm font-semibold">Got it</button>
          </div>
        </div>
      )}

      {/* Nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 vs-glass border-t vs-border">
        <div className="flex items-center justify-around h-[68px] max-w-lg mx-auto px-2">
          {navItems.map((item, i) => {
            const Icon = item.icon
            let isActive = false
            if (item.href === '/') isActive = pathname === '/'
            else if (item.href === '/game') isActive = isGameActive
            else if (item.href) isActive = pathname === item.href
            else if (item.menu === 'ai') isActive = pathname?.startsWith('/ai')
            else if (item.menu === 'favorites') isActive = pathname?.startsWith('/favorites')
            else if (item.menu) isActive = activeMenu === item.menu

            return (
              <button key={i} onClick={() => handleNav(item)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors"
                style={{ color: isActive ? 'var(--vs-accent)' : 'var(--vs-text-sub)' }}>
                <Icon size={20} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
