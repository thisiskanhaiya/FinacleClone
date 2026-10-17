/**
 * In-memory adapter with the same interface as the browser adapters.
 * Used by unit tests and usable as a reference implementation for a
 * future HttpStorageAdapter talking to a Spring Boot backend.
 */
export class MemoryStorageAdapter {
  constructor() {
    this.map = new Map();
  }

  get(name) {
    return this.map.has(name) ? structuredClone(this.map.get(name)) : null;
  }

  set(name, value) {
    this.map.set(name, structuredClone(value));
  }

  remove(name) {
    this.map.delete(name);
  }

  keys() {
    return [...this.map.keys()];
  }

  clear() {
    this.map.clear();
  }
}
