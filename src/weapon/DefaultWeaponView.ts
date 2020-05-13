import * as PIXI from "pixi.js";
import {Resources} from "../resources";
import {Weapon} from "./Weapon";
import {WeaponView} from "./WeaponView";

export class DefaultWeaponView extends PIXI.Container implements WeaponView {
  private readonly _resources: Resources;
  private _sprite: PIXI.Sprite | null = null;

  constructor(resources: Resources) {
    super();
    this._resources = resources;
  }

  destroy(): void {
    this._sprite?.destroy();
    this._sprite = null;
    super.destroy();
  }

  setWeapon(weapon: Weapon | null): void {
    this._sprite?.destroy();
    this._sprite = null;
    if (weapon) {
      this._sprite = this._resources.spriteOrAnimation(weapon.spriteName);
      this._sprite.anchor.set(0.5, 1);
      this.addChild(this._sprite);
    }
  }

  setAngle(angle: number): void {
    if (this._sprite) {
      this._sprite.angle = angle;
    }
  }

  setPosition(x: number, y: number): void {
    if (this._sprite) {
      this._sprite.position.set(x, y);
    }
  }
}