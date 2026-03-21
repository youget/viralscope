'use client'
import Link from 'next/link'

export default function GameLobby() {
  const games = [
    {
      name: 'Dopamine',
      icon: '🧠',
      desc: 'clicker to stack that sweet, sweet dopamine. no judgment.',
      href: '/game/dopamine',
      status: 'live',
    },
    {
      name: 'Rabbit',
      icon: '🐇',
      desc: 'endless runner — hop or drop. literally.',
      href: '/game/rabbit',
      status: 'live',
    },
    {
      name: 'Digital Pet',
      icon: '🐣',
      desc: 'raise your lil dopamine buddy. feed it or else.',
      href: '/game/pet',
      status: 'live',
    },
    {
      name: 'Mystery',
      icon: '❓',
      desc: 'literally no one knows. not even us.',
      href: '#',
      status: 'soon',
    },
  ]

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-black vs-text mb-2">
        The <span className="vs-gradient-text">Game Hole</span>
      </h1>
      <p className="text-xs vs-text-sub mb-6">
        pick a game to ruin your day <span className="italic">productively</span>
      </p>

      <div className="grid gap-3">
        {games.map((g) =>
          g.status === 'soon' ? (
            <div
              key={g.href}
              className="vs-card border vs-border rounded-xl p-4 flex items-center gap-3 opacity-50 cursor-not-allowed"
            >
              <span className="text-2xl">{g.icon}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold vs-text">{g.name}</p>
                <p className="text-[10px] vs-text-sub">{g.desc}</p>
              </div>
              <span className="text-[10px] vs-accent font-mono">soon™</span>
            </div>
          ) : (
            <Link
              key={g.href}
              href={g.href}
              className="vs-card border vs-border rounded-xl p-4 flex items-center gap-3 vs-hover transition-all"
            >
              <span className="text-2xl">{g.icon}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold vs-text">{g.name}</p>
                <p className="text-[10px] vs-text-sub">{g.desc}</p>
              </div>
            </Link>
          )
        )}
      </div>

      <p className="text-[9px] vs-text-sub mt-8">
        ⚡ more games coming when we feel like it. or never. we don't know yet.
      </p>
    </div>
  )
}
