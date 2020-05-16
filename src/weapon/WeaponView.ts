import * as PIXI from "pixi.js";
import {Weapon} from "./Weapon";
import {Resources} from "../resources";

export class WeaponView extends PIXI.Container implements WeaponView {
  private readonly _resources: Resources;
  private _sprite: PIXI.Sprite | null = null;

  private readonly _trail: PIXI.SimpleRope;
  private readonly _trailPoints: PIXI.Point[];

  constructor(resources: Resources) {
    super();
    this._resources = resources;
    this._trailPoints = [];
    for (let i = 0; i < 64; i++) {
      this._trailPoints.push(new PIXI.Point(i, 0));
    }
    const texture = this._resources.texture('w_slash_regular_sword.png');
    this._trail = new PIXI.SimpleRope(texture, this._trailPoints);
    this._trail.zIndex = 1;
    this._trail.visible = false;
    this._trail.alpha = 0.5;
    this.addChild(this._trail)
  }

  destroy(): void {
    super.destroy();
  }

  setWeapon(weapon: Weapon | null): void {
    this._sprite?.destroy();
    this._sprite = null;
    if (weapon) {
      this._sprite = this._resources.spriteOrAnimation(weapon.spriteName);
      this._sprite.anchor.set(0.5, 1);
      this._sprite.zIndex = 2;
      this._trail.texture = this._resources.texture(weapon.slashTexture);
      this.addChild(this._sprite);
      this.sortChildren();
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
      this._trail.position.set(x, y);
    }
  }

  setTrail(start: number, end: number): void {
    if (start > end) {
      [end, start] = [start, end];
    }
    if ((end - start) < 15) {
      this._trail.visible = false;
      return;
    }
    this._trail.visible = true;

    const points = this._trailPoints;
    const radius = this._trail.texture.height / 2;
    const delta = (end - start) / (points.length - 1);
    for (let i = 0, angle = start; i < points.length; i++, angle += delta) {
      const x = radius * Math.sin(Math.PI * 2 * (180 - angle) / 360);
      const y = radius * Math.cos(Math.PI * 2 * (180 - angle) / 360);
      points[i].set(x, y);
    }
  }
}