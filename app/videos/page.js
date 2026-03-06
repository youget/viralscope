'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, X, Share2, Heart, Loader2, RefreshCw } from 'lucide-react'

const CACHE_KEY = 'vs-yt-cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000
const FAV_KEY = 'vs-fav-videos'

const niches = [
  { label: 'Trending', q: '' },
  { label: 'Funny', q: 'funny moments' },
  { label: 'Cats', q: 'funny cats short' },
  { label: 'Dogs', q: 'funny dogs short' },
  { label: 'AI', q: 'ai generated' },
  { label: 'Dance', q: 'dance viral' },
  { label: 'Gaming', q: 'gaming moments' },
  { label: 'Fails', q: 'epic fails' },
  { label: 'Food', q: 'food asmr' },
  { label: 'Music', q: 'music viral' },
  { label: 'Sports', q: 'sports highlights' },
  { label: 'Memes', q: 'memes compilation' },
]

const platformPopup = {
  tiktok: {
    emoji: '🚧',
    title: "TikTok? Hold up bestie.",
    desc: "We're still trying to crack TikTok's API without catching a lawsuit. Legal team is 'on it.' Probably napping though.",
  },
  instagram: {
    emoji: '🚧',
    title: "IG? Not yet fam.",
    desc: "Meta said 'talk to my lawyer.' So yeah... we're working on it. Somewhere between never and eventually.",
  },
}

function getToday() {
  return new Date().toDateString()
}

function getCacheKey(type, query) {
  return `${CACHE_KEY}-${type}-${query || 'trending'}-${getToday()}`
}

function getCache(type, query) {
  try {
    const raw = localStorage.getItem(getCacheKey(type, query))
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(getCacheKey(type, query))
      return null
    }
    return data.videos
  } catch { return null }
}

function setCache(type, query, videos) {
  try {
    localStorage.setItem(getCacheKey(type, query), JSON.stringify({
      videos, timestamp: Date.now()
    }))
  } catch {}
}

function clearCache(type, query) {
  try { localStorage.removeItem(getCacheKey(type, query)) } catch {}
}

function getFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]') } catch { return [] }
}

function toggleFav(video) {
  const favs = getFavs()
  const exists = favs.find(f => f.id === video.id)
  let updated
  if (exists) {
    updated = favs.filter(f => f.id !== video.id)
  } else {
    updated = [video, ...favs]
  }
  localStorage.setItem(FAV_KEY, JSON.stringify(updated))
  return updated
}

function isFav(id) {
  return getFavs().some(f => f.id === id)
}

function formatViews(num) {
  const n = parseInt(num)
  if (isNaN(n)) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function VideosPage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [activeNiche, setActiveNiche] = useState(0)
  const [activeVideo, setActiveVideo] = useState(null)
  const [favs, setFavs] = useState([])
  const [popup, setPopup] = useState(null)
  const [searched, setSearched] = useState(false)
  const [currentType, setCurrentType] = useState('trending')
  const [currentQuery, setCurrentQuery] = useState('')
  const nicheRef = useRef(null)

  useEffect(() => {
    setFavs(getFavs())
    loadVideos('trending', '')
  }, [])

  async function loadVideos(type, q, forceRefresh) {
    if (!forceRefresh) {
      const cached = getCache(type, q)
      if (cached) {
        setVideos(cached)
        setSearched(true)
        setCurrentType(type)
        setCurrentQuery(q)
        return
      }
    } else {
      clearCache(type, q)
    }

    setLoading(true)
    setError(null)
    try {
      const params = type === 'search' && q
        ? `?type=search&q=${encodeURIComponent(q)}`
        : '?type=trending'
      const res = await fetch(`/api/youtube${params}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setVideos(data.videos || [])
      setCache(type, q, data.videos || [])
      setSearched(true)
      setCurrentType(type)
      setCurrentQuery(q)
    } catch (err) {
      setError(err.message)
      setVideos([])
    }
    setLoading(false)
  }

  function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) {
      loadVideos('trending', '')
      setActiveNiche(0)
      return
    }
    setActiveNiche(-1)
    loadVideos('search', query.trim())
  }

  function handleNiche(index) {
    setActiveNiche(index)
    const niche = niches[index]
    if (niche.q === '') {
      setQuery('')
      loadVideos('trending', '')
    } else {
      setQuery(niche.q)
      loadVideos('search', niche.q)
    }
  }

  function handleRefresh() {
    if (currentType === 'search' && currentQuery) {
      loadVideos('search', currentQuery, true)
    } else {
      loadVideos('trending', '', true)
    }
  }

  function handleFav(video) {
    const updated = toggleFav(video)
    setFavs(updated)
  }

  async function handleShare(video) {
    const url = `https://youtube.com/watch?v=${video.id}`
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); alert('Link copied!') } catch {}
    }
  }

  function renderVideoGrid() {
    if (videos.length === 0) return null

    const items = []
    videos.forEach((v, i) => {
      if (i === 5) {
        items.push(
          <div key="channel-slot" className="col-span-2 vs-card border vs-border rounded-xl p-4 my-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'var(--vs-accent)', color: '#fff' }}>📺</div>
              <div>
                <p className="text-xs font-bold vs-text">My Channel</p>
                <p className="text-[10px] vs-text-sub">Latest videos coming soon</p>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {[1,2,3,4,5].map(n => (
                <div key={n} className="flex-shrink-0 w-28 aspect-video rounded-lg vs-bg2 flex items-center justify-center">
                  <span className="text-[10px] vs-text-sub">Coming soon</span>
                </div>
              ))}
            </div>
          </div>
        )
      }

      if (i === 10) {
        items.push(
          <div key="ad-slot" className="col-span-2 vs-card border vs-border rounded-xl p-4 my-1 text-center">
            <p className="text-[10px] vs-text-sub uppercase tracking-wider mb-1">sponsored</p>
            <div className="aspect-[3/1] rounded-lg vs-bg2 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm vs-text-sub">Your ad here bestie</p>
                <p className="text-[10px] vs-text-sub mt-1">DM for collab - we don&apos;t bite</p>
              </div>
            </div>
          </div>
        )
      }

      items.push(
        <button
          key={v.id + '-' + i}
          onClick={() => setActiveVideo(v)}
          className="vs-card border vs-border rounded-xl overflow-hidden text-left transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="relative aspect-video">
            <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" loading="lazy" />
            <span className="absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-white">
              {formatDuration(v.durationSec)}
            </span>
            {isFav(v.id) && (
              <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-red-500/90 text-white">♥</span>
            )}
          </div>
          <div className="p-2.5">
            <p className="text-xs font-semibold vs-text leading-snug line-clamp-2">{v.title}</p>
            <p className="text-[10px] vs-text-sub mt-1">{v.channel} • {formatViews(v.views)} views</p>
          </div>
        </button>
      )
    })

    return items
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">

      <h1 className="text-2xl font-black vs-text text-center mb-1">
        The <span className="vs-gradient-text">Rabbit Hole</span>
      </h1>
      <p className="text-xs vs-text-sub text-center mb-5">
        short videos that will ruin your productivity
      </p>

      {/* Platform buttons */}
      <div className="flex gap-2 mb-4">
        <button className="flex-1 py-2.5 rounded-xl text-xs font-bold vs-btn">YouTube</button>
        <button onClick={() => setPopup('tiktok')} className="flex-1 py-2.5 rounded-xl text-xs font-bold vs-btn-outline">TikTok</button>
        <button onClick={() => setPopup('instagram')} className="flex-1 py-2.5 rounded-xl text-xs font-bold vs-btn-outline">Instagram</button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos..."
          className="w-full py-3 px-4 pr-20 rounded-xl vs-card border vs-border text-sm vs-text outline-none focus:border-[var(--vs-accent)] transition-colors"
          style={{ backgroundColor: 'var(--vs-card)' }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={handleRefresh}
            className="w-8 h-8 flex items-center justify-center rounded-lg vs-hover transition-colors vs-text-sub"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="submit"
            className="w-8 h-8 flex items-center justify-center rounded-lg vs-hover transition-colors"
            style={{ color: 'var(--vs-accent)' }}
          >
            <Search size={18} />
          </button>
        </div>
      </form>

      {/* Niches */}
      <div
        ref={nicheRef}
        className="flex gap-2 mb-6 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {niches.map((n, i) => (
          <button
            key={i}
            onClick={() => handleNiche(i)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor: activeNiche === i ? 'var(--vs-accent)' : 'var(--vs-card)',
              color: activeNiche === i ? '#fff' : 'var(--vs-text-sub)',
              border: `1px solid ${activeNiche === i ? 'var(--vs-accent)' : 'var(--vs-border)'}`,
            }}
          >
            {n.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="vs-accent animate-spin mb-3" />
          <p className="text-sm vs-text-sub">Digging through the internet...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="vs-card border vs-border rounded-2xl p-5 text-center my-6">
          <p className="text-2xl mb-2">💀</p>
          <p className="text-sm font-bold vs-text mb-1">Something broke</p>
          <p className="text-xs vs-text-sub">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && searched && videos.length === 0 && (
        <div className="text-center py-20">
          <p className="text-2xl mb-2">🦗</p>
          <p className="text-sm vs-text-sub">Nothing found. The void stares back.</p>
        </div>
      )}

      {/* Video Grid */}
      {!loading && videos.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {renderVideoGrid()}
          </div>

          {/* Bottom message */}
          <div className="vs-card border vs-border rounded-2xl p-5 text-center mt-6">
            <p className="text-xl mb-2">🕳️</p>
            <p className="text-sm font-bold vs-text mb-1">
              You&apos;ve reached the bottom of the rabbit hole
            </p>
            <p className="text-xs vs-text-sub mb-4 leading-relaxed">
              That&apos;s a lot of videos. Your screen time report is gonna be wild.
              Maybe go outside? Or don&apos;t. We&apos;re not your parents.
            </p>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="vs-btn-outline px-5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
            >
              Continue on YouTube <span>↗</span>
            </a>
          </div>
        </>
      )}

      {/* Video Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              className="w-full aspect-video max-h-[70vh]"
              style={{ border: 'none' }}
            />
          </div>
          <div className="p-4 bg-black/95">
            <p className="text-sm font-bold text-white mb-1 line-clamp-2">{activeVideo.title}</p>
            <p className="text-xs text-gray-400 mb-4">{activeVideo.channel} • {formatViews(activeVideo.views)} views</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => handleShare(activeVideo)} className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors" style={{ color: 'var(--vs-accent)' }}>
                <Share2 size={22} />
                <span className="text-[10px] font-semibold text-gray-400">Share</span>
              </button>
              <button onClick={() => setActiveVideo(null)} className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl bg-white/10">
                <X size={22} className="text-white" />
                <span className="text-[10px] font-semibold text-gray-400">Close</span>
              </button>
              <button onClick={() => handleFav(activeVideo)} className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors">
                <Heart size={22} fill={isFav(activeVideo.id) ? 'var(--vs-accent)' : 'none'} style={{ color: 'var(--vs-accent)' }} />
                <span className="text-[10px] font-semibold text-gray-400">{isFav(activeVideo.id) ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Platform Popup */}
      {popup && platformPopup[popup] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setPopup(null)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={(e) => e.stopPropagation()}>
            <p className="text-4xl mb-3">{platformPopup[popup].emoji}</p>
            <h3 className="text-lg font-bold vs-text mb-2">{platformPopup[popup].title}</h3>
            <p className="text-sm vs-text-sub mb-5 leading-relaxed">{platformPopup[popup].desc}</p>
            <button onClick={() => setPopup(null)} className="vs-btn px-6 py-2.5 rounded-xl text-sm font-semibold">Got it</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
