import * as PIXI from "pixi.js";
import {AnimationClip, SpriteAnimationClip} from "../animation";
import {Resources} from "../resources";
import {DungeonMap, DungeonZIndexes} from "../dungeon.map";
import {Weapon} from "../drop";

const TILE_SIZE = 16;

export interface CharacterViewOptions {
  readonly width: number;
  readonly height: number;
  readonly x: number;
  readonly y: number;
  readonly zIndex: number;
  readonly onPosition?: (x: number, y: number) => void;
}

export interface CharacterView {
  readonly point: PIXI.IPoint;
  isLeft: boolean;

  readonly weapon: WeaponView;

  setPosition(x: number, y: number): void;
  animation(spriteName: string, speed: number): AnimationClip;
  destroy(): void;
}

export class DefaultCharacterView extends PIXI.Container implements CharacterView {
  private readonly _resources: Resources;

  private readonly _baseZIndex: number;
  private readonly _gridWidth: number;
  private _isLeft: boolean = false;
  private _sprite: PIXI.AnimatedSprite | null = null;
  private readonly _weapon: DefaultWeaponView;

  readonly point: PIXI.IPoint = new PIXI.Point(0, 0);
  private readonly _onPosition: ((x: number, y: number) => void) | null;

  get isLeft(): boolean {
    return this._isLeft;
  }

  set isLeft(isLeft: boolean) {
    this._isLeft = isLeft;
    this.updatePosition();
  }

  get weapon(): WeaponView {
    return this._weapon;
  }

  constructor(dungeon: DungeonMap, zIndex: number, gridWidth: number, onPosition?: (x: number, y: number) => void) {
    super();
    this._resources = dungeon.controller.resources;
    this._baseZIndex = zIndex;
    this._gridWidth = gridWidth;
    this._onPosition = onPosition || null;
    this._weapon = new DefaultWeaponView(this._resources);
    this._weapon.zIndex = 2;
    this._weapon.position.set(TILE_SIZE * this._gridWidth, TILE_SIZE - 4);
    this.addChild(this._weapon);
    dungeon.container.addChild(this);
  }

  setPosition(x: number, y: number): void {
    // pixel perfect
    const tx = Math.round(x * TILE_SIZE * 2) / 2;
    const ty = Math.round(y * TILE_SIZE * 2) / 2;
    this.point.set(tx, ty);
    this.updatePosition();
    this.zIndex = this._baseZIndex + Math.floor(y) * DungeonZIndexes.row;
    if (this._onPosition) {
      this._onPosition(tx, ty);
    }
  }

  private updatePosition(): void {
    // process left/right direction
    this.scale.set(this._isLeft ? -1 : 1, 1);
    // if left, add offset x
    this.position.set(this.point.x + (this._isLeft ? this._gridWidth * TILE_SIZE : 0), this.point.y);
  }

  animation(spriteName: string, speed: number): AnimationClip {
    this._sprite?.destroy();
    this._sprite = this._resources.animated(spriteName, {
      autoUpdate: false,
      loop: false,
      animationSpeed: speed,
    });
    this._sprite.anchor.set(0, 1);
    this._sprite.position.y = TILE_SIZE - 2;
    this._sprite.position.x = 0;
    if (this._sprite.width > this._gridWidth * TILE_SIZE) {
      this._sprite.position.x -= (this._sprite.width - this._gridWidth * TILE_SIZE) / 2;
    }
    this._sprite.zIndex = 1;
    this.addChild(this._sprite);
    return new SpriteAnimationClip(this._sprite);
  }
}

export interface WeaponView {
  setWeapon(weapon: Weapon | null): void;
  setPosition(x: number, y: number): void;
  setAngle(angle: number): void;
  destroy(): void;
}

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
      this._sprite = this._resources.sprite(weapon.spriteName);
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