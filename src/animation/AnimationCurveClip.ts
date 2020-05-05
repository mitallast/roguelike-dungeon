import {AnimationClip} from "./AnimationClip";
import {Curve} from "../curves";

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
    const t = this._time / this._duration;
    if (t >= 1) {
      this._playing = false;
      this._method.call(this._context, ...this._curve(1));
    } else {
      this._method.call(this._context, ...this._curve(t));
    }
  }
}