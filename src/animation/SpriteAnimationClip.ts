import {AnimationClip} from "./AnimationClip";
import * as PIXI from "pixi.js";

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