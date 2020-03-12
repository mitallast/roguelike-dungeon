export interface PersistentStore {
  save(key: string, value: any): void;
  load(key: string): any | null;
  clear(): void;
  commit(): void;
}

export class StoragePersistentStore implements PersistentStore {
  private readonly transaction = new Map<string, any>();
  private readonly storage: Storage;
  private readonly prefix: string;

  constructor(storage: Storage, prefix: string) {
    this.storage = storage;
    this.prefix = prefix;
  }

  clear(): void {
    for (let key of Object.keys(this.storage)) {
      if (key.startsWith(this.prefix)) {
        this.storage.removeItem(key);
      }
    }
    this.transaction.clear();
  }

  load(key: string): any | null {
    const value = this.storage.getItem(this.key(key));
    if (value !== null) {
      return JSON.parse(value);
    } else {
      return null;
    }
  }

  save(key: string, value: any): void {
    this.transaction.set(key, value);

    this.storage.setItem(
      this.key(key),
      JSON.stringify(value)
    );
  }

  commit(): void {
    for (let [key, value] of this.transaction) {
      this.storage.setItem(
        this.key(key),
        JSON.stringify(value)
      );
    }
    this.transaction.clear();
  }

  private key(key: string): string {
    return [this.prefix, key].join();
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