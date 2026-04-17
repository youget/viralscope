'use client'
import Link from 'next/link'
import { MessageCircle, Stars, Hammer, Image, Mic, Film } from 'lucide-react'

const chatTools = [
  {
    icon: Stars,
    label: 'Fortune',
    emoji: '🔮',
    desc: 'Tarot, horoskop, dan semua hal mistis yang bikin kamu takut tapi tetap penasaran.',
    href: '/ai/chat?tab=peramal',
  },
  {
    icon: MessageCircle,
    label: 'Story',
    emoji: '📖',
    desc: 'Bangun cerita, karakter, dan dunia yang bikin orang susah berhenti baca.',
    href: '/ai/chat?tab=story',
  },
  {
    icon: Hammer,
    label: 'Builder',
    emoji: '🏗️',
    desc: 'Blueprint Engine — ubah ide mentah jadi spec siap eksekusi. Buat app, channel, atau prompts.',
    href: '/ai/chat?tab=builder',
  },
]

const createTools = [
  {
    icon: Image,
    label: 'Image',
    emoji: '🎨',
    desc: 'Generate gambar AI dari teks. Dari realistis sampai cursed art. No judgment.',
    href: '/ai/create?tab=image',
  },
  {
    icon: Mic,
    label: 'Audio',
    emoji: '🎙️',
    desc: 'Text-to-speech atau generate musik. Bikin konten lo beneran bunyi.',
    href: '/ai/create?tab=audio',
  },
  {
    icon: Film,
    label: 'Video',
    emoji: '🎬',
    desc: 'Generate video dari teks. Masih beta, tapi kalo berhasil lo bakal screaming.',
    href: '/ai/create?tab=video',
  },
]

function ToolCard({ item }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className="vs-card border vs-border rounded-xl p-4 flex items-start gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--vs-bg2)' }}
      >
        <Icon size={20} style={{ color: 'var(--vs-text)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold vs-text mb-0.5">{item.label}</p>
        <p className="text-[11px] vs-text-sub leading-relaxed">{item.desc}</p>
      </div>
      <span className="text-xl flex-shrink-0">{item.emoji}</span>
    </Link>
  )
}

export default function AIPage() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black vs-text text-center mb-1">
        AI <span className="vs-gradient-text">Toolbox</span>
      </h1>
      <p className="text-xs vs-text-sub text-center mb-8">
        semua yang lo butuhkan buat bikin konten kelas dunia. atau sekadar buang waktu secara produktif.
      </p>

      <div className="mb-6">
        <p className="text-[10px] font-bold vs-text-sub uppercase tracking-wider mb-3">
          💬 Chat Tools
        </p>
        <div className="flex flex-col gap-3">
          {chatTools.map((t) => <ToolCard key={t.href} item={t} />)}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold vs-text-sub uppercase tracking-wider mb-3">
          ✨ Create Tools
        </p>
        <div className="flex flex-col gap-3">
          {createTools.map((t) => <ToolCard key={t.href} item={t} />)}
        </div>
      </div>

      <p className="text-[9px] vs-text-sub text-center mt-8">
        ⚡ powered by Pollinations.ai · api key optional untuk fitur premium
      </p>
    </div>
  )
}
