export const maxDuration = 60

export async function POST(request) {
  const body = await request.json()
  const { action, messages, prompt, model, width, height, seed, enhance, userKey, voice, duration } = body

  const hasUserKey = !!userKey
  const key = userKey || process.env.POLLI_PK
  if (!key) {
    return Response.json({ error: 'no_key' }, { status: 500 })
  }

  const auth = { 'Authorization': `Bearer ${key}` }

  try {
    if (action === 'chat') {
      const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'nova-fast',
          messages: messages || [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) return handleErr(res.status)
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        return Response.json({ result: data.choices?.[0]?.message?.content || '' })
      } catch {
        return Response.json({ result: text })
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
        if (res.status === 402) return handleErr(402)
        if (res.status === 401) return handleErr(401)
        return Response.json({ error: 'api_error', message: errText || 'Image generation failed' }, { status: res.status })
      }

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('image')) {
        const errText = await res.text().catch(() => 'Not an image response')
        return Response.json({ error: 'api_error', message: errText }, { status: 500 })
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
      if (!res.ok) return handleErr(res.status)

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
      if (!res.ok) return handleErr(res.status)

      const buffer = await res.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return Response.json({ video: `data:video/mp4;base64,${base64}` })
    }

    return Response.json({ error: 'invalid_action' }, { status: 400 })
  } catch (error) {
    return Response.json({ error: 'server_error', message: error.message }, { status: 500 })
  }
}

function handleErr(status) {
  if (status === 402) return Response.json({ error: 'quota_exceeded' }, { status: 402 })
  if (status === 401) return Response.json({ error: 'invalid_key' }, { status: 401 })
  if (status === 403) return Response.json({ error: 'forbidden' }, { status: 403 })
  return Response.json({ error: 'api_error' }, { status })
}
