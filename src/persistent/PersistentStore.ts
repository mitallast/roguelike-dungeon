import {ObservableVar} from "../observable";
import {
  FloatSerializer,
  IntegerSerializer,
  JsonSerializer,
  OptionalSerializer,
  Serializer,
  StringSerializer
} from "./Serializer";

export class PersistentStore {
  private readonly _storage: Storage;
  private readonly _prefix: string;
  private _destroyed: boolean;

  static init(prefix: string): PersistentStore {
    const isLocalhost = location.hostname === "localhost" ||
      location.hostname === "0.0.0.0" ||
      location.hostname === "127.0.0.1";

    const storage = isLocalhost ? sessionStorage : localStorage;

    return new PersistentStore(storage, prefix);
  }

  private constructor(storage: Storage, prefix: string) {
    this._storage = storage;
    this._prefix = prefix + ".";
    this._destroyed = false;
  }

  private active(): void {
    if (this._destroyed) throw "IllegalStateError";
  }

  private key(key: string): string {
    return this._prefix + key;
  }

  destroy(): void {
    if (!this._destroyed) {
      this._destroyed = true;
    }
  }

  clear(): void {
    this.active();
    for (const key of Object.keys(this._storage)) {
      if (key.startsWith(this._prefix)) {
        this._storage.removeItem(key);
      }
    }
  }

  keys(): string[] {
    const keys = [];
    for (const key of Object.keys(this._storage)) {
      if (key.startsWith(this._prefix)) {
        keys.push(key.replace(this._prefix, ''));
      }
    }
    return keys;
  }

  isEmpty(): boolean {
    return this.keys().length === 0;
  }

  prefix(prefix: string): PersistentStore {
    this.active();
    return new PersistentStore(this._storage, this.key(prefix));
  }

  get(key: string): string | null {
    this.active();
    return this._storage.getItem(this.key(key));
  }

  set(key: string, value: string): void {
    this.active();
    this._storage.setItem(this.key(key), value);
  }

  remove(key: string): void {
    this.active();
    this._storage.removeItem(this.key(key));
  }

  variable<T>(key: string, initial: T, serializer: Serializer<T>): ObservableVar<T> {
    this.active();
    const source = this.get(key);
    const value: T = source === null ? initial : serializer.deserialize(source);
    return new PersistentVar<T>(key, value, serializer, this);
  }

  optionalVar<T>(key: string, initial: T | null, serializer: Serializer<T>): ObservableVar<T | null> {
    this.active();
    const optional = new OptionalSerializer<T>(serializer);
    const source = this.get(key);
    const value: T | null = source === null ? initial : optional.deserialize(source);
    return new PersistentVar<T | null>(key, value, optional, this);
  }

  stringVar(key: string, initial: string): ObservableVar<string> {
    this.active();
    return this.variable(key, initial, StringSerializer.instance);
  }

  floatVar(key: string, initial: number): ObservableVar<number> {
    this.active();
    return this.variable(key, initial, FloatSerializer.instance);
  }

  integerVar(key: string, initial: number): ObservableVar<number> {
    this.active();
    return this.variable(key, initial, IntegerSerializer.instance);
  }

  objectVar<T>(key: string, initial: T): ObservableVar<T> {
    this.active();
    return this.variable(key, initial, new JsonSerializer<T>());
  }
}

class PersistentVar<T> extends ObservableVar<T> {
  private readonly _key: string;
  private readonly _serializer: Serializer<T>;
  private readonly _store: PersistentStore;

  constructor(
    key: string,
    value: T,
    serializer: Serializer<T>,
    store: PersistentStore,
  ) {
    super(value)
    this._key = key;
    this._serializer = serializer;
    this._store = store;
  }

  protected onUpdate(value: T): void {
    this._store.set(this._key, this._serializer.serialize(value));
  }
}