const DB_NAME = 'viralscape-ai'
const STORE_NAME = 'images'
const DB_VERSION = 1
const MAX_ITEMS = 30

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function compressImage(blobUrl, maxSize) {
  const ms = maxSize || 100
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = ms
      canvas.height = ms
      const ctx = canvas.getContext('2d')
      const scale = Math.min(ms / img.width, ms / img.height)
      const w = img.width * scale
      const h = img.height * scale
      const x = (ms - w) / 2
      const y = (ms - h) / 2
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, ms, ms)
      ctx.drawImage(img, x, y, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.5))
    }
    img.onerror = () => resolve(null)
    img.src = blobUrl
  })
}

export async function saveImage(item) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const data = {
      prompt: item.prompt,
      model: item.model,
      size: item.size,
      seed: item.seed,
      thumbnail: item.thumbnail || null,
      timestamp: Date.now(),
    }
    store.add(data)

    const countReq = store.count()
    countReq.onsuccess = () => {
      if (countReq.result > MAX_ITEMS) {
        const idx = store.index('timestamp')
        const cursor = idx.openCursor()
        let deleteCount = countReq.result - MAX_ITEMS
        cursor.onsuccess = (e) => {
          const c = e.target.result
          if (c && deleteCount > 0) {
            c.delete()
            deleteCount--
            c.continue()
          }
        }
      }
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = reject
    })
    db.close()
  } catch (err) {
    console.log('IndexedDB save error:', err)
  }
}

export async function getRecentImages(limit) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const idx = store.index('timestamp')

    return new Promise((resolve) => {
      const items = []
      const req = idx.openCursor(null, 'prev')
      req.onsuccess = (e) => {
        const cursor = e.target.result
        if (cursor && items.length < (limit || 10)) {
          items.push(cursor.value)
          cursor.continue()
        } else {
          db.close()
          resolve(items)
        }
      }
      req.onerror = () => { db.close(); resolve([]) }
    })
  } catch {
    return []
  }
}

export async function clearAllImages() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    await new Promise((resolve) => { tx.oncomplete = resolve })
    db.close()
  } catch {}
}
