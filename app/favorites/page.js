'use client'
import { useState, useEffect, useRef } from 'react'
import { Trash2, Play, X, Share2, Download, Sparkles, ImageIcon, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { toast } from '../components/Toast'
import { getFavorites, clearFavorites, toggleFavorite } from '../lib/imagedb'

const FAV_VIDEO_KEY = 'vs-fav-videos'

function formatViews(num) { const n = parseInt(num); if (isNaN(n)) return '0'; if (n >= 1000000) return (n/1000000).toFixed(1)+'M'; if (n >= 1000) return (n/1000).toFixed(1)+'K'; return n.toString() }
function formatDuration(sec) { const m = Math.floor(sec/60); const s = sec%60; return `${m}:${s.toString().padStart(2,'0')}` }

export default function FavoritesPage() {
  const [tab, setTab] = useState('videos')
  const [favVideos, setFavVideos] = useState([])
  const [favAI, setFavAI] = useState([])
  const [activeVideo, setActiveVideo] = useState(null)
  const [viewIndex, setViewIndex] = useState(-1)
  const [readMoreText, setReadMoreText] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const touchStartX = useRef(0)

  useEffect(() => {
    try { setFavVideos(JSON.parse(localStorage.getItem(FAV_VIDEO_KEY) || '[]')) } catch {}
    loadFavAI()
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'ai') setTab('ai')
  }, [])

  async function loadFavAI() { setFavAI(await getFavorites()) }

  function removeVideo(id) { const u = favVideos.filter(v => v.id !== id); setFavVideos(u); localStorage.setItem(FAV_VIDEO_KEY, JSON.stringify(u)); toast('Removed') }

  async function removeAI(item) { await toggleFavorite(item.id); await loadFavAI(); toast('Removed from favorites') }

  async function handleClearAll() { setConfirmClear(true) }
  async function confirmClearAll() {
    if (tab === 'videos') { setFavVideos([]); localStorage.setItem(FAV_VIDEO_KEY, '[]') }
    else { await clearFavorites(); await loadFavAI() }
    setConfirmClear(false); toast('All cleared!')
  }

  async function handleShare(video) {
    const url = `https://youtube.com/watch?v=${video.id}`
    if (navigator.share) { try { await navigator.share({ title: video.title, url }) } catch {} }
    else { try { await navigator.clipboard.writeText(url); toast('Link copied!') } catch {} }
  }

  async function copyPrompt(text) { try { await navigator.clipboard.writeText(text); toast('Copied!') } catch {} }

  function openViewer(index) { setViewIndex(index) }
  function closeViewer() { setViewIndex(-1) }
  function prevImage() { if (viewIndex > 0) setViewIndex(viewIndex - 1) }
  function nextImage() { if (viewIndex < favAI.length - 1) setViewIndex(viewIndex + 1) }

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) { if (diff > 0) nextImage(); else prevImage() }
  }

  const currentView = viewIndex >= 0 && viewIndex < favAI.length ? favAI[viewIndex] : null
  const isEmpty = tab === 'videos' ? favVideos.length === 0 : favAI.length === 0

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black vs-text text-center mb-1">Your <span className="vs-gradient-text">Stash</span></h1>
      <p className="text-xs vs-text-sub text-center mb-5">all the good stuff you saved</p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('videos')} className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2" style={{ backgroundColor: tab === 'videos' ? 'var(--vs-accent)' : 'var(--vs-card)', color: tab === 'videos' ? '#fff' : 'var(--vs-text-sub)', border: `1px solid ${tab === 'videos' ? 'var(--vs-accent)' : 'var(--vs-border)'}` }}><Play size={14} /> Videos ({favVideos.length})</button>
        <button onClick={() => setTab('ai')} className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2" style={{ backgroundColor: tab === 'ai' ? 'var(--vs-accent)' : 'var(--vs-card)', color: tab === 'ai' ? '#fff' : 'var(--vs-text-sub)', border: `1px solid ${tab === 'ai' ? 'var(--vs-accent)' : 'var(--vs-border)'}` }}><Sparkles size={14} /> AI ({favAI.length})</button>
      </div>

      {!isEmpty && (<button onClick={handleClearAll} className="flex items-center gap-1 text-xs vs-text-sub mb-4 hover:underline mx-auto" style={{ display: 'flex' }}><Trash2 size={12} /> Clear all</button>)}

      {isEmpty && (<div className="text-center py-20"><p className="text-3xl mb-3">{tab === 'videos' ? '📭' : '🎨'}</p><p className="text-sm font-semibold vs-text mb-1">{tab === 'videos' ? 'No saved videos' : 'No favorites yet'}</p><p className="text-xs vs-text-sub mb-2">{tab === 'videos' ? 'Hit that heart button on videos!' : 'Use ❤️ in AI Generator to save here'}</p><a href={tab === 'videos' ? '/videos' : '/ai?tab=image'} className="vs-btn px-5 py-2 rounded-xl text-xs font-semibold mt-4 inline-flex">{tab === 'videos' ? 'Browse Videos' : 'Generate Images'}</a></div>)}

      {/* VIDEOS */}
      {tab === 'videos' && favVideos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">{favVideos.map(v => (
          <div key={v.id} className="vs-card border vs-border rounded-xl overflow-hidden">
            <button onClick={() => setActiveVideo(v)} className="w-full text-left">
              <div className="relative aspect-video"><img src={v.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" /><span className="absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-white">{formatDuration(v.durationSec)}</span></div>
              <div className="p-2.5"><p className="text-xs font-semibold vs-text leading-snug line-clamp-2">{v.title}</p><p className="text-[10px] vs-text-sub mt-1">{v.channel} • {formatViews(v.views)}</p></div>
            </button>
            <div className="flex border-t vs-border">
              <button onClick={() => handleShare(v)} className="flex-1 py-2 flex items-center justify-center vs-text-sub vs-hover"><Share2 size={14} /></button>
              <button onClick={() => removeVideo(v.id)} className="flex-1 py-2 flex items-center justify-center vs-hover" style={{ color: 'var(--vs-accent)' }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}</div>
      )}

      {/* AI FAVORITES */}
      {tab === 'ai' && favAI.length > 0 && (
        <div className="grid grid-cols-2 gap-3">{favAI.map((item, i) => (
          <div key={item.id} className="vs-card border vs-border rounded-xl overflow-hidden">
            <button onClick={() => openViewer(i)} className="w-full">
              <div className="aspect-square">{item.medium || item.thumbnail ? (<img src={item.medium || item.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />) : (<div className="w-full h-full vs-bg2 flex items-center justify-center"><ImageIcon size={24} className="vs-text-sub" /></div>)}</div>
              <div className="p-2.5"><p className="text-xs vs-text-sub leading-snug line-clamp-2">{item.prompt}</p><p className="text-[10px] vs-text-sub mt-1">{item.model} • {item.size}</p></div>
            </button>
            <div className="flex border-t vs-border">
              <a href={`/ai?tab=image&prompt=${encodeURIComponent(item.prompt)}`} className="flex-1 py-2 flex items-center justify-center text-xs font-semibold vs-text-sub vs-hover">Edit</a>
              <button onClick={() => removeAI(item)} className="flex-1 py-2 flex items-center justify-center vs-hover" style={{ color: 'var(--vs-accent)' }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}</div>
      )}

      {/* IMAGE VIEWER WITH SWIPE */}
      {currentView && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-xs text-gray-400">{viewIndex + 1} / {favAI.length}</p>
            <button onClick={closeViewer} className="text-gray-400 p-1"><X size={20} /></button>
          </div>

          <div className="flex-1 flex items-center justify-center relative px-4">
            {viewIndex > 0 && (<button onClick={prevImage} className="absolute left-2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><ChevronLeft size={20} className="text-white" /></button>)}
            <img src={currentView.medium || currentView.thumbnail} alt="" className="max-w-full max-h-[55vh] rounded-xl object-contain" />
            {viewIndex < favAI.length - 1 && (<button onClick={nextImage} className="absolute right-2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><ChevronRight size={20} className="text-white" /></button>)}
          </div>

          <div className="p-4 max-h-[30vh] overflow-y-auto">
            <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">{currentView.prompt}</p>
            {currentView.prompt.length > 80 && (<button onClick={() => setReadMoreText(currentView.prompt)} className="text-[10px] underline mt-1" style={{ color: 'var(--vs-accent)' }}>Read more</button>)}
            <p className="text-[10px] text-gray-500 mt-2">{currentView.model} • {currentView.size} {currentView.seed ? `• Seed: ${currentView.seed}` : ''}{currentView.style && currentView.style !== 'none' ? ` • ${currentView.style}` : ''}</p>
            <div className="flex gap-2 mt-3">
              <a href={`/ai?tab=image&prompt=${encodeURIComponent(currentView.prompt)}`} className="vs-btn-outline px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1">Edit</a>
              <button onClick={() => { removeAI(currentView); closeViewer() }} className="vs-btn-outline px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1" style={{ borderColor: 'var(--vs-accent)', color: 'var(--vs-accent)' }}><Trash2 size={14} /> Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO PLAYER */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex-1 flex items-center justify-center"><iframe src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; fullscreen" allowFullScreen className="w-full aspect-video max-h-[70vh]" style={{ border: 'none' }} /></div>
          <div className="p-4 bg-black/95">
            <p className="text-sm font-bold text-white mb-1 line-clamp-2">{activeVideo.title}</p><p className="text-xs text-gray-400 mb-4">{activeVideo.channel}</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => handleShare(activeVideo)} className="flex flex-col items-center gap-1 px-4 py-2" style={{ color: 'var(--vs-accent)' }}><Share2 size={22} /><span className="text-[10px] text-gray-400">Share</span></button>
              <button onClick={() => setActiveVideo(null)} className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl bg-white/10"><X size={22} className="text-white" /><span className="text-[10px] text-gray-400">Close</span></button>
              <button onClick={() => { removeVideo(activeVideo.id); setActiveVideo(null) }} className="flex flex-col items-center gap-1 px-4 py-2" style={{ color: 'var(--vs-accent)' }}><Trash2 size={22} /><span className="text-[10px] text-gray-400">Remove</span></button>
            </div>
          </div>
        </div>
      )}

      {/* READ MORE POPUP */}
      {readMoreText && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 px-4 pb-24" onClick={() => setReadMoreText(null)}>
          <div className="vs-card rounded-2xl p-5 max-w-sm w-full border vs-border max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold vs-text">Full Prompt</p>
              <div className="flex items-center gap-2">
                <button onClick={() => copyPrompt(readMoreText)} className="vs-text-sub vs-hover p-1.5 rounded-lg"><Copy size={14} /></button>
                <button onClick={() => setReadMoreText(null)} className="vs-text-sub vs-hover p-1.5 rounded-lg"><X size={14} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto"><p className="text-sm vs-text leading-relaxed">{readMoreText}</p></div>
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setConfirmClear(false)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={e => e.stopPropagation()}>
            <p className="text-4xl mb-3">😬</p>
            <h3 className="text-lg font-bold vs-text mb-2">You sure bestie?</h3>
            <p className="text-sm vs-text-sub mb-5">All your {tab === 'videos' ? 'saved videos' : 'favorite AI creations'} will vanish into the void. No takebacks.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmClear(false)} className="flex-1 vs-btn-outline px-4 py-2.5 rounded-xl text-sm font-semibold">Nah</button>
              <button onClick={confirmClearAll} className="flex-1 vs-btn px-4 py-2.5 rounded-xl text-sm font-semibold">Yeet Everything</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`.line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}`}</style>
    </div>
  )
}
