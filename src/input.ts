enum KeyBindState {Await = 1, Pressed = 2}

export class KeyBind {
  readonly code: string;
  private _state: KeyBindState;
  private _triggered: boolean;
  private _processed: boolean;

  get triggered(): boolean {
    return this._triggered;
  }

  once(): boolean {
    if (!this._processed) {
      this._processed = true;
      return true;
    } else return false;
  }

  repeat(): boolean {
    if (!this._processed) {
      this._processed = true;
      return true;
    } else return this._triggered;
  }

  constructor(code: string) {
    this.code = code;
    this._state = KeyBindState.Await;
    this._triggered = false;
    this._processed = true;
  }

  keydown(e: KeyboardEvent): void {
    if (e.code === this.code) {
      e.preventDefault();
      if (this._state === KeyBindState.Await) {
        this._triggered = true;
        this._processed = false;
        this._state = KeyBindState.Pressed;
      }
    }
  }

  keyup(e: KeyboardEvent): void {
    if (e.code === this.code) {
      e.preventDefault();
      if (this._state === KeyBindState.Pressed) {
        this._triggered = false;
        this._state = KeyBindState.Await;
      }
    }
  }

  reset(): void {
    this._triggered = false;
    this._processed = true;
  }
}

export type DigitKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0

export class Joystick {
  readonly moveUp: KeyBind;
  readonly moveLeft: KeyBind;
  readonly moveDown: KeyBind;
  readonly moveRight: KeyBind;
  readonly hit: KeyBind;
  readonly drop: KeyBind;
  readonly inventory: KeyBind;
  readonly stats: KeyBind;
  readonly digit1: KeyBind;
  readonly digit2: KeyBind;
  readonly digit3: KeyBind;
  readonly digit4: KeyBind;
  readonly digit5: KeyBind;
  readonly digit6: KeyBind;
  readonly digit7: KeyBind;
  readonly digit8: KeyBind;
  readonly digit9: KeyBind;
  readonly digit0: KeyBind;

  private readonly _bindings: Partial<Record<string, KeyBind>>;

  constructor() {
    this.moveUp = new KeyBind('KeyW');
    this.moveLeft = new KeyBind('KeyA');
    this.moveDown = new KeyBind('KeyS');
    this.moveRight = new KeyBind('KeyD');
    this.hit = new KeyBind('KeyF');
    this.drop = new KeyBind('KeyQ');
    this.inventory = new KeyBind('KeyI');
    this.stats = new KeyBind('KeyP');

    this.digit1 = new KeyBind('Digit1');
    this.digit2 = new KeyBind('Digit2');
    this.digit3 = new KeyBind('Digit3');
    this.digit4 = new KeyBind('Digit4');
    this.digit5 = new KeyBind('Digit5');
    this.digit6 = new KeyBind('Digit6');
    this.digit7 = new KeyBind('Digit7');
    this.digit8 = new KeyBind('Digit8');
    this.digit9 = new KeyBind('Digit9');
    this.digit0 = new KeyBind('Digit0');

    this._bindings = {};

    for (const property of Object.getOwnPropertyNames(this)) {
      const value = (this as Partial<Record<string, any>>)[property];
      if (value && value instanceof KeyBind) {
        this._bindings[value.code] = value; // @todo refactor
      }
    }

    window.addEventListener("keydown", this.keydown.bind(this));
    window.addEventListener("keyup", this.keyup.bind(this));
  }

  digit(num: DigitKey): KeyBind {
    switch (num) {
      case 1:
        return this.digit1;
      case 2:
        return this.digit2;
      case 3:
        return this.digit3;
      case 4:
        return this.digit4;
      case 5:
        return this.digit5;
      case 6:
        return this.digit6;
      case 7:
        return this.digit7;
      case 8:
        return this.digit8;
      case 9:
        return this.digit9;
      case 0:
        return this.digit0;
    }
  }

  reset(): void {
    for (const code of Object.getOwnPropertyNames(this._bindings)) {
      this._bindings[code]?.reset();
    }
  }

  private keydown(e: KeyboardEvent): void {
    this._bindings[e.code]?.keydown(e);
  }

  private keyup(e: KeyboardEvent): void {
    this._bindings[e.code]?.keyup(e);
  }
}