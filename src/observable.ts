export interface Publisher<T> {
  subscribe(callback: (value: T) => void, context: any): void;
  unsubscribe(callback: (value: T) => void, context: any): void;
}

export interface Observable<T> extends Publisher<T> {
  get(): T;
}

export class ObservableVar<T> implements Observable<T> {
  private value: T;
  private readonly listeners: Listener<T>[] = [];

  constructor(value: T) {
    this.value = value;
  }

  set(value: T) {
    this.value = value;
    for (let listener of this.listeners) {
      listener.send(this.value);
    }
  }

  update(f: (value: T) => T): void {
    this.set(f(this.value));
  }

  get(): T {
    return this.value;
  }

  subscribe(callback: (value: T) => void, context: any): void {
    const listener = new Listener<T>(callback, context);
    this.listeners.push(listener);
    listener.send(this.value);
  }

  unsubscribe(callback: (value: T) => void, context: any): void {
    const index = this.listeners.findIndex(l => l.matches(callback, context));
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }
}

export class EventPublisher<T> implements Publisher<T> {
  private readonly listeners: Listener<T>[] = [];

  send(value: T): void {
    for (let listener of this.listeners) {
      listener.send(value);
    }
  }

  subscribe(callback: (value: T) => void, context: any): void {
    const listener = new Listener<T>(callback, context);
    this.listeners.push(listener);
  }

  unsubscribe(callback: (value: T) => void, context: any): void {
    const index = this.listeners.findIndex(l => l.matches(callback, context));
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }
}

class Listener<T> {
  private readonly callback: (value: T) => void;
  private readonly context: any;

  constructor(callback: (value: T) => void, context: any) {
    this.callback = callback;
    this.context = context || null;
  }

  matches(callback: (value: T) => void, context: any): boolean {
    return this.callback === callback && this.context === context;
  }

  send(value: T): void {
    if (this.context) {
      this.callback.call(this.context, value);
    } else {
      this.callback(value);
    }
  }
}