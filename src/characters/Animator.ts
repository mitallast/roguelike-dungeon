import {Animation} from "../animation";
import {WeaponAnimation} from "../weapon";
import {CharacterView} from "./CharacterView";
import {Character} from "./Character";

export class Animator {
  private readonly _view: CharacterView;
  readonly animation: Animation

  constructor(view: CharacterView) {
    this._view = view;
    this.animation = new Animation();
  }

  animateCharacter(animationSpeed: number, animation: string, totalFrames: number): void {
    this.animation.addEventClip(animationSpeed, this._view.setAnimation, this._view).add(0, animation);
    const frames = this.animation.addEventClip(animationSpeed, this._view.setFrame, this._view);
    for (let i = 0; i < totalFrames; i++) {
      frames.add(i, i);
    }
    frames.add(totalFrames, 0);
  }

  animateMove(animationSpeed: number, controller: Character): void {
    this.animation.addKeyFrameClip(animationSpeed, this._view.setPosition, this._view)
      .add(0, controller.x, controller.y)
      .add(4, controller.newX, controller.newY);
  }

  animateWeapon(animationSpeed: number, animation: WeaponAnimation): void {
    const weapon = this._view.weapon;
    this.animation.addKeyFrameClip(animationSpeed, weapon.setAngle, weapon).addEvents(animation.angle);
    if (animation.smoothly) {
      this.animation.addKeyFrameClip(animationSpeed, weapon.setPosition, weapon).addEvents(animation.pos);
    } else {
      this.animation.addEventClip(animationSpeed, weapon.setPosition, weapon).addEvents(animation.pos);
    }
  }

  get isPlaying(): boolean {
    return this.animation.isPlaying;
  }

  start(): void {
    this.animation.start();
  }

  update(deltaTime: number): void {
    this.animation.update(deltaTime);
  }

  stop(): void {
    this.animation.stop();
  }

  clear(): void {
    this.animation.clear();
  }
}