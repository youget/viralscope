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

      while (chatMessages.length > 0 && chatMessages[0].role === 'assistant') {
        chatMessages = chatMessages.slice(1)
      }

      if (chatMessages.length === 0) {
        return Response.json({ result: "Yo send me a message first! I can't talk to myself... well I can, but that's weird." })
      }

      const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'nova-fast',
          messages: chatMessages,
        }),
      })

      const rawText = await res.text()
      if (!res.ok) return handleErr(res.status, rawText)

      try {
        const data = JSON.parse(rawText)
        return Response.json({ result: data.choices?.[0]?.message?.content || '' })
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
        key: key,
      })
      if (enhance) params.set('enhance', 'true')

      const imageUrl = `https://gen.pollinations.ai/image/${encoded}?${params}`

      return Response.json({ image: imageUrl, seed: imgSeed })
    }

    if (action === 'audio') {
      if (!hasUserKey) return Response.json({ error: 'user_key_required' }, { status: 401 })

      const encoded = encodeURIComponent(prompt)
      const params = new URLSearchParams({
        model: model || 'elevenlabs',
        key: userKey,
      })
      if (voice) params.set('voice', voice)
      if (duration) params.set('duration', String(duration))

      const audioUrl = `https://gen.pollinations.ai/audio/${encoded}?${params}`
      return Response.json({ audio: audioUrl })
    }

    if (action === 'video') {
      if (!hasUserKey) return Response.json({ error: 'user_key_required' }, { status: 401 })

      const encoded = encodeURIComponent(prompt)
      const params = new URLSearchParams({
        model: model || 'grok-video',
        duration: String(duration || 5),
        key: userKey,
      })

      const videoUrl = `https://gen.pollinations.ai/image/${encoded}?${params}`
      return Response.json({ video: videoUrl })
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
