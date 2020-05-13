import {AnimationClip} from "./AnimationClip";
import {AnimationEventClip} from "./AnimationEventClip";
import {AnimationKeyFrameClip} from "./AnimationKeyFrameClip";
import {AnimationCurveClip} from "./AnimationCurveClip";
import {Curve} from "../curves";

export interface AnimationEventFrame<Args extends any[]> {
  readonly time: number;
  readonly args: Args;
}

export class Animation {
  private readonly _clips: AnimationClip[] = [];
  private _playing: boolean = false;

  get isPlaying(): boolean {
    return this._playing;
  }

  add(clip: AnimationClip): void {
    this._clips.push(clip);
  }

  addEventClip<Args extends any[]>(
    animationSpeed: number,
    method: (...args: Args) => void,
    context?: any
  ): AnimationEventClip<Args> {
    const clip = new AnimationEventClip<Args>(animationSpeed, method, context);
    this.add(clip);
    return clip;
  }

  addKeyFrameClip<Args extends number[]>(
    animationSpeed: number,
    method: (...args: Args) => void,
    context?: any
  ): AnimationKeyFrameClip<any> {
    const clip = new AnimationKeyFrameClip<Args>(animationSpeed, method, context);
    this.add(clip);
    return clip;
  }

  addCurveClip<Args extends number[]>(
    curve: Curve<Args>,
    duration: number,
    animationSpeed: number,
    method: (...args: any[]) => void,
    context?: any
  ): AnimationCurveClip<Args> {
    const clip = new AnimationCurveClip<Args>(curve, duration, animationSpeed, method, context);
    this.add(clip);
    return clip;
  }

  clear(): void {
    this.stop();
    this._clips.splice(0, this._clips.length);
  }

  start(): void {
    this._playing = true;
    for (const clip of this._clips) {
      clip.start();
    }
  }

  stop(): void {
    this._playing = false;
    for (const clip of this._clips) {
      clip.stop();
    }
  }

  update(deltaTime: number): void {
    let hasPlaying = false;
    for (const clip of this._clips) {
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