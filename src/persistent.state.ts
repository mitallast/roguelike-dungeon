export interface PersistentStore {
  save(key: string, value: any): void;
  load(key: string): any | null;
  clear(): void;
  commit(): void;
}

export class StoragePersistentStore implements PersistentStore {

  private transaction = new Map<string, any>();

  static sessionStore(prefix: string): PersistentStore {
    return new StoragePersistentStore(sessionStorage, prefix + ".");
  }

  static localStore(prefix: string): PersistentStore {
    return new StoragePersistentStore(localStorage, prefix + ".");
  }

  private readonly storage: Storage;
  private readonly prefix: string;

  private constructor(storage: Storage, prefix: string) {
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

export class SessionPersistentState implements PersistentState {
  readonly global: PersistentStore;
  readonly session: PersistentStore;

  constructor() {
    this.global = StoragePersistentStore.sessionStore("global");
    this.session = StoragePersistentStore.sessionStore("session");
  }
}