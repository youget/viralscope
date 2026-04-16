'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Settings, Copy, Heart, Trash2, BookOpen, Sparkles, ChevronDown,
  ExternalLink, Loader2, X, RefreshCw, Check } from 'lucide-react'
import { toast } from '../../components/Toast'
import { saveSession, updateSession, getSession, toggleSessionFav } from '../../lib/chatdb'

const USER_KEY_STORAGE = 'vs-user-polli-key'

// ─── System prompts ──────────────────────────────────────────────────────────

const SYSTEM_PERAMAL = `You are Mystica, an experienced tarot reader and astrologer with deep knowledge of tarot symbolism, astrology, numerology, and spiritual wisdom. You provide thoughtful, empowering readings and insights.

Guidelines:
- Always respond in the same language the user writes in.
- Use mystical but accessible language — warm, intuitive, and poetic.
- Reference specific cards, planets, or astrological signs when relevant.
- Always frame readings as guidance and possibility, never absolute fate.
- For tarot requests, describe card imagery and symbolism before interpreting.
- For horoscopes, consider the current planetary influences.
- Keep readings focused, meaningful, and personally relevant.
- Never dismiss spiritual questions as superstition.`

const SYSTEM_STORY = `You are Aiden Cross, a master storyteller and creative writer specializing in world-building, narrative architecture, and character development. You help users craft compelling stories, develop complex characters, and build unlimited branching story universes.

Guidelines:
- Always respond in the same language the user writes in.
- Build rich, immersive worlds with consistent internal logic and lore.
- Develop characters with depth, contradictions, and clear motivations.
- When building story trees, present branching options clearly and let the user choose the direction.
- Use vivid, cinematic language — show, don't tell.
- Track story elements (characters, locations, timeline, rules) across the conversation.
- Suggest plot directions but never force them — the user is the author.
- Support any genre: fantasy, sci-fi, horror, romance, literary fiction, etc.
- You can write in any style the user requests.`

const SYSTEM_BUILDER = `## SYSTEM INSTRUCTION: PROMPT ARCHITECTURE ENGINE v3.0

## CORE IDENTITY
You are a Senior AI Systems Architect specializing in computational linguistics & prompt engineering (10+ years), app and content system specification design, human-AI interaction architecture, and token-efficient, executable instruction crafting.

Your mission: Transform raw user needs into production-ready blueprints — for AI chat prompts, task automation, app specifications, or content systems — with consistent output in minimal iterations. You are model-agnostic and tool-agnostic. Never recommend specific AI models, APIs, or platforms.

## LAYER 0 — INTENT ROUTER (ALWAYS RUNS FIRST)
Classify every request into one of four output types before generating anything:
| Type | Name | When to use |
|------|------|-------------|
| A | Chat Prompt | AI assistant, chatbot, roleplay, persona-based interaction |
| B | Task Prompt | Automation, step-by-step pipeline, multi-turn workflow |
| C | App Spec | Web app, UI tool, deployable product, build specification |
| D | Content System | YouTube, website, newsletter, social media, multi-platform brand |

If composite type detected, state clearly and generate layered blueprint.
If unclear → ask: "Is this for a chat experience, a task to automate, an app to build, or a content system?"

## LAYER 1 — ROLE INJECTION
Define a specific AI persona with relevant sub-domains and experience context.

## LAYER 2 — CONTEXT PRIMING
Extract 3 critical variables: Domain/Topic, Target Audience, Success Metric.
If any missing → apply reasonable defaults, display them, request confirmation.

## LAYER 3 — CONDITIONAL CHECKPOINT
If ALL three variables present → skip to Layer 4.
If ANY missing → activate checkpoint with max 2 clarifying questions.
Format: PAUSE. Before continuing, confirm: 1. [missing A] 2. [missing B if needed]

## LAYER 4 — EXECUTION PROTOCOL
Define: output format, all sections, content hierarchy, style/tone guide, output length target, order of information, 1–2 embedded domain-specific examples.

## LAYER 5 — QUALITY GUARDRAILS + TOKEN ESTIMATE
Every claim must be actionable. No filler phrases. All examples domain-specific. Blueprint executable within 3 conversation turns. Target: under 1,500 tokens per blueprint.
Blacklist: jargon overload, unsupported generalizations, vague metrics, any AI model/API references.

## LAYER 6 — ITERATION PROTOCOL + VERSIONING
After every output display:
\`\`\`
─────────────────────────────
Blueprint: [Name]
Version: v1.0
Date: [date]

Which aspect to optimize next?
A) Technical depth
B) Readability & tone
C) Content length
D) Different angle / approach
E) Other (specify)
─────────────────────────────
\`\`\`
On each revision: increment version (v1.0 → v1.1), log what changed.

## OPENING MESSAGE (display this when starting a new session):
System ready. Describe what you want to build or automate:

Option 1 — Quick:
One direct sentence describing your task, app, content system, or workflow.

Option 2 — Structured:
→ Domain: [Topic or field]
→ Target User: [Who uses this output]
→ Success Metric: [What ideal output looks like]

Engine will classify your request and generate the right blueprint format.

## ERROR HANDLING
Ambiguous input → show 2–3 interpretations, ask user to confirm.
Domain too broad → force scope narrowing first.
Composite type → declare both types, generate layered blueprint.`

// ─── Library prompts ─────────────────────────────────────────────────────────

const LIBRARY_PROMPTS = [
  {
    id: 'viral-video',
    title: 'Viral Short-Form Video Script Engine',
    type: 'B',
    typeName: 'Task Prompt',
    category: 'Content',
    tags: ['video', 'marketing', 'scripts'],
    description: 'Generates structured 60–90 second video scripts with hook, problem, solution, proof, and CTA.',
    prompt: `You are a viral content strategist specializing in short-form video scripts (60–90 seconds).

When given a topic or product, generate a complete script in 5 labeled sections:

1. HOOK (0–3 sec): One punchy sentence that stops the scroll. Use a pattern interrupt or curiosity gap.
2. PROBLEM (3–10 sec): Agitate the pain point in 2 sentences max. Make it visceral.
3. SOLUTION (10–40 sec): Show the solution with 3 specific, concrete steps. No fluff.
4. PROOF (40–55 sec): One specific outcome, stat, or transformation. Make it tangible and believable.
5. CTA (55–60 sec): Single clear action. No multiple asks. Make it feel easy to do right now.

Rules:
- Every line must earn its place. Cut anything that doesn't push the story forward.
- Use conversational language, short sentences, active voice.
- Add visual direction in [brackets] for each section.
- Each section must be under 30 words.

Start every session by asking: "What's the topic or product, and who is the target viewer?"`,
  },
  {
    id: 'ecom-copy',
    title: 'E-commerce Product Copywriter',
    type: 'B',
    typeName: 'Task Prompt',
    category: 'Marketing',
    tags: ['ecommerce', 'copywriting', 'conversion'],
    description: 'Converts product features into high-converting copy with headline, hook, benefits, social proof, and CTA.',
    prompt: `You are an e-commerce conversion copywriter. For any product provided, generate a complete copy package:

1. HEADLINE: Benefit-first, max 10 words. Focus on transformation, not features.
2. HOOK: One sentence that speaks directly to the buyer's desire or frustration.
3. FEATURE → BENEFIT LIST: 5 items. Format exactly: [Feature] → [Specific benefit to the buyer]
4. SOCIAL PROOF TEMPLATE: One fill-in-the-blank customer review format.
5. CTA: Action-oriented, urgency without fake scarcity. Max 8 words.

Rules:
- Never use: "high quality", "best in class", "revolutionary", "amazing"
- Every claim must be specific and verifiable
- Speak to one person, not a crowd
- Match language register to the target buyer (casual for lifestyle, technical for tools)

Start by asking: "What's the product, who buys it, and what's the #1 reason they hesitate to buy?"`,
  },
  {
    id: 'personal-brand',
    title: 'Personal Brand Content System',
    type: 'D',
    typeName: 'Content System',
    category: 'Brand',
    tags: ['linkedin', 'personal brand', 'content strategy'],
    description: 'Builds a complete LinkedIn content system with positioning, pillars, weekly cadence, and post templates.',
    prompt: `You are a personal brand strategist. Build a complete LinkedIn content system for the person I describe.

IDENTITY FOUNDATION:
- Positioning statement: "[Name] helps [audience] achieve [outcome] through [unique approach]"
- Content voice: 3 adjectives that define tone
- Core story angle: The specific experience that makes them credible and different

CONTENT PILLARS (3 pillars × 4 post ideas each = 12 total):
- Pillar 1: Expertise (what you know deeply)
- Pillar 2: Process (how you actually work)
- Pillar 3: Perspective (what you believe that others don't)

WEEKLY CADENCE:
- Monday: Insight post (bold opinion + 3 supporting points)
- Wednesday: Story post (personal experience + transferable lesson)
- Friday: Resource post (framework, tool, or checklist the audience can use today)

POST TEMPLATE:
Line 1: Hook — bold claim or counterintuitive statement
Lines 2–5: 3 specific points, each with a micro-example
Last line: One open question to drive comments

Start by asking: "What's your professional background, who do you want to attract, and what do you want to be known for in 12 months?"`,
  },
  {
    id: 'support-agent',
    title: 'AI Customer Support Agent',
    type: 'A',
    typeName: 'Chat Prompt',
    category: 'Business',
    tags: ['customer support', 'chatbot', 'automation'],
    description: 'A complete support agent persona with resolution protocols, tone guidelines, and escalation triggers.',
    prompt: `You are Alex, a customer support specialist. Your role is to resolve customer issues efficiently and leave every interaction with a positive impression.

BEHAVIOR RULES:
- Always acknowledge the customer's frustration before offering solutions
- Never say "I can't" — say "Here's what I can do"
- Ask maximum 2 clarifying questions before proposing a solution
- Escalation trigger: if issue cannot be resolved in 3 exchanges → offer human handoff

RESPONSE STRUCTURE:
1. Empathy acknowledgment (1 sentence, specific to their issue)
2. Clarifying question OR solution — never both at once
3. Resolution or clear next step (specific and actionable)
4. Confirmation: "Does this resolve your issue?"

TONE: Professional but warm. Direct, not robotic. Match the customer's energy level — calm them if they're upset, be efficient if they're in a hurry.

SCOPE: Handle returns, shipping issues, product questions, billing inquiries.
OUT OF SCOPE: Legal disputes, pricing negotiations, complaints requiring management → escalate immediately.

[Replace "Alex" with your brand name and customize the scope before deploying]`,
  },
  {
    id: 'tutor-bot',
    title: 'Adaptive Educational Tutor',
    type: 'A',
    typeName: 'Chat Prompt',
    category: 'Education',
    tags: ['tutor', 'education', 'learning'],
    description: 'A Socratic teaching bot that builds genuine understanding using the Feynman technique and adaptive difficulty.',
    prompt: `You are an adaptive learning tutor. Your goal is to build genuine understanding, not just provide answers.

TEACHING METHODOLOGY:
- Socratic approach: guide with questions before giving direct answers
- Feynman technique: regularly ask students to explain concepts back in simple terms
- Spaced repetition: reference previous concepts when introducing new ones
- Never complete homework for the student — guide them to the answer instead

LESSON STRUCTURE for every topic:
1. Concept check: "What do you already know about [topic]?"
2. Core explanation: Use one analogy from everyday life
3. Worked example: Step-by-step, narrate every decision out loud
4. Practice problem: Give one problem, don't solve it — guide with Socratic questions
5. Reflection: "In your own words, what did you learn today?"

ADAPTIVE RULES:
- If student is confused (3+ wrong attempts): simplify by one level of abstraction
- If student is advanced (gets it immediately): increase complexity and add edge cases
- If student just wants the answer: give it but always explain the reasoning behind it

Respond in the same language the student writes in.`,
  },
  {
    id: 'seo-engine',
    title: 'SEO Blog Content Engine',
    type: 'D',
    typeName: 'Content System',
    category: 'SEO',
    tags: ['seo', 'blog', 'content marketing'],
    description: 'Full content briefs with keyword strategy, article structure, meta tags, and repurposing angles.',
    prompt: `You are an SEO content strategist building topical authority. For any keyword and niche provided, generate a complete content brief:

KEYWORD ANALYSIS:
- Primary keyword: [provided by user]
- 3 semantic variations (LSI keywords to include naturally)
- Search intent: Informational / Commercial / Transactional / Navigational

CONTENT STRUCTURE:
- Title: Primary keyword + power word. Max 60 characters.
- Meta description: Include primary keyword in first 20 words. 150–155 characters exactly.
- H1: Matches or closely mirrors the title
- H2 outline: 6–8 sections covering the full topic cluster
- Word count target: [estimate based on keyword difficulty]

CONTENT REQUIREMENTS:
- Introduction: Lead with the reader's pain point — not background, not history
- Each H2: Opens with topic sentence, includes one specific example or data point
- Featured snippet target: One H2 that directly answers a question in 40–50 words
- Internal link placeholders: 3 related topics to link to [fill in your own URLs]

DISTRIBUTION ANGLES:
- LinkedIn post: Key insight from section 3, reframed as a personal opinion
- Short-form video hook: Opening paragraph compressed into a 15-second script

Start by asking: "What's your target keyword, your website's niche, and what action do you want readers to take after reading?"`,
  },
]

// ─── Builder models ───────────────────────────────────────────────────────────

const BUILDER_MODELS = [
  { id: 'gemini-fast', label: 'Gemini 2.5 Flash Lite', free: true },
  { id: 'gemini-search', label: 'Gemini 2.5 Flash Search', free: false },
  { id: 'openai', label: 'GPT-5.4 Nano', free: false },
  { id: 'openai-fast', label: 'GPT-5 Nano', free: false },
  { id: 'openai-large', label: 'GPT-5.4', free: false },
  { id: 'grok', label: 'Grok 4.1 Fast', free: false },
  { id: 'grok-large', label: 'Grok 4.20 Reasoning', free: false },
  { id: 'claude-fast', label: 'Claude Haiku 4.5', free: false },
  { id: 'mistral-large', label: 'Mistral Large 3', free: false },
  { id: 'deepseek', label: 'DeepSeek V3.2', free: false },
  { id: 'qwen-large', label: 'Qwen3.6 Plus', free: false },
  { id: 'qwen-coder-large', label: 'Qwen3 Coder Next', free: false },
  { id: 'qwen-vision', label: 'Qwen3 VL Plus', free: false },
  { id: 'nova', label: 'Nova 2 Lite', free: false },
  { id: 'minimax', label: 'MiniMax M2.5', free: false },
  { id: 'kimi', label: 'Moonshot Kimi K2.5', free: false },
  { id: 'perplexity-fast', label: 'Perplexity Sonar', free: false },
  { id: 'perplexity-reasoning', label: 'Perplexity Sonar Reasoning', free: false },
  { id: 'glm', label: 'Z.ai GLM-5.1', free: false },
]

// ─── Tab config ───────────────────────────────────────────────────────────────

const TAB_CONFIG = {
  peramal: {
    label: 'Fortune Teller',
    emoji: '🔮',
    model: 'nova-fast',
    welcomeContent: "Welcome, seeker. 🔮 The cards are ready to reveal what lies ahead.\n\nAsk about love, career, life path — or simply request your horoscope for today. What would you like to explore?",
  },
  story: {
    label: 'Story Builder',
    emoji: '📖',
    model: 'mistral',
    welcomeContent: "Hey, ready to build something? 📖\n\nShare a story idea, a character, a world — or just a feeling you want to explore. We'll build from there, one branch at a time.",
  },
  builder: {
    label: 'Blueprint Builder',
    emoji: '🏗️',
    model: 'gemini-fast',
    welcomeContent: "**System ready.** Describe what you want to build or automate:\n\n**Option 1 — Quick:**\nOne direct sentence describing your task, app, content system, or workflow.\n\n**Option 2 — Structured:**\n→ Domain: [Topic or field]\n→ Target User: [Who uses this output]\n→ Success Metric: [What ideal output looks like]\n\n*Example: \"Build a content system for a personal finance YouTube channel targeting Gen Z, goal: 10K subs in 6 months.\"*\n\nEngine will classify your request and generate the right blueprint format.",
  },
}

const SYSTEM_MAP = { peramal: SYSTEM_PERAMAL, story: SYSTEM_STORY, builder: SYSTEM_BUILDER }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUserKey() { try { return localStorage.getItem(USER_KEY_STORAGE) || '' } catch { return '' } }
function saveUserKey(k) { try { localStorage.setItem(USER_KEY_STORAGE, k) } catch {} }
function clearUserKey() { try { localStorage.removeItem(USER_KEY_STORAGE) } catch {} }

function makeWelcome(tabId) {
  return { role: 'assistant', content: TAB_CONFIG[tabId].welcomeContent, isWelcome: true }
}

function formatTimestamp(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Simple markdown renderer for chat messages
function renderContent(content) {
  const lines = content.split('\n')
  const result = []
  let inCode = false
  let codeBuffer = []
  let codeLang = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      if (!inCode) { inCode = true; codeLang = line.slice(3).trim(); codeBuffer = [] }
      else {
        result.push(
          <pre key={i} className="my-2 p-3 rounded-lg overflow-x-auto text-[11px] leading-relaxed"
            style={{ backgroundColor: 'var(--vs-bg2)', fontFamily: 'monospace' }}>
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        )
        inCode = false; codeBuffer = []; codeLang = ''
      }
      continue
    }
    if (inCode) { codeBuffer.push(line); continue }

    // Horizontal rule
    if (line.match(/^─+$/) || line.match(/^-{3,}$/)) {
      result.push(<hr key={i} className="my-2 border-t vs-border" />)
      continue
    }

    // Process inline bold and code
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={j}>{part.slice(2, -2)}</strong>
      if (part.startsWith('`') && part.endsWith('`')) return <code key={j} className="px-1 py-0.5 rounded text-[11px]" style={{ backgroundColor: 'var(--vs-bg2)', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>
      return part
    })

    if (line === '') { result.push(<br key={i} />) }
    else { result.push(<p key={i} className="leading-relaxed">{rendered}</p>) }
  }
  return result
}

// ─── Main component ───────────────────────────────────────────────────────────

function ChatPageInner() {
  const searchParams = useSearchParams()

  const [tab, setTab] = useState('peramal')
  const [messages, setMessages] = useState({
    peramal: [makeWelcome('peramal')],
    story: [makeWelcome('story')],
    builder: [makeWelcome('builder')],
  })
  const [sessionIds, setSessionIds] = useState({ peramal: null, story: null, builder: null })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Builder settings
  const [builderModel, setBuilderModel] = useState('gemini-fast')
  const [showSettings, setShowSettings] = useState(false)

  // Library
  const [libSelected, setLibSelected] = useState(null)

  // Key popup
  const [userKey, setUserKey] = useState('')
  const [showKeyPopup, setShowKeyPopup] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [keyReason, setKeyReason] = useState('')
  const [pendingAction, setPendingAction] = useState(null)

  // Misc
  const [savedIndicator, setSavedIndicator] = useState({ peramal: false, story: false, builder: false })
  const [copiedId, setCopiedId] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [errorPopup, setErrorPopup] = useState(null)

  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    setUserKey(getUserKey())
    const sessionId = searchParams.get('session')
    const sessionType = searchParams.get('type')
    if (sessionId) loadFromHistory(parseInt(sessionId), sessionType)
    const t = searchParams.get('tab')
    if (t && ['peramal', 'story', 'builder', 'library'].includes(t)) setTab(t)
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading, tab])

  async function loadFromHistory(id, type) {
    const session = await getSession(id)
    if (!session) return
    const tabId = session.type
    setTab(tabId)
    setMessages(prev => ({
      ...prev,
      [tabId]: [makeWelcome(tabId), ...session.messages],
    }))
    setSessionIds(prev => ({ ...prev, [tabId]: id }))
    if (tabId === 'builder' && session.model) setBuilderModel(session.model)
  }

  function hasKey() { return !!getUserKey() }

  function openKeyPopup(reason, action) {
    const k = getUserKey()
    if (k) { if (action) action(k); return }
    setKeyReason(reason); setPendingAction(() => action); setKeyInput(''); setShowKeyPopup(true)
  }

  function handleKeySave() {
    if (!keyInput.trim()) return
    saveUserKey(keyInput.trim()); setUserKey(keyInput.trim())
    setShowKeyPopup(false)
    if (pendingAction) pendingAction(keyInput.trim())
    setPendingAction(null)
  }

  function handleKeyClear() { clearUserKey(); setUserKey('') }

  function getModel() {
    if (tab === 'builder') return builderModel
    return TAB_CONFIG[tab]?.model || 'nova-fast'
  }

  function needsKey() {
    if (tab === 'builder') {
      const m = BUILDER_MODELS.find(m => m.id === builderModel)
      return m && !m.free
    }
    return false
  }

  async function handleSend(e) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading || tab === 'library') return
    if (needsKey() && !hasKey()) { openKeyPopup('builder_model', () => doSend(text)); return }
    doSend(text)
  }

  async function doSend(text) {
    const tabId = tab
    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages[tabId], userMsg]
    setMessages(prev => ({ ...prev, [tabId]: newMessages }))
    setInput(''); setLoading(true)

    // Build API messages: system + history (no welcome messages)
    const apiMessages = [
      { role: 'system', content: SYSTEM_MAP[tabId] },
      ...newMessages.filter(m => !m.isWelcome).map(m => ({ role: m.role, content: m.content })),
    ]

    try {
      const k = getUserKey()
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          messages: apiMessages,
          model: getModel(),
          ...(k && { userKey: k }),
        }),
      })
      const data = await res.json()

      if (data.error) {
        if (data.error === 'quota_exceeded') { setKeyReason('quota'); setShowKeyPopup(true) }
        else setErrorPopup({ emoji: '💀', title: 'Something went wrong', desc: 'Failed to get a response. Try again.' })
        setLoading(false); return
      }

      const assistantMsg = { role: 'assistant', content: data.result || "Hmm, no response. Try again?" }
      const finalMessages = [...newMessages, assistantMsg]
      setMessages(prev => ({ ...prev, [tabId]: finalMessages }))

      // Auto-save to IndexedDB
      await autoSave(tabId, finalMessages)
    } catch {
      const errMsg = { role: 'assistant', content: 'Connection error. Try again?' }
      setMessages(prev => ({ ...prev, [tabId]: [...newMessages, errMsg] }))
    }
    setLoading(false)
  }

  async function autoSave(tabId, msgs) {
    const saveable = msgs.filter(m => !m.isWelcome)
    if (saveable.length < 2) return // Need at least 1 user + 1 assistant

    const title = saveable.find(m => m.role === 'user')?.content?.slice(0, 60) || 'Untitled'

    if (sessionIds[tabId]) {
      await updateSession(sessionIds[tabId], { messages: saveable, title })
    } else {
      const id = await saveSession({
        type: tabId,
        title,
        messages: saveable,
        model: getModel(),
      })
      if (id) {
        setSessionIds(prev => ({ ...prev, [tabId]: id }))
        setSavedIndicator(prev => ({ ...prev, [tabId]: true }))
        setTimeout(() => setSavedIndicator(prev => ({ ...prev, [tabId]: false })), 2000)
      }
    }
  }

  function clearChat() {
    const tabId = tab
    setMessages(prev => ({ ...prev, [tabId]: [makeWelcome(tabId)] }))
    setSessionIds(prev => ({ ...prev, [tabId]: null }))
    setConfirmClear(false)
    inputRef.current?.focus()
  }

  async function copyMessage(content, id) {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
      toast('Copied!')
    } catch { toast('Failed to copy') }
  }

  const currentMessages = tab !== 'library' ? (messages[tab] || []) : []
  const tabCfg = TAB_CONFIG[tab]

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 68px)', paddingTop: '56px' }}>

      {/* ── Tab bar ── */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex gap-1 vs-card border vs-border rounded-xl p-1">
          {[...Object.entries(TAB_CONFIG), ['library', { label: 'Library', emoji: '📚' }]].map(([id, cfg]) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
              style={{ backgroundColor: tab === id ? 'var(--vs-accent)' : 'transparent', color: tab === id ? '#fff' : 'var(--vs-text-sub)' }}>
              <span>{cfg.emoji}</span>
              <span className="hidden sm:inline">{cfg.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Builder settings bar ── */}
      {tab === 'builder' && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl vs-card border vs-border text-xs vs-text flex-1">
              <Settings size={12} style={{ color: 'var(--vs-accent)' }} />
              <span className="flex-1 text-left">{BUILDER_MODELS.find(m => m.id === builderModel)?.label || builderModel}</span>
              {!BUILDER_MODELS.find(m => m.id === builderModel)?.free && <span className="text-[9px] vs-text-sub">🔑</span>}
              <ChevronDown size={12} className="vs-text-sub" style={{ transform: showSettings ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            {userKey && (
              <div className="px-2 py-1.5 rounded-xl vs-card border vs-border text-[10px] flex items-center gap-1">
                <span style={{ color: 'var(--vs-accent)' }}>●</span>
                <span className="vs-text-sub">Key active</span>
              </div>
            )}
          </div>
          {showSettings && (
            <div className="mt-1 vs-card border vs-border rounded-xl max-h-48 overflow-y-auto">
              <div className="p-2 border-b vs-border">
                <p className="text-[9px] vs-text-sub uppercase tracking-wider px-2">Model · ✨ Free · 🔑 Requires key</p>
              </div>
              {BUILDER_MODELS.map(m => (
                <button key={m.id} onClick={() => {
                  if (!m.free && !hasKey()) { openKeyPopup('builder_model', () => { setBuilderModel(m.id); setShowSettings(false) }); return }
                  setBuilderModel(m.id); setShowSettings(false)
                }} className="w-full flex items-center gap-2 px-3 py-2 text-xs vs-hover border-b vs-border last:border-b-0"
                  style={{ color: builderModel === m.id ? 'var(--vs-accent)' : 'var(--vs-text)' }}>
                  <span className="flex-1 text-left">{m.label}</span>
                  <span>{m.free ? '✨' : '🔑'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Messages ── */}
      {tab !== 'library' && (
        <div className="flex-1 overflow-y-auto px-4">
          <div className="flex flex-col gap-3 py-2 pb-4">
            {currentMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'px-4 py-3 text-white rounded-br-sm'
                    : 'px-4 py-3 vs-card border vs-border vs-text rounded-bl-sm'
                }`} style={msg.role === 'user' ? { backgroundColor: 'var(--vs-accent)' } : {}}>

                  {msg.role === 'assistant' ? (
                    <div className="leading-relaxed">{renderContent(msg.content)}</div>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {/* Copy button for assistant messages */}
                  {msg.role === 'assistant' && !msg.isWelcome && (
                    <button onClick={() => copyMessage(msg.content, i)}
                      className="mt-2 flex items-center gap-1 text-[10px] vs-text-sub hover:vs-text transition-colors">
                      {copiedId === i ? <Check size={10} /> : <Copy size={10} />}
                      {copiedId === i ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm vs-card border vs-border">
                  <Loader2 size={16} className="animate-spin vs-text-sub" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>
      )}

      {/* ── Library ── */}
      {tab === 'library' && (
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <p className="text-xs vs-text-sub text-center mb-4">Ready-to-use master prompts — copy and use in any AI</p>
          <div className="flex flex-col gap-3 pb-4">
            {LIBRARY_PROMPTS.map(p => (
              <div key={p.id} className="vs-card border vs-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: 'var(--vs-accent)' }}>
                        Type {p.type}
                      </span>
                      <span className="text-[9px] vs-text-sub">{p.category}</span>
                    </div>
                    <p className="text-sm font-bold vs-text">{p.title}</p>
                  </div>
                </div>
                <p className="text-xs vs-text-sub leading-relaxed mb-3">{p.description}</p>
                <div className="flex gap-2">
                  <button onClick={() => setLibSelected(p)}
                    className="flex-1 vs-btn-outline py-2 rounded-xl text-xs font-semibold gap-1">
                    <BookOpen size={12} /> Preview
                  </button>
                  <button onClick={() => copyMessage(p.prompt, p.id)}
                    className="flex-1 vs-btn py-2 rounded-xl text-xs font-semibold gap-1">
                    {copiedId === p.id ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      {tab !== 'library' && (
        <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t vs-border">
          <div className="flex items-center gap-2 mb-2">
            {/* Saved indicator */}
            {savedIndicator[tab] && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--vs-accent)' }}>
                <Check size={10} /> Saved to history
              </span>
            )}
            <div className="flex-1" />
            <button onClick={() => setConfirmClear(true)} className="text-[10px] vs-text-sub hover:underline flex items-center gap-1">
              <Trash2 size={10} /> Clear chat
            </button>
          </div>
          <form onSubmit={handleSend} className="flex gap-2">
            <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder={tab === 'peramal' ? 'Ask about your fortune...' : tab === 'story' ? 'Continue the story...' : 'Describe what to build...'}
              className="flex-1 py-3 px-4 rounded-xl vs-card border vs-border text-sm vs-text outline-none"
              style={{ backgroundColor: 'var(--vs-card)' }} />
            <button type="submit" disabled={loading || !input.trim()}
              className="vs-btn w-11 h-11 rounded-xl flex-shrink-0"
              style={{ opacity: loading || !input.trim() ? 0.5 : 1 }}>
              <Send size={16} />
            </button>
          </form>
          <p className="text-[9px] vs-text-sub mt-1.5 text-center">
            Press Enter to send · Conversations auto-saved to{' '}
            <a href="/favorites?tab=chat" className="underline" style={{ color: 'var(--vs-accent)' }}>History</a>
          </p>
        </div>
      )}

      {/* ── Library preview modal ── */}
      {libSelected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-20" onClick={() => setLibSelected(null)}>
          <div className="vs-card rounded-2xl border vs-border w-full max-w-lg max-h-[75vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b vs-border flex-shrink-0">
              <div>
                <p className="text-sm font-bold vs-text">{libSelected.title}</p>
                <p className="text-[10px] vs-text-sub">Type {libSelected.type} — {libSelected.typeName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => copyMessage(libSelected.prompt, libSelected.id)}
                  className="vs-btn px-3 py-1.5 rounded-lg text-xs font-semibold gap-1">
                  {copiedId === libSelected.id ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
                <button onClick={() => setLibSelected(null)} className="vs-text-sub p-1.5 vs-hover rounded-lg"><X size={16} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-xs vs-text leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'inherit' }}>{libSelected.prompt}</pre>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm clear ── */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setConfirmClear(false)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={e => e.stopPropagation()}>
            <p className="text-4xl mb-3">🗑️</p>
            <h3 className="text-lg font-bold vs-text mb-2">Clear this chat?</h3>
            <p className="text-sm vs-text-sub mb-5">Current conversation will be cleared. Previously saved history remains in{' '}
              <a href="/favorites?tab=chat" className="underline" style={{ color: 'var(--vs-accent)' }}>History</a>.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmClear(false)} className="flex-1 vs-btn-outline px-4 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={clearChat} className="flex-1 vs-btn px-4 py-2.5 rounded-xl text-sm font-semibold">Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Key popup ── */}
      {showKeyPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => { setShowKeyPopup(false); setPendingAction(null) }}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full border vs-border" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <p className="text-4xl mb-2">{keyReason === 'quota' ? '😭' : '🔑'}</p>
              <h3 className="text-lg font-bold vs-text mb-1">{keyReason === 'quota' ? 'Pollen depleted' : 'API key required'}</h3>
              <p className="text-xs vs-text-sub leading-relaxed">
                {keyReason === 'quota' ? 'Server pollen is out. Add your own key to keep chatting.' : 'This model requires your own Pollinations API key.'}
              </p>
            </div>
            <input type="text" value={keyInput} onChange={e => setKeyInput(e.target.value)}
              placeholder="Paste your API key..." onKeyDown={e => e.key === 'Enter' && handleKeySave()}
              className="w-full py-3 px-4 rounded-xl vs-card border vs-border text-sm vs-text outline-none mb-4"
              style={{ backgroundColor: 'var(--vs-bg)' }} />
            <button onClick={handleKeySave} disabled={!keyInput.trim()}
              className="vs-btn w-full py-2.5 rounded-xl text-sm font-semibold mb-3"
              style={{ opacity: keyInput.trim() ? 1 : 0.5 }}>
              Save Key
            </button>
            <div className="text-center mb-3">
              <p className="text-[10px] vs-text-sub mb-2">Don't have a key?</p>
              <a href="https://enter.pollinations.ai/" target="_blank" rel="noopener noreferrer"
                className="vs-btn-outline px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1">
                Get one at Pollinations <ExternalLink size={12} />
              </a>
            </div>
            {userKey && (
              <div className="pt-3 border-t vs-border text-center">
                <button onClick={() => { handleKeyClear(); setShowKeyPopup(false) }} className="text-[10px] vs-text-sub hover:underline">Remove active key</button>
              </div>
            )}
            <button onClick={() => { setShowKeyPopup(false); setPendingAction(null) }}
              className="w-full text-center text-[10px] vs-text-sub hover:underline mt-3">
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* ── Error popup ── */}
      {errorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setErrorPopup(null)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={e => e.stopPropagation()}>
            <p className="text-4xl mb-3">{errorPopup.emoji}</p>
            <h3 className="text-lg font-bold vs-text mb-2">{errorPopup.title}</h3>
            <p className="text-sm vs-text-sub mb-5">{errorPopup.desc}</p>
            <button onClick={() => setErrorPopup(null)} className="vs-btn px-6 py-2.5 rounded-xl text-sm font-semibold">Got it</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin vs-text-sub" size={24} /></div>}>
      <ChatPageInner />
    </Suspense>
  )
}
