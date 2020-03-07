export interface Subscription {
  unsubscribe(): void;
}

export class Observable<T> {
  private value: T;
  private listeners: ((value: T) => void)[] = [];

  constructor(value: T) {
    this.value = value;
  }

  set(value: T) {
    this.value = value;
    this.listeners.forEach(l => l(this.value));
  }

  update(f: (value: T) => T): void {
    this.value = f(this.value);
    this.listeners.forEach(l => l(this.value));
  }

  get(): T {
    return this.value;
  }

  subscribe(listener: (value: T) => void): Subscription {
    const self = this;
    self.listeners.push(listener);
    listener(self.value);
    return {
      unsubscribe(): void {
        self.unsubscribe(listener);
      }
    };
  }

  unsubscribe(listener: (value: T) => void): void {
    this.listeners = this.listeners.filter(c => c !== listener);
  }
}