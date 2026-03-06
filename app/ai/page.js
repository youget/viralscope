'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, Image, MessageSquare, Mic, Film, Sparkles, Shuffle, Download, Heart, Loader2, ChevronDown, X, ExternalLink } from 'lucide-react'

const FAV_AI_KEY = 'vs-fav-ai'
const RECENT_KEY = 'vs-recent-ai'

const FREE_MODELS = [
  { id: 'flux', label: 'Flux Schnell', free: true },
  { id: 'zimage', label: 'Z-Image Turbo', free: true },
]

const BYOP_MODELS = [
  { id: 'imagen-4', label: 'Imagen 4' },
  { id: 'grok-imagine', label: 'Grok Imagine' },
  { id: 'klein', label: 'FLUX.2 Klein 4B' },
  { id: 'klein-large', label: 'FLUX.2 Klein 9B' },
  { id: 'gptimage', label: 'GPT Image 1 Mini' },
]

const SIZES = [
  { label: '1:1', w: 1024, h: 1024 },
  { label: '16:9', w: 1344, h: 768 },
  { label: '9:16', w: 768, h: 1344 },
  { label: '4:3', w: 1152, h: 896 },
  { label: '3:4', w: 896, h: 1152 },
]

const RANDOM_PROMPTS = [
  'A cat wearing a tiny business suit in a board meeting',
  'A raccoon DJ at a neon underground rave',
  'A goldfish piloting a tiny spaceship through a galaxy',
  'A penguin surfing on a rainbow wave',
  'A hamster as a medieval knight fighting a dragon made of cheese',
  'A sloth running a coffee shop in a treehouse',
  'A frog playing electric guitar on stage at a rock concert',
  'An octopus as a sushi chef with confused expression',
  'A dog astronaut planting a flag on the moon made of bones',
  'A duck as a detective solving a bread theft mystery',
  'A bunny samurai in a cherry blossom forest',
  'A capybara relaxing in a hot tub with sunglasses',
]

const BYOP_POPUP = {
  emoji: '🔑',
  title: 'Premium Model — BYOP',
  desc: 'This model needs your own Pollinations API key (Bring Your Own Pollen). Get one at pollinations.ai — it unlocks the good stuff.',
  link: 'https://pollinations.ai',
}

const KEY_POPUP = {
  emoji: '🔑',
  title: 'API Key Required',
  desc: 'This feature requires a Pollinations API key to work. Head over to pollinations.ai to get yours!',
  link: 'https://pollinations.ai',
}

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

function addRecent(item) {
  const list = getRecent()
  list.unshift(item)
  const trimmed = list.slice(0, 10)
  localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed))
  return trimmed
}

function getFavAI() {
  try { return JSON.parse(localStorage.getItem(FAV_AI_KEY) || '[]') } catch { return [] }
}

function addFavAI(item) {
  const list = getFavAI()
  list.unshift(item)
  localStorage.setItem(FAV_AI_KEY, JSON.stringify(list))
}

export default function AIPage() {
  const [tab, setTab] = useState('chat')
  const [popup, setPopup] = useState(null)

  // chat state
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: "Yo what's good! I'm your AI buddy. Ask me anything — I promise I'm only slightly unhinged." }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  // image state
  const [imgPrompt, setImgPrompt] = useState('')
  const [imgModel, setImgModel] = useState('flux')
  const [imgSize, setImgSize] = useState(0)
  const [imgLoading, setImgLoading] = useState(false)
  const [imgResult, setImgResult] = useState(null)
  const [imgError, setImgError] = useState(null)
  const [recent, setRecent] = useState([])
  const [enhancing, setEnhancing] = useState(false)

  useEffect(() => {
    setRecent(getRecent())
    const params = new URLSearchParams(window.location.search)
    const p = params.get('prompt')
    if (p) {
      setImgPrompt(p)
      setTab('image')
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ===== CHAT =====
  async function handleChat(e) {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    const userMsg = { role: 'user', content: chatInput.trim() }
    const newMessages = [...chatMessages, userMsg]
    setChatMessages(newMessages)
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', messages: newMessages }),
      })
      const data = await res.json()
      setChatMessages([...newMessages, { role: 'assistant', content: data.result || 'Bruh I got nothing. Try again?' }])
    } catch {
      setChatMessages([...newMessages, { role: 'assistant', content: 'Something broke. My brain lagged. Try again?' }])
    }
    setChatLoading(false)
  }

  // ===== IMAGE =====
  function handleRandomPrompt() {
    const r = RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)]
    setImgPrompt(r)
  }

  async function handleEnhance() {
    if (!imgPrompt.trim() || enhancing) return
    setEnhancing(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enhance', prompt: imgPrompt }),
      })
      const data = await res.json()
      if (data.result) setImgPrompt(data.result)
    } catch {}
    setEnhancing(false)
  }

  async function handleGenerate() {
    if (!imgPrompt.trim() || imgLoading) return
    setImgLoading(true)
    setImgError(null)
    setImgResult(null)
    try {
      const size = SIZES[imgSize]
      const encoded = encodeURIComponent(imgPrompt.trim())
      const seed = Math.floor(Math.random() * 999999)
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=${size.w}&height=${size.h}&model=${imgModel}&seed=${seed}&nologo=true&safe=true`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Generation failed')

      const blob = await res.blob()
      const imgUrl = URL.createObjectURL(blob)

      setImgResult({ url: imgUrl, blobUrl: url, prompt: imgPrompt, model: imgModel, size: size.label })
      const newRecent = addRecent({ url, prompt: imgPrompt, model: imgModel, size: size.label })
      setRecent(newRecent)
    } catch (err) {
      setImgError(err.message)
    }
    setImgLoading(false)
  }

  function handleSaveAI() {
    if (!imgResult) return
    addFavAI({ url: imgResult.blobUrl, prompt: imgResult.prompt, model: imgResult.model, size: imgResult.size })
    alert('Saved to favorites!')
  }

  function handleDownload() {
    if (!imgResult) return
    const a = document.createElement('a')
    a.href = imgResult.url
    a.download = `viralscope-${Date.now()}.png`
    a.click()
  }

  function handleBYOPModel() {
    setPopup('byop')
  }

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'image', label: 'Image', icon: Image },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'video', label: 'Video', icon: Film },
  ]

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black vs-text text-center mb-1">
        AI <span className="vs-gradient-text">Playground</span>
      </h1>
      <p className="text-xs vs-text-sub text-center mb-2">
        create unhinged stuff with artificial brainpower
      </p>
      <p className="text-[10px] text-center mb-5 px-3 py-1.5 rounded-full vs-card border vs-border inline-flex mx-auto items-center gap-1" style={{ display: 'flex', width: 'fit-content', margin: '0 auto 20px auto' }}>
        <Sparkles size={10} style={{ color: 'var(--vs-accent)' }} />
        <span className="vs-text-sub">Free: Flux & Z-Image (5K imgs/day) — BYOP for premium models</span>
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 vs-card border vs-border rounded-xl p-1">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === 'voice') { setPopup('key'); return }
                if (t.id === 'video') { setPopup('key'); return }
                setTab(t.id)
              }}
              className="flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              style={{
                backgroundColor: tab === t.id ? 'var(--vs-accent)' : 'transparent',
                color: tab === t.id ? '#fff' : 'var(--vs-text-sub)',
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ===== CHAT TAB ===== */}
      {tab === 'chat' && (
        <div className="flex flex-col" style={{ height: 'calc(100vh - 320px)' }}>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-4 pr-1">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'self-end text-white rounded-br-sm'
                    : 'self-start vs-card border vs-border vs-text rounded-bl-sm'
                }`}
                style={msg.role === 'user' ? { backgroundColor: 'var(--vs-accent)' } : {}}
              >
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="self-start px-4 py-3 rounded-2xl rounded-bl-sm vs-card border vs-border">
                <Loader2 size={16} className="animate-spin vs-text-sub" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Say something..."
              className="flex-1 py-3 px-4 rounded-xl vs-card border vs-border text-sm vs-text outline-none"
              style={{ backgroundColor: 'var(--vs-card)' }}
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="vs-btn w-11 h-11 rounded-xl flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* ===== IMAGE TAB ===== */}
      {tab === 'image' && (
        <div>
          {/* Model selection */}
          <div className="mb-4">
            <p className="text-xs font-semibold vs-text mb-2">Model</p>
            <div className="flex flex-wrap gap-2">
              {FREE_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setImgModel(m.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: imgModel === m.id ? 'var(--vs-accent)' : 'var(--vs-card)',
                    color: imgModel === m.id ? '#fff' : 'var(--vs-text-sub)',
                    border: `1px solid ${imgModel === m.id ? 'var(--vs-accent)' : 'var(--vs-border)'}`,
                  }}
                >
                  {m.label} ✨
                </button>
              ))}
              {BYOP_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={handleBYOPModel}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold vs-card border vs-border vs-text-sub"
                >
                  {m.label} 🔑
                </button>
              ))}
            </div>
          </div>

          {/* Size selection */}
          <div className="mb-4">
            <p className="text-xs font-semibold vs-text mb-2">Size</p>
            <div className="flex gap-2">
              {SIZES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setImgSize(i)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: imgSize === i ? 'var(--vs-accent)' : 'var(--vs-card)',
                    color: imgSize === i ? '#fff' : 'var(--vs-text-sub)',
                    border: `1px solid ${imgSize === i ? 'var(--vs-accent)' : 'var(--vs-border)'}`,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          <div className="mb-4">
            <p className="text-xs font-semibold vs-text mb-2">Prompt</p>
            <textarea
              value={imgPrompt}
              onChange={(e) => setImgPrompt(e.target.value)}
              placeholder="Describe what you want to see..."
              rows={3}
              className="w-full py-3 px-4 rounded-xl vs-card border vs-border text-sm vs-text outline-none resize-none"
              style={{ backgroundColor: 'var(--vs-card)' }}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleRandomPrompt}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold vs-card border vs-border vs-text-sub vs-hover"
              >
                <Shuffle size={12} /> Random
              </button>
              <button
                onClick={handleEnhance}
                disabled={enhancing || !imgPrompt.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold vs-card border vs-border vs-text-sub vs-hover"
              >
                <Sparkles size={12} /> {enhancing ? 'Enhancing...' : 'Enhance'}
              </button>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={imgLoading || !imgPrompt.trim()}
            className="vs-btn w-full py-3 rounded-xl text-sm font-bold mb-6 gap-2"
            style={{ opacity: imgLoading || !imgPrompt.trim() ? 0.5 : 1 }}
          >
            {imgLoading ? (
              <><Loader2 size={16} className="animate-spin" /> Cooking your image...</>
            ) : (
              <><Sparkles size={16} /> Generate</>
            )}
          </button>

          {/* Error */}
          {imgError && (
            <div className="vs-card border vs-border rounded-xl p-4 text-center mb-6">
              <p className="text-xl mb-1">💀</p>
              <p className="text-xs vs-text-sub">{imgError}</p>
            </div>
          )}

          {/* Result */}
          {imgResult && (
            <div className="vs-card border vs-border rounded-2xl overflow-hidden mb-6">
              <img
                src={imgResult.url}
                alt={imgResult.prompt}
                className="w-full"
              />
              <div className="p-4">
                <p className="text-xs vs-text-sub mb-3 leading-relaxed">{imgResult.prompt}</p>
                <p className="text-[10px] vs-text-sub mb-3">Model: {imgResult.model} • Size: {imgResult.size}</p>
                <div className="flex gap-2">
                  <button onClick={handleDownload} className="flex-1 vs-btn py-2.5 rounded-xl text-xs font-semibold gap-1">
                    <Download size={14} /> Download
                  </button>
                  <button onClick={handleSaveAI} className="flex-1 vs-btn-outline py-2.5 rounded-xl text-xs font-semibold gap-1">
                    <Heart size={14} /> Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recent */}
          {recent.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold vs-text">Recent ({recent.length})</p>
                <a href="/favorites" className="text-[10px] vs-text-sub hover:underline flex items-center gap-1">
                  All in Favorites <ExternalLink size={10} />
                </a>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {recent.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { setImgPrompt(item.prompt); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border vs-border vs-hover"
                  >
                    <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
              <p className="text-[10px] vs-text-sub mt-2">
                Click a thumbnail to reuse its prompt. All generations saved in <a href="/favorites" className="underline">Favorites</a>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ===== POPUP ===== */}
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setPopup(null)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={(e) => e.stopPropagation()}>
            <p className="text-4xl mb-3">{popup === 'byop' ? BYOP_POPUP.emoji : KEY_POPUP.emoji}</p>
            <h3 className="text-lg font-bold vs-text mb-2">{popup === 'byop' ? BYOP_POPUP.title : KEY_POPUP.title}</h3>
            <p className="text-sm vs-text-sub mb-5 leading-relaxed">{popup === 'byop' ? BYOP_POPUP.desc : KEY_POPUP.desc}</p>
            <div className="flex gap-2">
              <button onClick={() => setPopup(null)} className="flex-1 vs-btn-outline px-4 py-2.5 rounded-xl text-sm font-semibold">
                Close
              </button>
              <a
                href={popup === 'byop' ? BYOP_POPUP.link : KEY_POPUP.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 vs-btn px-4 py-2.5 rounded-xl text-sm font-semibold gap-1"
              >
                Get Key <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
