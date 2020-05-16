export class KeyBind {
  readonly code: string;
  private _triggered: boolean;
  private _processed: boolean;
  private _startedAt: number = 0;
  private _finishedAt: number = 0;

  get triggered(): boolean {
    return this._triggered;
  }

  get startedAt(): number {
    return this._startedAt;
  }

  get finishedAt(): number {
    return this._finishedAt;
  }

  get duration(): number {
    return this._finishedAt - this._startedAt;
  }

  constructor(code: string, bindings: Partial<Record<string, KeyBind>>) {
    this.code = code;
    this._triggered = false;
    this._processed = true;
    bindings[code] = this;
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

  keydown(e: KeyboardEvent): void {
    if (!e.repeat && e.code === this.code) {
      e.preventDefault();
      this._startedAt = e.timeStamp;
      this._finishedAt = 0;
      this._triggered = true;
      this._processed = false;
    }
  }

  keyup(e: KeyboardEvent): void {
    if (!e.repeat && e.code === this.code) {
      e.preventDefault();
      this._finishedAt = e.timeStamp;
      this._triggered = false;
    }
  }
}

export type DigitKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0

export class Joystick {
  readonly moveUp: KeyBind;
  readonly moveLeft: KeyBind;
  readonly moveDown: KeyBind;
  readonly moveRight: KeyBind;
  readonly hit: KeyBind;
  readonly dodge: KeyBind;
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

  get direction(): [number, number] {
    const left = this.moveLeft.triggered ? 1 : 0;
    const right = this.moveRight.triggered ? 1 : 0;
    const up = this.moveUp.triggered ? 1 : 0;
    const down = this.moveDown.triggered ? 1 : 0;
    return [right - left, down - up];
  }

  private readonly _bindings: Partial<Record<string, KeyBind>>;

  constructor() {
    this._bindings = {};

    this.moveUp = new KeyBind('KeyW', this._bindings);
    this.moveLeft = new KeyBind('KeyA', this._bindings);
    this.moveDown = new KeyBind('KeyS', this._bindings);
    this.moveRight = new KeyBind('KeyD', this._bindings);
    this.hit = new KeyBind('KeyF', this._bindings);
    this.dodge = new KeyBind('Space', this._bindings);

    this.drop = new KeyBind('KeyQ', this._bindings);
    this.inventory = new KeyBind('KeyI', this._bindings);
    this.stats = new KeyBind('KeyP', this._bindings);

    this.digit1 = new KeyBind('Digit1', this._bindings);
    this.digit2 = new KeyBind('Digit2', this._bindings);
    this.digit3 = new KeyBind('Digit3', this._bindings);
    this.digit4 = new KeyBind('Digit4', this._bindings);
    this.digit5 = new KeyBind('Digit5', this._bindings);
    this.digit6 = new KeyBind('Digit6', this._bindings);
    this.digit7 = new KeyBind('Digit7', this._bindings);
    this.digit8 = new KeyBind('Digit8', this._bindings);
    this.digit9 = new KeyBind('Digit9', this._bindings);
    this.digit0 = new KeyBind('Digit0', this._bindings);

    window.addEventListener("keydown", this.keydown.bind(this),);
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

  private keydown(e: KeyboardEvent): void {
    this._bindings[e.code]?.keydown(e);
  }

  private keyup(e: KeyboardEvent): void {
    this._bindings[e.code]?.keyup(e);
  }
}