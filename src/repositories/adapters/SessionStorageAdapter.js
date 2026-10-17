const PREFIX = 'cbte:session:';

/**
 * sessionStorage-backed adapter. Holds only the current login session,
 * so the session survives refresh but not a tab close.
 */
export class SessionStorageAdapter {
  constructor(storage = globalThis.sessionStorage, prefix = PREFIX) {
    this.storage = storage;
    this.prefix = prefix;
  }

  key(name) {
    return `${this.prefix}${name}`;
  }

  get(name) {
    const raw = this.storage.getItem(this.key(name));
    return raw === null ? null : JSON.parse(raw);
  }

  set(name, value) {
    this.storage.setItem(this.key(name), JSON.stringify(value));
  }

  remove(name) {
    this.storage.removeItem(this.key(name));
  }

  clear() {
    const toRemove = [];
    for (let i = 0; i < this.storage.length; i += 1) {
      const k = this.storage.key(i);
      if (k && k.startsWith(this.prefix)) toRemove.push(k);
    }
    for (const k of toRemove) this.storage.removeItem(k);
  }
}

export const sessionStorageAdapter = new SessionStorageAdapter();
