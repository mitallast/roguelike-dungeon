enum KeyBindState {Await = 1, Pressed = 2, Reset = 3}

export class KeyBind {
  private readonly code: string;
  private state: KeyBindState;
  triggered: boolean;
  processed: boolean;

  constructor(code: string) {
    this.code = code;
    this.state = KeyBindState.Await;
    this.triggered = false;
    this.processed = true;
  }

  keydown(e: KeyboardEvent) {
    if (e.code === this.code) {
      e.preventDefault();
      if (this.state === KeyBindState.Await) {
        this.triggered = true;
        this.processed = false;
        this.state = KeyBindState.Pressed;
      }
    }
  }

  keyup(e: KeyboardEvent) {
    if (e.code === this.code) {
      e.preventDefault();
      if (this.state === KeyBindState.Pressed || this.state === KeyBindState.Reset) {
        this.triggered = false;
        this.state = KeyBindState.Await;
      }
    }
  }

  reset() {
    this.state = KeyBindState.Reset;
    this.triggered = false;
    this.processed = true;
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

  constructor() {
    this.moveUp = new KeyBind('KeyW');
    this.moveLeft = new KeyBind('KeyA');
    this.moveDown = new KeyBind('KeyS');
    this.moveRight = new KeyBind('KeyD');
    this.hit = new KeyBind('KeyF');
    this.drop = new KeyBind('KeyQ');

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
    this.init();
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

  init() {
    window.addEventListener("keydown", this.keydown.bind(this));
    window.addEventListener("keyup", this.keyup.bind(this));
  };

  keydown(e: KeyboardEvent) {
    this.moveUp.keydown(e);
    this.moveLeft.keydown(e);
    this.moveDown.keydown(e);
    this.moveRight.keydown(e);
    this.hit.keydown(e);
    this.drop.keydown(e);
    this.digit1.keydown(e);
    this.digit2.keydown(e);
    this.digit3.keydown(e);
    this.digit4.keydown(e);
    this.digit5.keydown(e);
    this.digit6.keydown(e);
    this.digit7.keydown(e);
    this.digit8.keydown(e);
    this.digit9.keydown(e);
    this.digit0.keydown(e);
  };

  keyup(e: KeyboardEvent) {
    this.moveUp.keyup(e);
    this.moveLeft.keyup(e);
    this.moveDown.keyup(e);
    this.moveRight.keyup(e);
    this.hit.keyup(e);
    this.drop.keyup(e);
    this.digit1.keyup(e);
    this.digit2.keyup(e);
    this.digit3.keyup(e);
    this.digit4.keyup(e);
    this.digit5.keyup(e);
    this.digit6.keyup(e);
    this.digit7.keyup(e);
    this.digit8.keyup(e);
    this.digit9.keyup(e);
    this.digit0.keyup(e);
  };
}