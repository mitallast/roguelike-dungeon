import * as PIXI from "pixi.js";
import {Resources} from "../resources";
import {DungeonZIndexes} from "../dungeon";
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

export class CharacterView {
  private readonly _resources: Resources;

  private readonly _baseZIndex: number;
  private readonly _gridWidth: number;
  private _isLeft: boolean = false;

  private readonly _container: PIXI.Container;
  private readonly _weapon: DefaultWeaponView;
  private _sprite: PIXI.AnimatedSprite | null = null;

  private _x: number = 0;
  private _y: number = 0;
  private readonly _onPosition: ((x: number, y: number) => void) | null;

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get isLeft(): boolean {
    return this._isLeft;
  }

  set isLeft(isLeft: boolean) {
    this._isLeft = isLeft;
    this.updatePosition();
  }

  set sprite(spriteName: string) {
    this._sprite?.destroy();
    this._sprite = this._resources.animated(spriteName, {
      autoUpdate: false,
      loop: false,
    });
    this._sprite.anchor.set(0, 1);
    this._sprite.position.y = TILE_SIZE - 2;
    this._sprite.position.x = 0;
    if (this._sprite.width > this._gridWidth * TILE_SIZE) {
      this._sprite.position.x -= (this._sprite.width - this._gridWidth * TILE_SIZE) / 2;
    }
    this._sprite.zIndex = 1;
    this._container.addChild(this._sprite);
  }

  get weapon(): WeaponView {
    return this._weapon;
  }

  constructor(parent: PIXI.Container,
              resources: Resources,
              zIndex: number,
              gridWidth: number,
              onPosition?: (x: number, y: number) => void) {
    this._resources = resources;
    this._baseZIndex = zIndex;
    this._gridWidth = gridWidth;
    this._onPosition = onPosition || null;
    this._weapon = new DefaultWeaponView(this._resources);
    this._weapon.zIndex = 2;
    this._weapon.position.set(TILE_SIZE * this._gridWidth, TILE_SIZE - 4);
    this._container = new PIXI.Container();
    this._container.addChild(this._weapon);
    parent.addChild(this._container);
  }

  destroy(): void {
    this._container.destroy({children: true});
  }

  setPosition(x: number, y: number): void {
    // pixel perfect
    this._x = Math.round(x * TILE_SIZE * 2) / 2;
    this._y = Math.round(y * TILE_SIZE * 2) / 2;
    this.updatePosition();
    this._container.zIndex = this._baseZIndex + Math.floor(y) * DungeonZIndexes.row;
    if (this._onPosition) {
      this._onPosition(this._x, this._y);
    }
  }

  setSprite(spriteName: string): void {
    this._sprite?.destroy();
    this._sprite = this._resources.animated(spriteName, {
      autoUpdate: false,
      loop: false,
    });
    this._sprite.anchor.set(0, 1);
    this._sprite.position.y = TILE_SIZE - 2;
    this._sprite.position.x = 0;
    if (this._sprite.width > this._gridWidth * TILE_SIZE) {
      this._sprite.position.x -= (this._sprite.width - this._gridWidth * TILE_SIZE) / 2;
    }
    this._sprite.zIndex = 1;
    this._container.addChild(this._sprite);
  }

  setFrame(frame: number): void {
    if (this._sprite) {
      this._sprite.gotoAndStop(frame);
    }
  }

  private updatePosition(): void {
    // process left/right direction
    this._container.scale.set(this._isLeft ? -1 : 1, 1);
    // if left, add offset x
    this._container.position.set(this._x + (this._isLeft ? this._gridWidth * TILE_SIZE : 0), this._y);
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