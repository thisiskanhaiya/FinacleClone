const PREFIX = 'cbte:';

/**
 * localStorage-backed adapter. All durable training data uses this.
 * Implements the same interface as MemoryStorageAdapter so the data layer
 * can later be swapped for an HTTP adapter against a Spring Boot backend
 * without touching repositories, services or engines.
 */
export class LocalStorageAdapter {
  constructor(storage = globalThis.localStorage, prefix = PREFIX) {
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

  keys() {
    const all = [];
    for (let i = 0; i < this.storage.length; i += 1) {
      const k = this.storage.key(i);
      if (k && k.startsWith(this.prefix)) all.push(k.slice(this.prefix.length));
    }
    return all;
  }

  clear() {
    for (const name of this.keys()) this.remove(name);
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
