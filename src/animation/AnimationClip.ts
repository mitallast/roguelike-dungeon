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