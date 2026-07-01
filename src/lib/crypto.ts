const VERIFIER_PLAINTEXT = 'vanta_unlock'
const KEY_SALT = 'vanta-key-derivation'

async function pbkdf2Key(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )
}

function b64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function ub64(s: string): Uint8Array {
  const padded = s + '='.repeat((4 - s.length % 4) % 4)
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

async function entropyToKey(entropy: Uint8Array): Promise<CryptoKey> {
  return pbkdf2Key(b64(entropy), new TextEncoder().encode(KEY_SALT))
}

export function entropyToToken(entropy: Uint8Array): string {
  return 'vnt_' + b64url(entropy)
}

export function tokenToEntropy(token: string): Uint8Array {
  const clean = token.trim()
  if (!clean.startsWith('vnt_')) throw new Error('Token inválido')
  return ub64(clean.slice(4).replace(/-/g, '+').replace(/_/g, '/'))
}

export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return b64(combined)
}

export async function decrypt(data: string, key: CryptoKey): Promise<string> {
  const combined = ub64(data)
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

export async function createVerifier(password: string): Promise<{ stored: string; key: CryptoKey; token: string }> {
  const entropy = crypto.getRandomValues(new Uint8Array(23))
  const token = entropyToToken(entropy)
  const key = await entropyToKey(entropy)
  const verifier = await encrypt(VERIFIER_PLAINTEXT, key)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const pwdKey = await pbkdf2Key(password, salt)
  const encEntropy = await encrypt(b64(entropy), pwdKey)
  return {
    stored: `${b64(salt)}|${verifier}|${encEntropy}`,
    key,
    token,
  }
}

export async function verifyPassword(password: string, stored: string): Promise<CryptoKey | null> {
  const parts = stored.split('|')
  if (parts.length < 3) return null
  const saltB64 = parts[0]!
  const verifier = parts[1]!
  const encEntropy = parts[2]!
  try {
    const pwdKey = await pbkdf2Key(password, ub64(saltB64))
    const entropy = ub64(await decrypt(encEntropy, pwdKey))
    const key = await entropyToKey(entropy)
    return (await decrypt(verifier, key)) === VERIFIER_PLAINTEXT ? key : null
  } catch {
    return null
  }
}

export async function verifyToken(token: string, stored: string): Promise<CryptoKey | null> {
  const parts = stored.split('|')
  if (parts.length < 3) return null
  const verifier = parts[1]!
  try {
    const entropy = tokenToEntropy(token)
    const key = await entropyToKey(entropy)
    return (await decrypt(verifier, key)) === VERIFIER_PLAINTEXT ? key : null
  } catch {
    return null
  }
}

export async function reEncryptEntropy(token: string, newPassword: string): Promise<string> {
  const stored = localStorage.getItem('vanta_crypto_verifier')
  if (!stored) throw new Error('No stored verifier found')
  const parts = stored.split('|')
  if (parts.length < 3) throw new Error('Invalid stored data')
  const verifier = parts[1]!
  const entropy = tokenToEntropy(token)
  const key = await entropyToKey(entropy)
  const ok = (await decrypt(verifier, key)) === VERIFIER_PLAINTEXT
  if (!ok) throw new Error('Token inválido')
  const newSalt = crypto.getRandomValues(new Uint8Array(16))
  const newPwdKey = await pbkdf2Key(newPassword, newSalt)
  const newEncEntropy = await encrypt(b64(entropy), newPwdKey)
  return `${b64(newSalt)}|${verifier}|${newEncEntropy}`
}
