import {AnimationClip} from "./AnimationClip";

export class Animation {
  private readonly _clips: AnimationClip[] = [];
  private _playing: boolean = false;

  get isPlaying(): boolean {
    return this._playing;
  }

  add(clip: AnimationClip): void {
    this._clips.push(clip);
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