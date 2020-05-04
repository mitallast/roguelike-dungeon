export interface PersistentStore {
  save(key: string, value: any): void;
  load(key: string): any | null;
  clear(): void;
  commit(): void;
}

export class StoragePersistentStore implements PersistentStore {
  private readonly _transaction = new Map<string, any>();
  private readonly _storage: Storage;
  private readonly _prefix: string;

  constructor(storage: Storage, prefix: string) {
    this._storage = storage;
    this._prefix = prefix;
  }

  clear(): void {
    for (let key of Object.keys(this._storage)) {
      if (key.startsWith(this._prefix)) {
        this._storage.removeItem(key);
      }
    }
    this._transaction.clear();
  }

  load(key: string): any | null {
    const value = this._storage.getItem(this.key(key));
    if (value !== null) {
      return JSON.parse(value);
    } else {
      return null;
    }
  }

  save(key: string, value: any): void {
    this._transaction.set(key, value);

    this._storage.setItem(
      this.key(key),
      JSON.stringify(value)
    );
  }

  commit(): void {
    for (let [key, value] of this._transaction) {
      this._storage.setItem(
        this.key(key),
        JSON.stringify(value)
      );
    }
    this._transaction.clear();
  }

  private key(key: string): string {
    return [this._prefix, key].join();
  }
}

export interface PersistentState {
  readonly global: PersistentStore;
  readonly session: PersistentStore;
}

function isLocalhost(): boolean {
  return location.hostname === "localhost" ||
    location.hostname === "0.0.0.0" ||
    location.hostname === "127.0.0.1";
}

export class SessionPersistentState implements PersistentState {
  readonly global: PersistentStore;
  readonly session: PersistentStore;

  constructor() {
    const storage = isLocalhost() ? sessionStorage : localStorage;
    this.global = new StoragePersistentStore(storage, "global.");
    this.session = new StoragePersistentStore(storage, "session.");
  }
}