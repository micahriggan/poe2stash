import { beforeEach } from 'vitest'

/**
 * The cache layer talks to `localStorage` directly, so tests run against an in-memory
 * stand-in rather than pulling in a full DOM implementation.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length() {
    return this.store.size
  }

  key(index: number) {
    return [...this.store.keys()][index] ?? null
  }

  getItem(key: string) {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value))
  }

  removeItem(key: string) {
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }
}

globalThis.localStorage = new MemoryStorage()

// Cached exchange rates and estimates must not leak between tests.
beforeEach(() => {
  localStorage.clear()
})
