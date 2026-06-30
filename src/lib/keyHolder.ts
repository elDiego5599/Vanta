let _key: CryptoKey | null = null

export function setEncryptionKey(key: CryptoKey) {
  _key = key
}

export function getEncryptionKey(): CryptoKey | null {
  return _key
}

export function clearEncryptionKey() {
  _key = null
}
