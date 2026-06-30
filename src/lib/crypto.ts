const VERIFIER_PLAINTEXT = 'vanta_unlock'

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 250_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )
}

function saltKey(salt: Uint8Array): string {
  return btoa(String.fromCharCode(...salt))
}

export async function createVerifier(password: string): Promise<{ stored: string; key: CryptoKey }> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(password, salt)
  const verifier = await encrypt(VERIFIER_PLAINTEXT, key)
  return { stored: `${saltKey(salt)}|${verifier}`, key }
}

export async function verifyPassword(password: string, stored: string): Promise<CryptoKey | null> {
  const idx = stored.indexOf('|')
  if (idx === -1) return null
  const saltB64 = stored.slice(0, idx)
  const verifier = stored.slice(idx + 1)
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0))
  const key = await deriveKey(password, salt)
  try {
    return (await decrypt(verifier, key)) === VERIFIER_PLAINTEXT ? key : null
  } catch {
    return null
  }
}

export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

export async function decrypt(data: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}
