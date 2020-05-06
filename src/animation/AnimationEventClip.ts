import {AnimationClip} from "./AnimationClip";
import {AnimationEvent} from "./AnimationEvent";

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
      const next = this._event === null ? 0 : this._event + 1;
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

  addEvent(event: AnimationEvent<Args>): AnimationEventClip<Args> {
    this._events.push(event);
    this._events.sort(this.compare);
    return this;
  }

  addEvents(event: AnimationEvent<Args>[]): AnimationEventClip<Args> {
    this._events.push(...event);
    this._events.sort(this.compare);
    return this;
  }

  add(time: number, ...args: Args): AnimationEventClip<Args> {
    this.addEvent({time, args});
    return this;
  }

  private compare(a: AnimationEvent<Args>, b: AnimationEvent<Args>): number {
    return a.time - b.time;
  }
}