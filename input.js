export class KeyBind {
  constructor(code) {
    this.code = code;
    this.state = 'await';
    this.triggered = false;
    this.processed = true;
  }

  keydown(e) {
    if(e.code === this.code) {
      e.preventDefault();
      if (this.state === 'await') {
        this.triggered = true;
        this.processed = false;
        this.state = 'pressed';
      }
    }
  }

  keyup(e) {
    if(e.code === this.code) {
      e.preventDefault();
      if (this.state === "pressed") {
        this.triggered = false;
        this.state = 'await';
      }
    }
  }
}

export class Joystick {
  constructor() {
    this.moveUp = new KeyBind('KeyW');
    this.moveLeft = new KeyBind('KeyA');
    this.moveDown = new KeyBind('KeyS');
    this.moveRight = new KeyBind('KeyD');
    this.hit = new KeyBind('KeyF');

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

  init() {
    window.addEventListener("keydown", this.keydown.bind(this));
    window.addEventListener("keyup", this.keyup.bind(this));
  };

  keydown(e) {
    this.moveUp.keydown(e);
    this.moveLeft.keydown(e);
    this.moveDown.keydown(e);
    this.moveRight.keydown(e);
    this.hit.keydown(e);
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
  keyup(e) {
    this.moveUp.keyup(e);
    this.moveLeft.keyup(e);
    this.moveDown.keyup(e);
    this.moveRight.keyup(e);
    this.hit.keyup(e);
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