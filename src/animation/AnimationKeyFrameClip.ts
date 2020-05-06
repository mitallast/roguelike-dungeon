import {AnimationClip} from "./AnimationClip";
import {AnimationEvent} from "./AnimationEvent";

export class AnimationKeyFrameClip<Args extends number[]> extends AnimationClip {
  private readonly _method: (...args: Args) => void;
  private readonly _context: any;
  private readonly _frames: AnimationEvent<Args>[] = [];

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
    let start: AnimationEvent<Args> | null = null;
    let end: AnimationEvent<Args> | null = null;
    for (let i = 0; i < this._frames.length; i++) {
      const frame = this._frames[i];
      if (frame.time <= this._time) {
        start = frame;
      } else {
        end = frame;
        break;
      }
    }
    if (start !== null && end !== null) {
      // linear interpolation
      const args = [] as number[] as Args;
      const total = end.time - start.time;
      const duration = this._time - start.time;
      const base = duration / total;
      // console.log(`linear int time=${this._time} start=${start.time} end=${end.time} total=${total} duration=${duration} base=${base}`);
      for (let i = 0; i < start.args.length; i++) {
        args[i] = start.args[i] * (1 - base) + end.args[i] * base;
        // if (i === 0) console.log(`linear int. args=${start.args[i]} * (1 - ${base}) + ${end.args[i]} * ${base} = ${args[i]}`);
      }
      this._method.call(this._context, ...args);
    } else if (start !== null) {
      this._method.call(this._context, ...start.args);
      this._playing = false;
    } else if (end !== null) {
      this._method.call(this._context, ...end.args);
    }
  }

  addEvent(event: AnimationEvent<Args>): AnimationKeyFrameClip<Args> {
    this._frames.push(event);
    this._frames.sort(this.compare);
    return this;
  }

  addEvents(event: AnimationEvent<Args>[]): AnimationKeyFrameClip<Args> {
    this._frames.push(...event);
    this._frames.sort(this.compare);
    return this;
  }

  add(time: number, ...args: Args): AnimationKeyFrameClip<Args> {
    this.addEvent({time, args});
    return this;
  }

  private compare(a: AnimationEvent<Args>, b: AnimationEvent<Args>): number {
    return a.time - b.time;
  }
}