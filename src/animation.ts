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
  readonly animationSpeed: number;
  abstract readonly duration: number;
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

  get duration(): number {
    return this._sprite.totalFrames;
  }

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
  private readonly _curve: Curve<Args>;
  private readonly _method: (...args: any[]) => void;
  private readonly _context: any;

  get duration(): number {
    return this._duration;
  }

  constructor(
    curve: Curve<Args>,
    duration: number,
    animationSpeed: number,
    method: (...args: any[]) => void,
    context?: any
  ) {
    super(animationSpeed);
    this._curve = curve;
    this._duration = duration;
    this._method = method;
    this._context = context;
  }

  protected play(): void {
    let t = this._time / this._duration;
    if (t >= 1) {
      this._playing = false;
      this._method.call(this._context, ...this._curve(1));
    } else {
      this._method.call(this._context, ...this._curve(t));
    }
  }
}

export class AnimationKeyFrameClip<Args extends number[]> extends AnimationClip {
  private readonly _method: (...args: Args) => void;
  private readonly _context: any;
  private readonly _frames: AnimationKeyFrame<Args>[] = [];

  get duration(): number {
    if (this._frames.length > 0) {
      return this._frames[this._frames.length - 1].time;
    } else {
      return 0;
    }
  }

  constructor(animationSpeed: number, method: (...args: Args) => void, context?: any) {
    super(animationSpeed);
    this._method = method;
    this._context = context;
  }

  protected play(): void {
    let start: AnimationKeyFrame<Args> | null = null;
    let end: AnimationKeyFrame<Args> | null = null;
    for (let i = 0; i < this._frames.length; i++) {
      let frame = this._frames[i];
      if (frame.time <= this._time) {
        start = frame;
      } else {
        end = frame;
        break;
      }
    }
    if (start !== null && end !== null) {
      // linear interpolation
      let args = [] as number[] as Args;
      for (let i = 0; i < start.args.length; i++) {
        args[i] = start.args[i] * (end.time - this._time) + end.args[i] * (this._time - start.time);
      }
      this._method.call(this._context, ...args);
    } else if (start !== null) {
      this._method.call(this._context, ...start.args);
      this._playing = false;
    } else if (end !== null) {
      this._method.call(this._context, ...end.args);
    }
  }

  addFrame(event: AnimationKeyFrame<Args>): void {
    this._frames.push(event);
    this._frames.sort(this.compare);
  }

  addFrames(event: AnimationKeyFrame<Args>[]): void {
    this._frames.push(...event);
    this._frames.sort(this.compare);
  }

  add(time: number, ...args: Args): void {
    this.addFrame({time, args});
  }

  private compare(a: AnimationKeyFrame<Args>, b: AnimationKeyFrame<Args>): number {
    return a.time - b.time;
  }
}

export interface AnimationKeyFrame<Args extends number[]> {
  readonly time: number;
  readonly args: Args;
}

export class AnimationEventClip<Args extends any[]> extends AnimationClip {
  private readonly _method: (...args: Args) => void;
  private readonly _context: any;
  private readonly _events: AnimationEvent<Args>[] = [];
  private _event: number | null = null;

  get duration(): number {
    if (this._events.length > 0) {
      return this._events[this._events.length - 1].time;
    } else {
      return 0;
    }
  }

  constructor(animationSpeed: number, method: (...args: Args) => void, context?: any) {
    super(animationSpeed);
    this._method = method;
    this._context = context;
  }

  protected play(): void {
    while (this._playing) {
      let next = this._event === null ? 0 : this._event + 1;
      if (next < this._events.length) {
        if (this._events[next].time <= this._time) {
          this._event = next;
          this._method.call(this._context, ...this._events[next].args);
        } else {
          break;
        }
      } else {
        this._playing = false;
      }
    }
  }

  addEvent(event: AnimationEvent<Args>): void {
    this._events.push(event);
    this._events.sort(this.compare);
  }

  addEvents(event: AnimationEvent<Args>[]): void {
    this._events.push(...event);
    this._events.sort(this.compare);
  }

  add(time: number, ...args: Args): void {
    this.addEvent({time, args});
  }

  private compare(a: AnimationEvent<Args>, b: AnimationEvent<Args>): number {
    return a.time - b.time;
  }
}

export interface AnimationEvent<Args extends any[]> {
  readonly time: number;
  readonly args: Args;
}