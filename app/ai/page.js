'use client'
import { useState, useEffect, useRef } from 'react'
import { 
  Send, MessageSquare, Mic, Film, Sparkles, Shuffle, Download, 
  Loader2, ChevronDown, ExternalLink, Key, RefreshCw, Play, Music, 
  ImageIcon, Paperclip, X, Heart 
} from 'lucide-react'
import { toast } from '../components/Toast'
import { 
  saveImage, getRecentImages, compressImage, compressImageToSize, 
  getImageCount 
} from '../lib/imagedb'

const USER_KEY_STORAGE = 'vs-user-polli-key'
const FLUX2_KEY = 'vs-flux2dev-usage'
const CHAT_HISTORY_KEY = 'vs-chat-history'
const CHAT_MODEL_KEY = 'vs-chat-model'
const FAV_AI_KEY = 'vs-fav-ai' // kunci untuk localStorage favorit

const DEFAULT_MSG = { role: 'assistant', content: "Yo what's good! Pick a mode and ask me anything — I'm only slightly unhinged." }

const CHAT_MODELS = [
  { id: 'nova-fast', label: 'Safe Mode', tag: '🛡️', desc: 'Fast & reliable', free: true, vision: false },
  { id: 'gemini-fast', label: 'Pro Mode', tag: '🔑', desc: 'Vision, search, code', free: false, vision: true },
]

const ALL_IMG_MODELS = [
  { id: 'flux', label: 'Flux Schnell', type: 'free' },
  { id: 'zimage', label: 'Z-Image Turbo', type: 'free' },
  { id: 'flux-2-dev', label: 'FLUX.2 Dev', type: 'limited' },
  { id: 'imagen-4', label: 'Imagen 4', type: 'byop' },
  { id: 'grok-imagine', label: 'Grok Imagine', type: 'byop' },
  { id: 'klein', label: 'Klein 4B', type: 'byop' },
  { id: 'klein-large', label: 'Klein 9B', type: 'byop' },
  { id: 'gptimage', label: 'GPT Image', type: 'byop' },
]

const STYLES = [
  { id: 'none', label: 'None', suffix: '' },
  { id: 'realistic', label: 'Realistic', suffix: ', photorealistic, highly detailed, 8K resolution' },
  { id: '3d', label: '3D Render', suffix: ', 3D render, octane render, cinema 4D, highly detailed' },
  { id: 'cartoon', label: 'Cartoon', suffix: ', cartoon style, vibrant colors, playful, fun' },
  { id: 'anime', label: 'Anime', suffix: ', anime style, manga art, Studio Ghibli inspired' },
  { id: 'pixel', label: 'Pixel Art', suffix: ', pixel art, 16-bit retro game style' },
  { id: 'watercolor', label: 'Watercolor', suffix: ', watercolor painting, soft colors, artistic' },
  { id: 'oil', label: 'Oil Paint', suffix: ', oil painting, classical art, rich textures' },
  { id: 'sketch', label: 'Sketch', suffix: ', pencil sketch, hand drawn, detailed linework' },
  { id: 'cyberpunk', label: 'Cyberpunk', suffix: ', cyberpunk style, neon lights, futuristic city' },
  { id: 'fantasy', label: 'Fantasy', suffix: ', fantasy art, magical, ethereal, mystical lighting' },
  { id: 'horror', label: 'Horror', suffix: ', dark horror style, creepy, eerie atmosphere' },
  { id: 'vintage', label: 'Vintage', suffix: ', vintage photography, retro, film grain, 70s aesthetic' },
  { id: 'minimal', label: 'Minimal', suffix: ', minimalist, clean lines, simple, modern design' },
  { id: 'cinematic', label: 'Cinematic', suffix: ', cinematic shot, movie scene, dramatic lighting' },
  { id: 'popart', label: 'Pop Art', suffix: ', pop art style, Andy Warhol, bold colors, graphic' },
  { id: 'sticker', label: 'Sticker', suffix: ', sticker design, die-cut, white border, cute' },
  { id: 'logo', label: 'Logo', suffix: ', logo design, professional, vector style, clean' },
  { id: 'isometric', label: 'Isometric', suffix: ', isometric 3D, game asset, clean, detailed' },
  { id: 'neon', label: 'Neon Glow', suffix: ', neon glow effect, dark background, vibrant neon colors' },
]

const SIZES = [
  { label: '1:1', w: 1024, h: 1024 },
  { label: '16:9', w: 1344, h: 768 },
  { label: '9:16', w: 768, h: 1344 },
  { label: '4:3', w: 1152, h: 896 },
  { label: '3:4', w: 896, h: 1152 },
]

const VOICES = ['alloy','echo','nova','shimmer','onyx','fable','coral','sage','rachel','bella','charlotte','sarah','adam','josh','daniel','james']

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

const LOADING_MSGS = [
  'Cooking your image...', 'Teaching the AI to draw...', 'Summoning pixels from the void...',
  'The AI is having a creative moment...', 'Generating something potentially cursed...',
  'Asking the AI nicely...', 'Brewing some digital art...', 'The hamsters are running the wheel...',
]

const ERR = {
  quota_exceeded: { emoji: '😭', title: "Free vibes ran out bestie", desc: "Your daily pollen is gone. Drop your own API key to keep the party going, or come back tomorrow." },
  invalid_key: { emoji: '🫠', title: "That key ain't it chief", desc: "Double check your API key and try again." },
  user_key_required: { emoji: '🎟️', title: "VIP pass needed", desc: "This feature needs your own API key." },
  server_error: { emoji: '💤', title: "The AI took a nap", desc: "Something went wrong. Give it another shot." },
  forbidden: { emoji: '🚫', title: "Access denied", desc: "Your key might not have access to this model." },
  api_error: { emoji: '🫣', title: "Something went sideways", desc: "Give it another shot." },
}

function getUserKey() { try { return localStorage.getItem(USER_KEY_STORAGE) || '' } catch { return '' } }
function saveUserKey(k) { localStorage.setItem(USER_KEY_STORAGE, k) }
function clearUserKeyStorage() { localStorage.removeItem(USER_KEY_STORAGE) }
function getChatHistory() { try { return JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || 'null') } catch { return null } }
function saveChatHistory(msgs) { try { localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(msgs)) } catch {} }
function getSavedChatModel() { try { return localStorage.getItem(CHAT_MODEL_KEY) || 'nova-fast' } catch { return 'nova-fast' } }
function saveChatModelStorage(m) { localStorage.setItem(CHAT_MODEL_KEY, m) }
function getFlux2Usage() {
  try {
    const d = JSON.parse(localStorage.getItem(FLUX2_KEY) || '{}')
    if (d.date !== new Date().toDateString()) return { date: new Date().toDateString(), count: 0 }
    return d
  } catch { return { date: new Date().toDateString(), count: 0 } }
}
function addFlux2Usage() { const u = getFlux2Usage(); u.count += 1; localStorage.setItem(FLUX2_KEY, JSON.stringify(u)); return u }
function randomLoadingMsg() { return LOADING_MSGS[Math.floor(Math.random() * LOADING_MSGS.length)] }
function getPolliKey() { return getUserKey() || process.env.NEXT_PUBLIC_POLLI_PK || '' }

function buildImageUrl(prompt, model, width, height, seed, enhanceFlag) {
  const encoded = encodeURIComponent(prompt)
  const params = new URLSearchParams({ model: model || 'flux', width: String(width), height: String(height), seed: String(seed), safe: 'true', nologo: 'true' })
  if (enhanceFlag) params.set('enhance', 'true')
  return `https://gen.pollinations.ai/image/${encoded}?${params}`
}

async function compressForUpload(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const max = 800
        let w = img.width, h = img.height
        if (w > max || h > max) {
          const scale = max / Math.max(w, h)
          w = Math.round(w * scale)
          h = Math.round(h * scale)
        }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function AIPage() {
  const [tab, setTab] = useState('chat')
  const [balance, setBalance] = useState(null)
  const [userKey, setUserKey] = useState('')
  const [showKeyPopup, setShowKeyPopup] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [keyReason, setKeyReason] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [loadingMsg, setLoadingMsg] = useState('')

  const [chatModel, setChatModel] = useState('nova-fast')
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [chatMessages, setChatMessages] = useState([DEFAULT_MSG])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatImage, setChatImage] = useState(null)
  const [chatImagePreview, setChatImagePreview] = useState(null)
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const [imgPrompt, setImgPrompt] = useState('')
  const [imgModel, setImgModel] = useState('flux')
  const [showImgModelPicker, setShowImgModelPicker] = useState(false)
  const [imgSize, setImgSize] = useState(0)
  const [imgStyle, setImgStyle] = useState('none')
  const [showStylePicker, setShowStylePicker] = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const [imgResult, setImgResult] = useState(null)
  const [imgError, setImgError] = useState(null)
  const [enhanceOn, setEnhanceOn] = useState(false)
  const [recent, setRecent] = useState([])

  const [voiceMode, setVoiceMode] = useState('tts')
  const [voiceText, setVoiceText] = useState('')
  const [voiceVoice, setVoiceVoice] = useState('nova')
  const [voiceDuration, setVoiceDuration] = useState(30)
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [voiceResult, setVoiceResult] = useState(null)
  const [voiceError, setVoiceError] = useState(null)

  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoDuration, setVideoDuration] = useState(5)
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoResult, setVideoResult] = useState(null)
  const [videoError, setVideoError] = useState(null)

  const [errorPopup, setErrorPopup] = useState(null)

  // ===== LOAD INITIAL DATA =====
  useEffect(() => {
    loadRecent()
    setUserKey(getUserKey())
    fetchBalance()
    const savedHistory = getChatHistory()
    if (savedHistory && savedHistory.length > 0) setChatMessages(savedHistory)
    const savedModel = getSavedChatModel()
    if (savedModel) setChatModel(savedModel)
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tab')
    if (t && ['chat', 'image', 'voice', 'video'].includes(t)) setTab(t)
    const p = params.get('prompt')
    if (p) { setImgPrompt(p); setTab('image') }
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])
  useEffect(() => { saveChatHistory(chatMessages) }, [chatMessages])
  useEffect(() => { saveChatModelStorage(chatModel) }, [chatModel])

  async function loadRecent() {
    const items = await getRecentImages(10)
    setRecent(items)
  }

  async function fetchBalance() {
    try { const res = await fetch('/api/balance'); const data = await res.json(); setBalance(data.balance) } catch { setBalance(null) }
  }

  function hasKey() { return !!getUserKey() }

  function requireKey(reason, action) {
    const k = getUserKey()
    if (k) { setUserKey(k); if (action) action(k); return true }
    setKeyReason(reason); setPendingAction(() => action); setKeyInput(''); setShowKeyPopup(true); return false
  }

  function handleKeySave() {
    if (!keyInput.trim()) return
    saveUserKey(keyInput.trim()); setUserKey(keyInput.trim()); setShowKeyPopup(false)
    if (pendingAction) pendingAction(keyInput.trim()); setPendingAction(null); fetchBalance()
  }

  function handleKeyClear() { clearUserKeyStorage(); setUserKey(''); fetchBalance() }

  function handleApiError(err) {
    if (err === 'quota_exceeded') { setKeyReason('quota'); setShowKeyPopup(true); return }
    setErrorPopup(ERR[err] || ERR.api_error)
  }

  function switchTab(t) {
    if (t === 'voice' || t === 'video') { if (!getUserKey()) { requireKey(t, () => setTab(t)); return } }
    setTab(t)
  }

  const currentChatModel = CHAT_MODELS.find(m => m.id === chatModel) || CHAT_MODELS[0]
  const currentImgModel = ALL_IMG_MODELS.find(m => m.id === imgModel) || ALL_IMG_MODELS[0]
  const currentStyle = STYLES.find(s => s.id === imgStyle) || STYLES[0]
  const flux2Usage = getFlux2Usage()

  function getImgModelTag(m) {
    if (hasKey()) return ''
    if (m.type === 'free') return ' ✨'
    if (m.type === 'limited') return ' ⚡'
    if (m.type === 'byop') return ' 🔑'
    return ''
  }

  function getChatModelTag(m) { if (hasKey() && !m.free) return '⚡'; return m.tag }

  // ===== IMAGE UPLOAD =====
  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast('Please select an image file'); return }
    setChatImage(file)
    const reader = new FileReader()
    reader.onload = (ev) => setChatImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function clearChatImage() { setChatImage(null); setChatImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }

  // ===== CHAT =====
  async function handleChat(e) {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    if (!currentChatModel.free && !hasKey()) { requireKey('pro_chat', () => doChat(chatInput.trim())); return }
    doChat(chatInput.trim())
  }

  async function doChat(text) {
    let userContent
    let displayMsg

    if (chatImage && currentChatModel.vision) {
      const compressed = await compressForUpload(chatImage)
      userContent = [
        { type: 'text', text: text },
        { type: 'image_url', image_url: { url: compressed } },
      ]
      displayMsg = { role: 'user', content: `📎 [Image attached]\n${text}` }
    } else {
      userContent = text
      displayMsg = { role: 'user', content: text }
    }

    const apiMsg = { role: 'user', content: userContent }
    const prevApiMsgs = chatMessages.filter(m => m.role !== 'assistant' || chatMessages.indexOf(m) !== 0).map(m => {
      if (typeof m.content === 'string') return { role: m.role, content: m.content }
      return m
    })

    const newDisplay = [...chatMessages, displayMsg]
    setChatMessages(newDisplay)
    setChatInput('')
    clearChatImage()
    setChatLoading(true)

    try {
      const allApiMsgs = [...prevApiMsgs, apiMsg]
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', messages: allApiMsgs, model: chatModel, userKey: hasKey() ? getUserKey() : undefined }),
      })
      const data = await res.json()
      if (data.error) { handleApiError(data.error); setChatLoading(false); return }
      setChatMessages([...newDisplay, { role: 'assistant', content: data.result || 'Bruh I got nothing. Try again?' }])
    } catch {
      setChatMessages([...newDisplay, { role: 'assistant', content: 'Something broke. My brain lagged. Try again?' }])
    }
    setChatLoading(false); fetchBalance()
  }

  function handleClearChat() { setChatMessages([DEFAULT_MSG]); saveChatHistory([DEFAULT_MSG]) }

  // ===== IMAGE =====
  function selectImgModel(m) {
    if (m.type === 'byop' && !hasKey()) { requireKey('byop_image', () => { setImgModel(m.id); setShowImgModelPicker(false) }); return }
    setImgModel(m.id); setShowImgModelPicker(false)
  }

  async function handleGenerate(overrideSeed) {
    if (!imgPrompt.trim() || imgLoading) return
    if (currentImgModel.type === 'byop' && !hasKey()) { requireKey('byop_image', () => doGenerate(overrideSeed)); return }
    if (imgModel === 'flux-2-dev' && !hasKey()) { if (getFlux2Usage().count >= 2) { requireKey('flux2_limit', () => doGenerate(overrideSeed)); return } }
    doGenerate(overrideSeed)
  }

  async function doGenerate(overrideSeed) {
    setImgLoading(true); setImgError(null); setImgResult(null); setLoadingMsg(randomLoadingMsg())
    const size = SIZES[imgSize]
    const seed = overrideSeed || Math.floor(Math.random() * 999999)
    const polliKey = getPolliKey()
    if (!polliKey) { setImgLoading(false); requireKey('no_key', () => doGenerate(overrideSeed)); return }

    const fullPrompt = imgPrompt.trim() + currentStyle.suffix
    const imageUrl = buildImageUrl(fullPrompt, imgModel, size.w, size.h, seed, enhanceOn)

    try {
      const res = await fetch(imageUrl, { headers: { 'Authorization': `Bearer ${polliKey}` } })
      if (!res.ok) {
        if (res.status === 402) { handleApiError('quota_exceeded'); setImgLoading(false); return }
        if (res.status === 401) { handleApiError('invalid_key'); setImgLoading(false); return }
        throw new Error('Generation failed')
      }
      const ct = res.headers.get('content-type') || ''
      if (!ct.includes('image')) throw new Error('Response was not an image')

      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)

      const thumb = await compressImage(blobUrl, 100)
      const medium = await compressImageToSize(blobUrl, 512)

      const result = {
        url: blobUrl,
        medium: medium,
        prompt: imgPrompt,
        model: imgModel,
        size: size.label,
        seed,
        style: imgStyle
      }
      setImgResult(result)

      await saveImage({
        prompt: imgPrompt,
        model: imgModel,
        size: size.label,
        seed,
        thumbnail: thumb,
        medium: medium,
        style: imgStyle
      })

      const count = await getImageCount()
      if (count >= 50) {
        setErrorPopup({
          emoji: '⚠️',
          title: 'Favorites almost full',
          desc: `You have ${count} images saved. Consider deleting some old ones from Favorites to make room.`
        })
      }

      await loadRecent() 
      toast('Image generated!', null) 

      if (imgModel === 'flux-2-dev') addFlux2Usage()
    } catch (err) {
      setImgError(err.message)
    }
    setImgLoading(false)
    fetchBalance()
  }

  function handleRegenerate() { if (imgResult) handleGenerate(imgResult.seed) }

  function handleDownload() {
    if (!imgResult) return
    const a = document.createElement('a'); a.href = imgResult.url; a.download = `viralscape-${Date.now()}.png`; a.click()
  }

  function saveToFavorites() {
    if (!imgResult) return

    const { prompt, model, size, seed, style, medium, url } = imgResult
    const imageUrl = medium || url 

    if (!imageUrl) {
      toast('No image to save')
      return
    }

    let favorites = []
    try {
      const saved = localStorage.getItem(FAV_AI_KEY)
      if (saved) favorites = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to parse favorites', e)
    }

    const newItem = {
      prompt,
      model,
      size,
      seed,
      style: style || 'none',
      url: imageUrl,
      timestamp: Date.now()
    }

    favorites.push(newItem)
    try {
      localStorage.setItem(FAV_AI_KEY, JSON.stringify(favorites))
      toast('Saved to favorites!', '/favorites?tab=ai')
    } catch (e) {
      toast('Failed to save. LocalStorage might be full.')
    }
  }

  function handleClickRecent(item) {
    setImgPrompt(item.prompt)
    if (item.style) setImgStyle(item.style)
    const imgUrl = item.medium || item.thumbnail
    setImgResult({
      url: imgUrl,
      prompt: item.prompt,
      model: item.model,
      size: item.size,
      seed: item.seed,
      style: item.style,
      isThumb: !item.medium 
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ===== VOICE =====
  async function handleVoiceGenerate() {
    if (!voiceText.trim() || voiceLoading) return
    const k = getUserKey(); if (!k) { requireKey('voice', (k2) => doVoice(k2)); return }; doVoice(k)
  }

  async function doVoice(k) {
    setVoiceLoading(true); setVoiceError(null); setVoiceResult(null)
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'audio', prompt: voiceText.trim(), model: voiceMode === 'tts' ? 'elevenlabs' : 'elevenmusic', voice: voiceMode === 'tts' ? voiceVoice : undefined, duration: voiceMode === 'music' ? voiceDuration : undefined, userKey: k }) })
      const data = await res.json()
      if (data.error) { handleApiError(data.error); setVoiceLoading(false); return }
      setVoiceResult(data.audio)
    } catch { setVoiceError('Generation failed. Try again?') }
    setVoiceLoading(false)
  }

  // ===== VIDEO =====
  async function handleVideoGenerate() {
    if (!videoPrompt.trim() || videoLoading) return
    const k = getUserKey(); if (!k) { requireKey('video', (k2) => doVideo(k2)); return }; doVideo(k)
  }

  async function doVideo(k) {
    setVideoLoading(true); setVideoError(null); setVideoResult(null)
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'video', prompt: videoPrompt.trim(), model: 'grok-video', duration: videoDuration, userKey: k }) })
      const data = await res.json()
      if (data.error) { handleApiError(data.error); setVideoLoading(false); return }
      setVideoResult(data.video)
    } catch { setVideoError('Generation failed. Try again?') }
    setVideoLoading(false)
  }

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'image', label: 'Image', icon: ImageIcon },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'video', label: 'Video', icon: Film },
  ]

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black vs-text text-center mb-1">AI <span className="vs-gradient-text">Playground</span></h1>
      <p className="text-xs vs-text-sub text-center mb-3">create unhinged stuff with artificial brainpower</p>

      {/* Balance */}
      <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full vs-card border vs-border text-[10px]">
          <Sparkles size={10} style={{ color: 'var(--vs-accent)' }} />
          {balance !== null ? (<span className="vs-text-sub">{balance > 0 ? `${balance.toFixed(3)} pollen left` : 'Pollen depleted'}</span>) : (<span className="vs-text-sub">Loading...</span>)}
          {balance !== null && balance <= 0 && (
            <button onClick={() => { setKeyReason('quota'); setShowKeyPopup(true) }} className="ml-1 px-2 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: 'var(--vs-accent)' }}>Add Key</button>
          )}
        </div>
        {userKey && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full vs-card border vs-border text-[10px]">
            <Key size={9} style={{ color: 'var(--vs-accent)' }} /><span className="vs-text-sub">Key active</span>
            <button onClick={handleKeyClear} className="ml-1 vs-text-sub hover:underline text-[9px]">remove</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 vs-card border vs-border rounded-xl p-1">
        {tabs.map((t) => { const Icon = t.icon; return (
          <button key={t.id} onClick={() => switchTab(t.id)} className="flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            style={{ backgroundColor: tab === t.id ? 'var(--vs-accent)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--vs-text-sub)' }}>
            <Icon size={14} />{t.label}
          </button>
        )})}
      </div>

      {/* ===== CHAT ===== */}
      {tab === 'chat' && (
        <div className="flex flex-col" style={{ height: 'calc(100vh - 340px)' }}>
          <div className="mb-3">
            <button onClick={() => setShowModelPicker(!showModelPicker)} className="flex items-center gap-2 px-3 py-2 rounded-xl vs-card border vs-border text-xs font-semibold vs-text w-full">
              <span>{getChatModelTag(currentChatModel)}</span><span className="flex-1 text-left">{currentChatModel.label}</span>
              <span className="vs-text-sub text-[10px]">{currentChatModel.desc}</span>
              <ChevronDown size={14} className="vs-text-sub" style={{ transform: showModelPicker ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            {showModelPicker && (
              <div className="vs-card border vs-border rounded-xl mt-1">
                {CHAT_MODELS.map((m) => (
                  <button key={m.id} onClick={() => { if (!m.free && !hasKey()) { requireKey('pro_chat', () => { setChatModel(m.id); setShowModelPicker(false) }); return } setChatModel(m.id); setShowModelPicker(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs vs-hover border-b vs-border last:border-b-0" style={{ color: chatModel === m.id ? 'var(--vs-accent)' : 'var(--vs-text)' }}>
                    <span>{getChatModelTag(m)}</span><span className="flex-1 text-left font-semibold">{m.label}</span><span className="vs-text-sub text-[10px]">{m.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleClearChat} className="text-[10px] vs-text-sub hover:underline mb-2 self-end">Clear chat</button>

          <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-4 pr-1">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'self-end text-white rounded-br-sm' : 'self-start vs-card border vs-border vs-text rounded-bl-sm'}`}
                style={msg.role === 'user' ? { backgroundColor: 'var(--vs-accent)' } : {}}>
                {typeof msg.content === 'string' ? msg.content.split('\n').map((line, j) => <span key={j}>{line}<br/></span>) : String(msg.content)}
              </div>
            ))}
            {chatLoading && (<div className="self-start px-4 py-3 rounded-2xl rounded-bl-sm vs-card border vs-border"><Loader2 size={16} className="animate-spin vs-text-sub" /></div>)}
            <div ref={chatEndRef} />
          </div>

          {/* Image preview */}
          {chatImagePreview && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 vs-card border vs-border rounded-lg">
              <img src={chatImagePreview} alt="Upload" className="w-10 h-10 rounded object-cover" />
              <span className="text-[10px] vs-text-sub flex-1">Image attached</span>
              <button onClick={clearChatImage} className="vs-text-sub"><X size={14} /></button>
            </div>
          )}

          <form onSubmit={handleChat} className="flex gap-2">
            {currentChatModel.vision && (
              <>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-11 h-11 rounded-xl vs-card border vs-border flex items-center justify-center flex-shrink-0 vs-hover" style={{ color: chatImage ? 'var(--vs-accent)' : 'var(--vs-text-sub)' }}>
                  <Paperclip size={16} />
                </button>
              </>
            )}
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Say something..."
              className="flex-1 py-3 px-4 rounded-xl vs-card border vs-border text-sm vs-text outline-none" style={{ backgroundColor: 'var(--vs-card)' }} />
            <button type="submit" disabled={chatLoading} className="vs-btn w-11 h-11 rounded-xl flex-shrink-0"><Send size={16} /></button>
          </form>
          <p className="text-[9px] vs-text-sub mt-1.5 text-center">
            Press Enter to send{currentChatModel.vision ? ' • 📎 Upload image in Pro mode' : ''}
          </p>
        </div>
      )}

      {/* ===== IMAGE ===== */}
      {tab === 'image' && (
        <div>
          {/* Model */}
          <div className="mb-4">
            <p className="text-xs font-semibold vs-text mb-2">Model</p>
            <button onClick={() => setShowImgModelPicker(!showImgModelPicker)} className="flex items-center gap-2 px-3 py-2 rounded-xl vs-card border vs-border text-xs font-semibold vs-text w-full">
              <Sparkles size={12} style={{ color: 'var(--vs-accent)' }} />
              <span className="flex-1 text-left">{currentImgModel.label}{getImgModelTag(currentImgModel)}</span>
              {imgModel === 'flux-2-dev' && !hasKey() && <span className="text-[9px] vs-text-sub">{flux2Usage.count}/2</span>}
              <ChevronDown size={14} className="vs-text-sub" style={{ transform: showImgModelPicker ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            {showImgModelPicker && (
              <div className="vs-card border vs-border rounded-xl mt-1 max-h-48 overflow-y-auto">
                {ALL_IMG_MODELS.map((m) => (
                  <button key={m.id} onClick={() => selectImgModel(m)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs vs-hover border-b vs-border last:border-b-0"
                    style={{ color: imgModel === m.id ? 'var(--vs-accent)' : 'var(--vs-text)' }}>
                    <span className="flex-1 text-left font-semibold">{m.label}{getImgModelTag(m)}</span>
                    {m.id === 'flux-2-dev' && !hasKey() && <span className="text-[9px] vs-text-sub">{flux2Usage.count}/2</span>}
                  </button>
                ))}
              </div>
            )}
            {!hasKey() && <p className="text-[10px] vs-text-sub mt-1.5">✨ Free • ⚡ Limited daily • 🔑 Needs key</p>}
          </div>

          {/* Size */}
          <div className="mb-4">
            <p className="text-xs font-semibold vs-text mb-2">Size</p>
            <div className="flex gap-2">
              {SIZES.map((s, i) => (
                <button key={i} onClick={() => setImgSize(i)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ backgroundColor: imgSize === i ? 'var(--vs-accent)' : 'var(--vs-card)', color: imgSize === i ? '#fff' : 'var(--vs-text-sub)', border: `1px solid ${imgSize === i ? 'var(--vs-accent)' : 'var(--vs-border)'}` }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="mb-4">
            <p className="text-xs font-semibold vs-text mb-2">Prompt</p>
            <textarea value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)} placeholder="Describe what you want to see..." rows={3}
              className="w-full py-3 px-4 rounded-xl vs-card border vs-border text-sm vs-text outline-none resize-none" style={{ backgroundColor: 'var(--vs-card)' }} />
            <div className="flex gap-2 mt-2 flex-wrap">
              <button onClick={() => setImgPrompt(RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)])}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold vs-card border vs-border vs-text-sub vs-hover"><Shuffle size={12} /> Random</button>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold vs-card border vs-border vs-text-sub cursor-pointer">
                <input type="checkbox" checked={enhanceOn} onChange={(e) => setEnhanceOn(e.target.checked)} className="w-3.5 h-3.5 rounded" />
                <Sparkles size={12} /> Enhance
              </label>

              {/* Style Picker */}
              <div className="relative">
                <button onClick={() => setShowStylePicker(!showStylePicker)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold vs-card border vs-border vs-text-sub vs-hover">
                  🎨 {currentStyle.label}
                  <ChevronDown size={12} style={{ transform: showStylePicker ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                </button>
                {showStylePicker && (
                  <div className="absolute bottom-full mb-1 left-0 vs-card border vs-border rounded-xl shadow-lg max-h-48 overflow-y-auto w-48 z-10">
                    {STYLES.map((s) => (
                      <button key={s.id} onClick={() => { setImgStyle(s.id); setShowStylePicker(false) }}
                        className="w-full text-left px-3 py-2 text-xs vs-hover border-b vs-border last:border-b-0"
                        style={{ color: imgStyle === s.id ? 'var(--vs-accent)' : 'var(--vs-text)', fontWeight: imgStyle === s.id ? 700 : 500 }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Generate */}
          <button onClick={() => handleGenerate()} disabled={imgLoading || !imgPrompt.trim()} className="vs-btn w-full py-3 rounded-xl text-sm font-bold mb-6 gap-2"
            style={{ opacity: imgLoading || !imgPrompt.trim() ? 0.5 : 1 }}>
            {imgLoading ? (<><Loader2 size={16} className="animate-spin" /> {loadingMsg}</>) : (<><Sparkles size={16} /> Generate</>)}
          </button>

          {/* Skeleton */}
          {imgLoading && (
            <div className="vs-card border vs-border rounded-2xl overflow-hidden mb-6">
              <div className="skeleton aspect-square w-full" />
              <div className="p-4"><div className="skeleton h-3 w-3/4 mb-2" /><div className="skeleton h-3 w-1/2" /></div>
            </div>
          )}

          {/* Error */}
          {imgError && (<div className="vs-card border vs-border rounded-xl p-4 text-center mb-6"><p className="text-xl mb-1">💀</p><p className="text-xs vs-text-sub">{imgError}</p></div>)}

          {/* Result */}
          {imgResult && !imgLoading && (
            <div className="vs-card border vs-border rounded-2xl overflow-hidden mb-6">
              <img src={imgResult.url} alt={imgResult.prompt} className="w-full" />
              {imgResult.isThumb && <p className="text-[10px] text-center vs-text-sub py-1">Preview (thumbnail) — click Regenerate for full size</p>}
              <div className="p-4">
                <p className="text-xs vs-text-sub mb-2 leading-relaxed">{imgResult.prompt}</p>
                <p className="text-[10px] vs-text-sub mb-3">Model: {imgResult.model} • Size: {imgResult.size} • Seed: {imgResult.seed}{imgResult.style && imgResult.style !== 'none' ? ` • Style: ${imgResult.style}` : ''}</p>
                <div className="flex gap-2">
                  <button onClick={handleDownload} className="flex-1 vs-btn py-2.5 rounded-xl text-xs font-semibold gap-1"><Download size={14} /> Download</button>
                  <button onClick={handleRegenerate} className="flex-1 vs-btn-outline py-2.5 rounded-xl text-xs font-semibold gap-1"><RefreshCw size={14} /> Regenerate</button>
                  {/* Tombol Save ke Favorites */}
                  <button onClick={saveToFavorites} className="flex-1 vs-btn-outline py-2.5 rounded-xl text-xs font-semibold gap-1" style={{ borderColor: 'var(--vs-accent)', color: 'var(--vs-accent)' }}>
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
                <a href="/favorites?tab=ai" className="text-[10px] vs-text-sub hover:underline flex items-center gap-1">All in Favorites <ExternalLink size={10} /></a>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {recent.map((item, i) => (
                  <button key={item.id || i} onClick={() => handleClickRecent(item)}
                    className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border vs-border vs-hover">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.prompt} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full vs-bg2 flex items-center justify-center"><ImageIcon size={14} className="vs-text-sub" /></div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] vs-text-sub mt-2">Click to preview. Use <Heart size={10} className="inline" /> button to save permanently.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== VOICE ===== */}
      {tab === 'voice' && (
        <div>
          <div className="flex gap-2 mb-5">
            <button onClick={() => setVoiceMode('tts')} className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              style={{ backgroundColor: voiceMode === 'tts' ? 'var(--vs-accent)' : 'var(--vs-card)', color: voiceMode === 'tts' ? '#fff' : 'var(--vs-text-sub)', border: `1px solid ${voiceMode === 'tts' ? 'var(--vs-accent)' : 'var(--vs-border)'}` }}>
              <Mic size={14} /> Text to Speech</button>
            <button onClick={() => setVoiceMode('music')} className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              style={{ backgroundColor: voiceMode === 'music' ? 'var(--vs-accent)' : 'var(--vs-card)', color: voiceMode === 'music' ? '#fff' : 'var(--vs-text-sub)', border: `1px solid ${voiceMode === 'music' ? 'var(--vs-accent)' : 'var(--vs-border)'}` }}>
              <Music size={14} /> Music Gen</button>
          </div>
          {voiceMode === 'tts' && (
            <div className="mb-4"><p className="text-xs font-semibold vs-text mb-2">Voice</p>
              <div className="flex flex-wrap gap-1.5">
                {VOICES.map((v) => (<button key={v} onClick={() => setVoiceVoice(v)} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                  style={{ backgroundColor: voiceVoice === v ? 'var(--vs-accent)' : 'var(--vs-card)', color: voiceVoice === v ? '#fff' : 'var(--vs-text-sub)', border: `1px solid ${voiceVoice === v ? 'var(--vs-accent)' : 'var(--vs-border)'}` }}>{v}</button>))}
              </div>
            </div>
          )}
          {voiceMode === 'music' && (<div className="mb-4"><p className="text-xs font-semibold vs-text mb-2">Duration: {voiceDuration}s</p>
            <input type="range" min="10" max="120" value={voiceDuration} onChange={(e) => setVoiceDuration(parseInt(e.target.value))} className="w-full" /></div>)}
          <div className="mb-4"><p className="text-xs font-semibold vs-text mb-2">{voiceMode === 'tts' ? 'Text to speak' : 'Describe the music'}</p>
            <textarea value={voiceText} onChange={(e) => setVoiceText(e.target.value)} placeholder={voiceMode === 'tts' ? 'Type what you want to hear...' : 'A chill lo-fi beat with piano and rain...'} rows={3}
              className="w-full py-3 px-4 rounded-xl vs-card border vs-border text-sm vs-text outline-none resize-none" style={{ backgroundColor: 'var(--vs-card)' }} /></div>
          <button onClick={handleVoiceGenerate} disabled={voiceLoading || !voiceText.trim()} className="vs-btn w-full py-3 rounded-xl text-sm font-bold mb-6 gap-2"
            style={{ opacity: voiceLoading || !voiceText.trim() ? 0.5 : 1 }}>
            {voiceLoading ? (<><Loader2 size={16} className="animate-spin" /> Generating audio...</>) : (<><Play size={16} /> Generate</>)}</button>
          {voiceError && (<div className="vs-card border vs-border rounded-xl p-4 text-center mb-4"><p className="text-xl mb-1">💀</p><p className="text-xs vs-text-sub">{voiceError}</p></div>)}
          {voiceResult && (<div className="vs-card border vs-border rounded-2xl p-4 mb-4"><p className="text-xs font-semibold vs-text mb-3">{voiceMode === 'tts' ? 'Your Audio' : 'Your Music'}</p>
            <audio controls src={voiceResult} className="w-full" /><a href={voiceResult} download={`viralscape-${voiceMode}-${Date.now()}.mp3`}
              className="vs-btn-outline w-full py-2 rounded-xl text-xs font-semibold mt-3 gap-1 flex items-center justify-center"><Download size={14} /> Download</a></div>)}
        </div>
      )}

      {/* ===== VIDEO ===== */}
      {tab === 'video' && (
        <div>
          <div className="vs-card border vs-border rounded-xl p-3 mb-4 text-center"><p className="text-[10px] vs-text-sub">Model: <strong className="vs-text">Grok Video</strong> • Requires API key</p></div>
          <div className="mb-4"><p className="text-xs font-semibold vs-text mb-2">Duration: {videoDuration}s</p>
            <input type="range" min="1" max="10" value={videoDuration} onChange={(e) => setVideoDuration(parseInt(e.target.value))} className="w-full" /></div>
          <div className="mb-4"><p className="text-xs font-semibold vs-text mb-2">Prompt</p>
            <textarea value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} placeholder="A drone shot flying over a neon cyberpunk city..." rows={3}
              className="w-full py-3 px-4 rounded-xl vs-card border vs-border text-sm vs-text outline-none resize-none" style={{ backgroundColor: 'var(--vs-card)' }} /></div>
          <button onClick={handleVideoGenerate} disabled={videoLoading || !videoPrompt.trim()} className="vs-btn w-full py-3 rounded-xl text-sm font-bold mb-6 gap-2"
            style={{ opacity: videoLoading || !videoPrompt.trim() ? 0.5 : 1 }}>
            {videoLoading ? (<><Loader2 size={16} className="animate-spin" /> This might take a while...</>) : (<><Film size={16} /> Generate Video</>)}</button>
          {videoError && (<div className="vs-card border vs-border rounded-xl p-4 text-center mb-4"><p className="text-xl mb-1">💀</p><p className="text-xs vs-text-sub">{videoError}</p></div>)}
          {videoResult && (<div className="vs-card border vs-border rounded-2xl overflow-hidden mb-4"><video controls src={videoResult} className="w-full" /><div className="p-3">
            <a href={videoResult} download={`viralscape-video-${Date.now()}.mp4`} className="vs-btn w-full py-2 rounded-xl text-xs font-semibold gap-1 flex items-center justify-center"><Download size={14} /> Download</a></div></div>)}
        </div>
      )}

      {/* ===== KEY POPUP ===== */}
      {showKeyPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => { setShowKeyPopup(false); setPendingAction(null) }}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full border vs-border" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <p className="text-4xl mb-2">{keyReason === 'quota' ? '😭' : '🔑'}</p>
              <h3 className="text-lg font-bold vs-text mb-1">{keyReason === 'quota' ? 'Free vibes ran out bestie' : keyReason === 'flux2_limit' ? 'FLUX.2 Dev limit hit' : 'Drop your key bestie'}</h3>
              <p className="text-xs vs-text-sub leading-relaxed">{keyReason === 'quota' ? "Your daily free pollen is depleted. Add your own key or come back tomorrow."
                : keyReason === 'flux2_limit' ? "You've used your 2 free FLUX.2 Dev today. Add key for unlimited, or try another model."
                : "This feature needs your own API key. Takes 30 seconds to get one — worth it."}</p>
            </div>
            <div className="mb-4"><input type="text" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="Paste your API key here..."
              className="w-full py-3 px-4 rounded-xl vs-card border vs-border text-sm vs-text outline-none" style={{ backgroundColor: 'var(--vs-bg)' }} /></div>
            <button onClick={handleKeySave} disabled={!keyInput.trim()} className="vs-btn w-full py-2.5 rounded-xl text-sm font-semibold mb-3" style={{ opacity: keyInput.trim() ? 1 : 0.5 }}>Save Key</button>
            <div className="text-center"><p className="text-[10px] vs-text-sub mb-2">Don&apos;t have a key yet?</p>
              <a href="https://enter.pollinations.ai/" target="_blank" rel="noopener noreferrer" className="vs-btn-outline px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1">Get one at Pollinations <ExternalLink size={12} /></a></div>
            <button onClick={() => { setShowKeyPopup(false); setPendingAction(null) }} className="w-full text-center text-[10px] vs-text-sub hover:underline mt-4">Maybe later</button>
          </div>
        </div>
      )}

      {/* ===== ERROR POPUP ===== */}
      {errorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setErrorPopup(null)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={(e) => e.stopPropagation()}>
            <p className="text-4xl mb-3">{errorPopup.emoji}</p><h3 className="text-lg font-bold vs-text mb-2">{errorPopup.title}</h3>
            <p className="text-sm vs-text-sub mb-5 leading-relaxed">{errorPopup.desc}</p>
            <button onClick={() => setErrorPopup(null)} className="vs-btn px-6 py-2.5 rounded-xl text-sm font-semibold">Got it</button>
          </div>
        </div>
      )}
    </div>
  )
}
