import {Curve} from "./curves";

export class Animation {
  private readonly clips: AnimationClip[] = [];
  private _playing: boolean = false;

  get isPlaying(): boolean {
    return this._playing;
  }

  add(clip: AnimationClip): void {
    this.clips.push(clip);
  }

  clear(): void {
    this.stop();
    this.clips.splice(0, this.clips.length);
  }

  start(): void {
    this._playing = true;
    for (let clip of this.clips) {
      clip.start();
    }
  }

  stop(): void {
    this._playing = false;
    for (let clip of this.clips) {
      clip.stop();
    }
  }

  update(deltaTime: number): void {
    let hasPlaying = false;
    for (let clip of this.clips) {
      clip.update(deltaTime);
      if (clip.isPlaying) {
        hasPlaying = true;
      }
    }
    if (!hasPlaying) {
      this.stop();
    }
  }
}

export abstract class AnimationClip {
  protected readonly animationSpeed: number;
  protected _time: number = 0;
  protected _playing: boolean = false;

  get isPlaying(): boolean {
    return this._playing;
  }

  protected constructor(animationSpeed: number) {
    this.animationSpeed = animationSpeed;
  }

  start(): void {
    this._time = 0;
    this._playing = true;
    this.play();
  }

  stop(): void {
    this._playing = false;
  }

  update(deltaTime: number): void {
    this._time += this.animationSpeed * deltaTime;
    if (this._playing) {
      this.play();
    }
  }

  protected abstract play(): void;
}

export class SpriteAnimationClip extends AnimationClip {
  private readonly _sprite: PIXI.AnimatedSprite;

  constructor(sprite: PIXI.AnimatedSprite) {
    super(sprite.animationSpeed);
    this._sprite = sprite;
  }

  protected play(): void {
    const sprite = this._sprite;
    let currentFrame = Math.floor(this._time) % sprite.totalFrames;
    if (currentFrame < 0) {
      currentFrame += sprite.totalFrames;
    }

    const previousFrame = sprite.currentFrame;
    if (this._time < 0) {
      this.stop();
    } else if (this._time >= sprite.totalFrames) {
      this.stop();
    } else if (previousFrame !== currentFrame) {
      sprite.gotoAndStop(currentFrame);
    }
  }
}

export class AnimationCurveClip<Args extends number[]> extends AnimationClip {
  private readonly _duration: number;
  private readonly _start: Args;
  private readonly _finish: Args;
  private readonly _curve: Curve<Args>;
  private readonly _method: (...args: any[]) => void;
  private readonly _context: any;

  constructor(
    start: Args,
    finish: Args,
    curve: Curve<Args>,
    duration: number,
    animationSpeed: number,
    method: (...args: any[]) => void,
    context: any
  ) {
    super(animationSpeed);
    this._start = start;
    this._finish = finish;
    this._curve = curve;
    this._duration = duration;
    this._method = method;
    this._context = context;
  }

  protected play(): void {
    let t = this._time / this._duration;
    if (t === 0) {
      this._method.call(this._context, ...this._start);
    } else if (t >= 1) {
      t = 1;
      this._playing = false;
      this._method.call(this._context, ...this._finish);
    } else {
      const delta = this._curve(t);
      const args = [] as number[] as Args;
      for (let i = 0; i < delta.length; i++) {
        args[i] = this._start[i] + (this._finish[i] - this._start[i]) * delta[i];
      }
      this._method.call(this._context, ...args);
    }
  }
}

export class AnimationEventClip<Args extends []> extends AnimationClip {
  private readonly _method: (...args: Args) => void;
  private readonly _context: any;
  private readonly _events: AnimationEvent<Args>[] = [];
  private _event: number | null = null;

  constructor(animationSpeed: number, method: (...args: Args) => void, context: any) {
    super(animationSpeed);
    this._method = method;
    this._context = context;
  }

  protected play(): void {
    while (this._playing) {
      let next = this._event === null ? 0 : this._event + 1;
      if (next <= this._events.length) {
        if (this._events[next].time <= this._time) {
          this._event = next;
          this._method.call(this._context, ...this._events[next].args);
        } else {
          this._playing = true;
        }
      } else {
        this._playing = false;
      }
    }
  }

  add(time: number, ...args: Args): void {
    this._events.push(new AnimationEvent(time, args));
    this._events.sort(this.compare);
  }

  private compare(a: AnimationEvent<Args>, b: AnimationEvent<Args>): number {
    return a.time - b.time;
  }
}

export class AnimationEvent<Args extends []> {
  readonly time: number;
  readonly args: Args;

  constructor(time: number, args: Args) {
    this.time = time;
    this.args = args;
  }
}