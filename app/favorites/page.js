'use client'
import { useState, useEffect } from 'react'
import { Trash2, Play, X, Share2, Image, Download, ExternalLink } from 'lucide-react'

const FAV_VIDEO_KEY = 'vs-fav-videos'
const FAV_AI_KEY = 'vs-fav-ai'

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

export default function FavoritesPage() {
  const [tab, setTab] = useState('videos')
  const [favVideos, setFavVideos] = useState([])
  const [favAI, setFavAI] = useState([])
  const [activeVideo, setActiveVideo] = useState(null)
  const [viewImage, setViewImage] = useState(null)

  useEffect(() => {
    try {
      setFavVideos(JSON.parse(localStorage.getItem(FAV_VIDEO_KEY) || '[]'))
      setFavAI(JSON.parse(localStorage.getItem(FAV_AI_KEY) || '[]'))
    } catch {}

    const params = new URLSearchParams(window.location.search)
    const t = params.get('tab')
    if (t === 'ai') setTab('ai')
    if (t === 'videos') setTab('videos')
  }, [])

  function removeVideo(id) {
    const updated = favVideos.filter(v => v.id !== id)
    setFavVideos(updated)
    localStorage.setItem(FAV_VIDEO_KEY, JSON.stringify(updated))
  }

  function removeAI(index) {
    const updated = favAI.filter((_, i) => i !== index)
    setFavAI(updated)
    localStorage.setItem(FAV_AI_KEY, JSON.stringify(updated))
  }

  function clearAll() {
    if (tab === 'videos') {
      setFavVideos([])
      localStorage.setItem(FAV_VIDEO_KEY, '[]')
    } else {
      setFavAI([])
      localStorage.setItem(FAV_AI_KEY, '[]')
    }
  }

  async function handleShare(video) {
    const url = `https://youtube.com/watch?v=${video.id}`
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url }) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url)
        alert('Link copied!')
      } catch {}
    }
  }

  function handleDownloadAI(item) {
    const a = document.createElement('a')
    a.href = item.url
    a.download = `viralscope-${Date.now()}.png`
    a.click()
  }

  const currentList = tab === 'videos' ? favVideos : favAI
  const isEmpty = currentList.length === 0

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black vs-text text-center mb-1">
        Your <span className="vs-gradient-text">Stash</span>
      </h1>
      <p className="text-xs vs-text-sub text-center mb-5">
        all the good stuff you saved
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('videos')}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          style={{
            backgroundColor: tab === 'videos' ? 'var(--vs-accent)' : 'var(--vs-card)',
            color: tab === 'videos' ? '#fff' : 'var(--vs-text-sub)',
            border: `1px solid ${tab === 'videos' ? 'var(--vs-accent)' : 'var(--vs-border)'}`,
          }}
        >
          <Play size={14} /> Videos ({favVideos.length})
        </button>
        <button
          onClick={() => setTab('ai')}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          style={{
            backgroundColor: tab === 'ai' ? 'var(--vs-accent)' : 'var(--vs-card)',
            color: tab === 'ai' ? '#fff' : 'var(--vs-text-sub)',
            border: `1px solid ${tab === 'ai' ? 'var(--vs-accent)' : 'var(--vs-border)'}`,
          }}
        >
          <Image size={14} /> AI Stuff ({favAI.length})
        </button>
      </div>

      {!isEmpty && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 text-xs vs-text-sub mb-4 hover:underline mx-auto"
          style={{ display: 'flex' }}
        >
          <Trash2 size={12} /> Clear all {tab}
        </button>
      )}

      {isEmpty && (
        <div className="text-center py-20">
          <p className="text-3xl mb-3">{tab === 'videos' ? '📭' : '🎨'}</p>
          <p className="text-sm font-semibold vs-text mb-1">
            {tab === 'videos' ? 'No saved videos yet' : 'No AI creations yet'}
          </p>
          <p className="text-xs vs-text-sub">
            {tab === 'videos'
              ? 'Go watch some videos and hit that heart button!'
              : 'Generate some AI images and they\'ll show up here!'}
          </p>
          <a
            href={tab === 'videos' ? '/videos' : '/ai?tab=image'}
            className="vs-btn px-5 py-2 rounded-xl text-xs font-semibold mt-4 inline-flex"
          >
            {tab === 'videos' ? 'Browse Videos' : 'Try AI Generator'}
          </a>
        </div>
      )}

      {/* VIDEO FAVORITES */}
      {tab === 'videos' && favVideos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {favVideos.map((v) => (
            <div key={v.id} className="vs-card border vs-border rounded-xl overflow-hidden">
              <button onClick={() => setActiveVideo(v)} className="w-full text-left">
                <div className="relative aspect-video">
                  <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" loading="lazy" />
                  <span className="absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-white">
                    {formatDuration(v.durationSec)}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold vs-text leading-snug line-clamp-2">{v.title}</p>
                  <p className="text-[10px] vs-text-sub mt-1">{v.channel} • {formatViews(v.views)} views</p>
                </div>
              </button>
              <div className="flex border-t vs-border">
                <button onClick={() => handleShare(v)} className="flex-1 py-2 flex items-center justify-center vs-text-sub vs-hover">
                  <Share2 size={14} />
                </button>
                <button onClick={() => removeVideo(v.id)} className="flex-1 py-2 flex items-center justify-center vs-hover" style={{ color: 'var(--vs-accent)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI FAVORITES */}
      {tab === 'ai' && favAI.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {favAI.map((item, i) => (
            <div key={i} className="vs-card border vs-border rounded-xl overflow-hidden">
              <button onClick={() => setViewImage(item)} className="w-full">
                <div className="aspect-square">
                  <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-2.5">
                  <p className="text-xs vs-text-sub leading-snug line-clamp-2">{item.prompt}</p>
                  <p className="text-[10px] vs-text-sub mt-1">
                    {item.model} • {item.size} {item.seed ? `• Seed: ${item.seed}` : ''}
                  </p>
                </div>
              </button>
              <div className="flex border-t vs-border">
                <a
                  href={`/ai?tab=image&prompt=${encodeURIComponent(item.prompt)}`}
                  className="flex-1 py-2 flex items-center justify-center text-xs font-semibold vs-text-sub vs-hover gap-1"
                >
                  Edit
                </a>
                <button onClick={() => handleDownloadAI(item)} className="flex-1 py-2 flex items-center justify-center vs-text-sub vs-hover">
                  <Download size={14} />
                </button>
                <button onClick={() => removeAI(i)} className="flex-1 py-2 flex items-center justify-center vs-hover" style={{ color: 'var(--vs-accent)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIDEO PLAYER */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex-1 flex items-center justify-center">
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
            <p className="text-xs text-gray-400 mb-4">{activeVideo.channel}</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => handleShare(activeVideo)} className="flex flex-col items-center gap-1 px-4 py-2" style={{ color: 'var(--vs-accent)' }}>
                <Share2 size={22} />
                <span className="text-[10px] text-gray-400">Share</span>
              </button>
              <button onClick={() => setActiveVideo(null)} className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl bg-white/10">
                <X size={22} className="text-white" />
                <span className="text-[10px] text-gray-400">Close</span>
              </button>
              <button onClick={() => { removeVideo(activeVideo.id); setActiveVideo(null) }} className="flex flex-col items-center gap-1 px-4 py-2" style={{ color: 'var(--vs-accent)' }}>
                <Trash2 size={22} />
                <span className="text-[10px] text-gray-400">Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE VIEWER */}
      {viewImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <img src={viewImage.url} alt={viewImage.prompt} className="max-w-full max-h-[60vh] rounded-xl" onClick={(e) => e.stopPropagation()} />
          <p className="text-sm text-gray-400 mt-4 text-center max-w-sm">{viewImage.prompt}</p>
          <p className="text-[10px] text-gray-500 mt-1">
            {viewImage.model} • {viewImage.size} {viewImage.seed ? `• Seed: ${viewImage.seed}` : ''}
          </p>
          <div className="flex gap-3 mt-4">
            <a href={`/ai?tab=image&prompt=${encodeURIComponent(viewImage.prompt)}`} className="vs-btn-outline px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1">
              Edit Prompt
            </a>
            <button onClick={() => { const a = document.createElement('a'); a.href = viewImage.url; a.download = `viralscope-${Date.now()}.png`; a.click() }} className="vs-btn px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1">
              <Download size={14} /> Download
            </button>
          </div>
          <button onClick={() => setViewImage(null)} className="mt-4 text-[10px] text-gray-500 hover:underline">Close</button>
        </div>
      )}

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
