export const maxDuration = 60

export async function POST(request) {
  const body = await request.json()
  const { action, messages, prompt, model, width, height, seed, enhance, userKey, voice, duration } = body

  const hasUserKey = !!userKey
  const key = userKey || process.env.POLLI_PK
  
  if (!key) {
    return Response.json({ error: 'no_key', message: 'No API key found.' }, { status: 500 })
  }

  const auth = { 'Authorization': `Bearer ${key}` }

  try {
    if (action === 'chat') {
      let chatMessages = messages || [{ role: 'user', content: prompt }]
      
      // API requires first message to be from user, not assistant
      // Remove leading assistant messages (our greeting)
      while (chatMessages.length > 0 && chatMessages[0].role === 'assistant') {
        chatMessages = chatMessages.slice(1)
      }

      // If no user messages left, return early
      if (chatMessages.length === 0) {
        return Response.json({ result: "Yo send me a message first! I can't talk to myself... well I can, but that's weird." })
      }

      const chatBody = {
        model: model || 'nova-fast',
        messages: chatMessages,
      }

      const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(chatBody),
      })

      const rawText = await res.text()

      if (!res.ok) {
        console.log('Chat API error:', res.status, rawText)
        return handleErr(res.status, rawText)
      }

      try {
        const data = JSON.parse(rawText)
        const content = data.choices?.[0]?.message?.content || ''
        return Response.json({ result: content })
      } catch {
        return Response.json({ result: rawText })
      }
    }

    if (action === 'image') {
      const encoded = encodeURIComponent(prompt)
      const imgSeed = seed || Math.floor(Math.random() * 999999)
      const params = new URLSearchParams({
        model: model || 'zimage',
        width: String(width || 1024),
        height: String(height || 1024),
        seed: String(imgSeed),
        safe: 'true',
        nologo: 'true',
      })
      if (enhance) params.set('enhance', 'true')

      const res = await fetch(`https://gen.pollinations.ai/image/${encoded}?${params}`, {
        headers: auth,
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        console.log('Image API error:', res.status, errText)
        return handleErr(res.status, errText)
      }

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('image')) {
        const errText = await res.text().catch(() => 'Not an image response')
        return Response.json({ error: 'api_error', message: 'Response was not an image. Try again.' }, { status: 500 })
      }

      const buffer = await res.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const ct = contentType || 'image/jpeg'
      return Response.json({ image: `data:${ct};base64,${base64}`, seed: imgSeed })
    }

    if (action === 'audio') {
      if (!hasUserKey) return Response.json({ error: 'user_key_required' }, { status: 401 })

      const encoded = encodeURIComponent(prompt)
      const params = new URLSearchParams({ model: model || 'elevenlabs' })
      if (voice) params.set('voice', voice)
      if (duration) params.set('duration', String(duration))

      const res = await fetch(`https://gen.pollinations.ai/audio/${encoded}?${params}`, {
        headers: { 'Authorization': `Bearer ${userKey}` },
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        return handleErr(res.status, errText)
      }

      const buffer = await res.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return Response.json({ audio: `data:audio/mpeg;base64,${base64}` })
    }

    if (action === 'video') {
      if (!hasUserKey) return Response.json({ error: 'user_key_required' }, { status: 401 })

      const encoded = encodeURIComponent(prompt)
      const params = new URLSearchParams({
        model: model || 'grok-video',
        duration: String(duration || 5),
      })

      const res = await fetch(`https://gen.pollinations.ai/image/${encoded}?${params}`, {
        headers: { 'Authorization': `Bearer ${userKey}` },
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        return handleErr(res.status, errText)
      }

      const buffer = await res.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return Response.json({ video: `data:video/mp4;base64,${base64}` })
    }

    return Response.json({ error: 'invalid_action' }, { status: 400 })
  } catch (error) {
    console.log('Server error:', error.message)
    return Response.json({ error: 'server_error', message: error.message }, { status: 500 })
  }
}

function handleErr(status, detail) {
  if (status === 402) return Response.json({ error: 'quota_exceeded', message: detail }, { status: 402 })
  if (status === 401) return Response.json({ error: 'invalid_key', message: detail }, { status: 401 })
  if (status === 403) return Response.json({ error: 'forbidden', message: detail }, { status: 403 })
  return Response.json({ error: 'api_error', message: detail || 'Unknown error' }, { status })
}
