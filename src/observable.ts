export interface Publisher<T> {
  subscribe(callback: (value: T) => void, context: any): void;
  unsubscribe(callback: (value: T) => void, context: any): void;
}

export interface Observable<T> extends Publisher<T> {
  get(): T;
}

export class ObservableVar<T> implements Observable<T> {
  private _value: T;
  private readonly _listeners: Listener<T>[] = [];

  constructor(value: T) {
    this._value = value;
  }

  set(value: T) {
    this._value = value;
    for (let i = this._listeners.length - 1; i >= 0; i--) {
      let listener = this._listeners[i];
      if (listener.gc) {
        this._listeners.splice(i, 1);
      } else {
        listener.send(this._value);
      }
    }
  }

  update(f: (value: T) => T): void {
    this.set(f(this._value));
  }

  get(): T {
    return this._value;
  }

  subscribe(callback: (value: T) => void, context: any): void {
    const listener = new Listener<T>(callback, context);
    this._listeners.push(listener);
    listener.send(this._value);
  }

  unsubscribe(callback: (value: T) => void, context: any): void {
    this._listeners.find(l => l.matches(callback, context))?.unsubscribe();
  }
}

export class EventPublisher<T> implements Publisher<T> {
  private readonly _listeners: Listener<T>[] = [];

  send(value: T): void {
    for (let i = this._listeners.length - 1; i >= 0; i--) {
      let listener = this._listeners[i];
      if (listener.gc) {
        this._listeners.splice(i, 1);
      } else {
        listener.send(value);
      }
    }
  }

  subscribe(callback: (value: T) => void, context: any): void {
    const listener = new Listener<T>(callback, context);
    this._listeners.push(listener);
  }

  unsubscribe(callback: (value: T) => void, context: any): void {
    this._listeners.find(l => l.matches(callback, context))?.unsubscribe();
  }
}

class Listener<T> {
  private readonly _callback: (value: T) => void;
  private readonly _context: any;
  private _gc: boolean = false;

  get gc(): boolean {
    return this._gc;
  }

  constructor(callback: (value: T) => void, context: any) {
    this._callback = callback;
    this._context = context || null;
  }

  matches(callback: (value: T) => void, context: any): boolean {
    return this._callback === callback && this._context === context;
  }

  send(value: T): void {
    if (this._context) {
      this._callback.call(this._context, value);
    } else {
      this._callback(value);
    }
  }

  unsubscribe(): void {
    this._gc = true;
  }
}