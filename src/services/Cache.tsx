class CacheService {
  setExpiry(key: string, expiry?: number) {
    const expiryKey = `${key}_expiry`;
    if (!expiry) {
      return localStorage.removeItem(expiryKey);
    }

    localStorage.setItem(expiryKey, expiry.toString());
  }

  hasExpired(key: string) {
    const expiryKey = `${key}_expiry`;
    const expiry = localStorage.getItem(expiryKey);
    if (expiry) {
      return Date.now() > parseInt(expiry, 10);
    }
    return false;
  }

  getJson<T>(key: string): T | null {
    if (this.hasExpired(key)) {
      localStorage.removeItem(key);
      return null;
    }
    const value = localStorage.getItem(key);
    if (value) {
      return JSON.parse(value) as T;
    }
    return null;
  }

  setJson<T>(key: string, value: T, time?: number) {
    if (time) {
      this.setExpiry(key, this.future(time));
    }
    localStorage.setItem(key, JSON.stringify(value));
  }

  future(when: number) {
    return Date.now() + when;
  }

  remove(key: string): void {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_expiry`);
  }

  times = {
    second: 1000,
    minute: 1000 * 60,
    hour: 1000 * 60 * 60,
    day: 1000 * 60 * 60 * 24,
    week: 1000 * 60 * 60 * 24 * 7,
  };
}

export const Cache = new CacheService();
