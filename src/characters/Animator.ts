import {Animation} from "../animation";
import {CharacterView} from "./CharacterView";
import {WeaponAnimation} from "../drop";

export class Animator {
  private readonly _view: CharacterView;
  private readonly _animation: Animation

  constructor(view: CharacterView) {
    this._view = view;
    this._animation = new Animation();
  }

  animateCharacter(animationSpeed: number, spriteName: string, totalFrames: number): void {
    this._animation.addEventClip(animationSpeed, this._view.setSprite, this._view).add(0, spriteName);
    const frames = this._animation.addEventClip(animationSpeed, this._view.setFrame, this._view);
    for (let i = 0; i < totalFrames; i++) frames.add(i, i);
  }

  animateMove(animationSpeed: number, startX: number, startY: number, finishX: number, finishY: number): void {
    this._animation.addKeyFrameClip(animationSpeed, this._view.setPosition, this._view)
      .add(0, startX, startY)
      .add(3, finishX, finishY);
  }

  animateWeapon(animationSpeed: number, animation: WeaponAnimation): void {
    const weapon = this._view.weapon;
    this._animation.addEventClip(animationSpeed, weapon.setPosition, weapon).addEvents(animation.pos);
    this._animation.addKeyFrameClip(animationSpeed, weapon.setAngle, weapon).addFrames(animation.angle);
  }

  get isPlaying(): boolean {
    return this._animation.isPlaying;
  }

  start(): void {
    this._animation.start();
  }

  update(deltaTime: number): void {
    this._animation.update(deltaTime);
  }

  stop(): void {
    this._animation.stop();
  }

  clear(): void {
    this._animation.clear();
  }
}