import { WORDLIST, WORD_MAP } from './wordlist'

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

function ub64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

async function entropyToKey(entropy: Uint8Array): Promise<CryptoKey> {
  return pbkdf2Key(b64(entropy), new TextEncoder().encode(KEY_SALT))
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer))
}

export function entropyToMnemonic(entropy: Uint8Array): string {
  let value = 0n
  for (const b of entropy) value = (value << 8n) | BigInt(b)
  value = (value << 4n) | BigInt(entropy[0]! >> 4)
  const words: string[] = []
  for (let i = 0; i < 12; i++) {
    const shift = 132n - 11n * BigInt(i + 1)
    words.push(WORDLIST[Number((value >> shift) & 0x7FFn)]!)
  }
  return words.join(' ')
}

export async function mnemonicToEntropy(phrase: string): Promise<Uint8Array> {
  const parts = phrase.toLowerCase().trim().split(/\s+/)
  if (parts.length !== 12) throw new Error('La frase debe tener 12 palabras')
  let value = 0n
  for (const word of parts) {
    const idx = WORD_MAP.get(word)
    if (idx === undefined) throw new Error(`Palabra inválida: "${word}"`)
    value = (value << 11n) | BigInt(idx)
  }
  const entropy = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    const shift = BigInt(128 - 8 - i * 8)
    entropy[i] = Number((value >> shift) & 0xFFn)
  }
  const checksumFromWords = Number(value & 0xFn)
  const hash = await sha256(entropy)
  if (checksumFromWords !== hash[0]! >> 4) {
    throw new Error('Frase de recuperación inválida')
  }
  return entropy
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

export async function createVerifier(password: string): Promise<{ stored: string; key: CryptoKey; phrase: string }> {
  const entropy = crypto.getRandomValues(new Uint8Array(16))
  const phrase = entropyToMnemonic(entropy)
  const key = await entropyToKey(entropy)
  const verifier = await encrypt(VERIFIER_PLAINTEXT, key)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const pwdKey = await pbkdf2Key(password, salt)
  const encEntropy = await encrypt(b64(entropy), pwdKey)
  return {
    stored: `${b64(salt)}|${verifier}|${encEntropy}`,
    key,
    phrase,
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

export async function verifyPhrase(phrase: string, stored: string): Promise<CryptoKey | null> {
  const parts = stored.split('|')
  if (parts.length < 3) return null
  const verifier = parts[1]!
  try {
    const entropy = await mnemonicToEntropy(phrase)
    const key = await entropyToKey(entropy)
    return (await decrypt(verifier, key)) === VERIFIER_PLAINTEXT ? key : null
  } catch {
    return null
  }
}

export async function reEncryptEntropy(phrase: string, newPassword: string): Promise<string> {
  const stored = localStorage.getItem('vanta_crypto_verifier')
  if (!stored) throw new Error('No stored verifier found')
  const parts = stored.split('|')
  if (parts.length < 3) throw new Error('Invalid stored data')
  const verifier = parts[1]!
  const entropy = await mnemonicToEntropy(phrase)
  const key = await entropyToKey(entropy)
  const ok = (await decrypt(verifier, key)) === VERIFIER_PLAINTEXT
  if (!ok) throw new Error('Frase de recuperacion invalida')
  const newSalt = crypto.getRandomValues(new Uint8Array(16))
  const newPwdKey = await pbkdf2Key(newPassword, newSalt)
  const newEncEntropy = await encrypt(b64(entropy), newPwdKey)
  return `${b64(newSalt)}|${verifier}|${newEncEntropy}`
}
