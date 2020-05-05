import {Animation, AnimationCurveClip, AnimationEventClip, AnimationKeyFrameClip} from "../animation";
import {WeaponAnimation} from "../drop";
import {LinearCurve} from "../curves";
import {CharacterAI} from "./Character";
import {CharacterView} from "./CharacterView";

export interface AnimationController {
  readonly isPlaying: boolean;
  start(): void;
  update(deltaTime: number): void;
  cancel(): void;
  finish(): void;
}

export abstract class BaseAnimationController implements AnimationController {
  protected readonly ai: CharacterAI;
  protected readonly view: CharacterView;
  protected readonly spriteName: string;

  protected readonly animation: Animation

  protected constructor(ai: CharacterAI, spriteName: string) {
    this.ai = ai;
    this.view = ai.view;
    this.spriteName = spriteName;
    this.animation = new Animation();
  }

  get isPlaying(): boolean {
    return this.animation.isPlaying;
  }

  abstract start(): void;

  protected animateWeapon(animation: WeaponAnimation, animationSpeed: number): void {
    const positionClip = new AnimationEventClip(animationSpeed, this.view.weapon.setPosition, this.view.weapon);
    positionClip.addEvents(animation.pos);
    this.animation.add(positionClip);

    const angleClip = new AnimationKeyFrameClip<[number]>(animationSpeed, this.view.weapon.setAngle, this.view.weapon);
    angleClip.addFrames(animation.angle);
    this.animation.add(angleClip);
  }

  update(deltaTime: number): void {
    this.animation.update(deltaTime);
    if (!this.animation.isPlaying) {
      this.finish();
    }
  }

  cancel(): void {
    this.animation.stop();
  }

  finish(): void {
    this.animation.stop();
  }
}

export class IdleAnimationController extends BaseAnimationController {
  constructor(ai: CharacterAI) {
    super(ai, ai.character.name + '_idle');
  }

  start(): void {
    const clip = this.view.animation(this.spriteName, this.ai.character.speed * 0.2);
    this.animation.add(clip);
    const weapon = this.ai.character.weapon;
    if (weapon) {
      this.animateWeapon(weapon.animations.idle, clip.animationSpeed);
    }
    this.animation.start();
  }
}

export class RunAnimationController extends BaseAnimationController {
  private readonly _x: number;
  private readonly _y: number;
  private readonly _newX: number;
  private readonly _newY: number;

  constructor(ai: CharacterAI, newX: number, newY: number) {
    super(ai, ai.character.name + '_run');
    this._x = this.ai.x;
    this._y = this.ai.y;
    this._newX = newX;
    this._newY = newY;
  }

  start(): void {
    const clip = this.view.animation(this.spriteName, this.ai.character.speed * 0.2);
    this.ai.dungeon.set(this._newX, this._newY, this.ai);
    this.animation.clear();
    this.animation.add(clip);
    this.animation.add(new AnimationCurveClip(
      LinearCurve.matrix(
        [this._x, this._y],
        [this._newX, this._newY],
      ),
      clip.duration,
      clip.animationSpeed,
      this.view.setPosition,
      this.view
    ));

    const weapon = this.ai.character.weapon;
    if (weapon) {
      this.animateWeapon(weapon.animations.run, clip.animationSpeed);
    }
    this.animation.start();
  }

  cancel(): void {
    super.cancel();
    this.ai.dungeon.remove(this._x, this._y, this.ai);
    this.ai.dungeon.remove(this._newX, this._newY, this.ai);
    this.ai.setPosition(this.ai.x, this.ai.y);
  }

  finish(): void {
    super.finish();
    this.ai.dungeon.remove(this._x, this._y, this.ai);
    this.ai.dungeon.remove(this._newX, this._newY, this.ai);
    this.ai.setPosition(this._newX, this._newY);
  }
}

export class HitAnimationController extends BaseAnimationController {
  constructor(ai: CharacterAI) {
    super(ai, ai.character.name + '_idle');
  }

  start(): void {
    const weapon = this.ai.character.weapon;
    const clip = this.view.animation(this.spriteName, (weapon ? weapon.speed : this.ai.character.speed) * 0.2);
    this.animation.clear();
    this.animation.add(clip);

    if (weapon) {
      this.animateWeapon(weapon.animations.hit, clip.animationSpeed);
    }
    this.animation.start();
  }

  update(deltaTime: number): void {
    this.animation.update(deltaTime);
    if (!this.animation.isPlaying) {
      this.finish();
    }
  }

  cancel(): void {
    this.animation.stop();
  }

  finish(): void {
    this.animation.stop();
  }
}