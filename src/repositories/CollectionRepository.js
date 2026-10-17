/**
 * Generic repository over one named collection. Methods are async even
 * though the local adapters are synchronous: this keeps the interface
 * identical to a future REST-backed implementation (Spring Boot), so no
 * service or engine code changes when the data layer is swapped.
 *
 * A record is a plain JSON object with a unique `id` field.
 */
export class CollectionRepository {
  constructor(collectionName, adapter) {
    this.collectionName = collectionName;
    this.adapter = adapter;
  }

  _read() {
    return this.adapter.get(this.collectionName) ?? [];
  }

  _write(records) {
    this.adapter.set(this.collectionName, records);
  }

  async findAll() {
    return this._read();
  }

  async findById(id) {
    return this._read().find((r) => r.id === id) ?? null;
  }

  async findWhere(predicate) {
    return this._read().filter(predicate);
  }

  async findOneWhere(predicate) {
    return this._read().find(predicate) ?? null;
  }

  async count(predicate = null) {
    const all = this._read();
    return predicate ? all.filter(predicate).length : all.length;
  }

  async insert(record) {
    const records = this._read();
    if (records.some((r) => r.id === record.id)) {
      throw new Error(`Duplicate id "${record.id}" in ${this.collectionName}.`);
    }
    records.push(record);
    this._write(records);
    return record;
  }

  /** Insert only if absent; returns the existing record otherwise. */
  async upsert(record) {
    const records = this._read();
    const index = records.findIndex((r) => r.id === record.id);
    if (index === -1) {
      records.push(record);
    } else {
      records[index] = record;
    }
    this._write(records);
    return record;
  }

  async update(id, patch) {
    const records = this._read();
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) return null;
    records[index] = { ...records[index], ...patch, id };
    this._write(records);
    return records[index];
  }

  async remove(id) {
    const records = this._read();
    const next = records.filter((r) => r.id !== id);
    this._write(next);
    return next.length !== records.length;
  }

  async replaceAll(records) {
    this._write(records);
  }

  async clear() {
    this._write([]);
  }
}
