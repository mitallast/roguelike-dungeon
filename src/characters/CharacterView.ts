import * as PIXI from "pixi.js";
import {Resources} from "../resources";
import {DungeonZIndexes} from "../dungeon";
import {WeaponView, DefaultWeaponView} from "../weapon";

const TILE_SIZE = 16;

export class CharacterView {
  private readonly _resources: Resources;

  private readonly _baseZIndex: number;
  private readonly _gridWidth: number;
  private _isLeft: boolean = false;

  private readonly _container: PIXI.Container;
  private readonly _weapon: DefaultWeaponView;
  private readonly _sprite: PIXI.AnimatedSprite;

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

  get weapon(): WeaponView {
    return this._weapon;
  }

  constructor(
    parent: PIXI.Container,
    resources: Resources,
    animation: string,
    zIndex: number,
    gridWidth: number,
    onPosition?: (x: number, y: number) => void
  ) {
    this._resources = resources;
    this._baseZIndex = zIndex;
    this._gridWidth = gridWidth;
    this._onPosition = onPosition || null;

    this._sprite = new PIXI.AnimatedSprite(resources.animation(animation), false);
    this._sprite.zIndex = 2;
    this._sprite.loop = false;
    this._sprite.position.set(0, TILE_SIZE - 2);
    this._sprite.anchor.set(0, 1);
    if (this._sprite.width > this._gridWidth * TILE_SIZE) {
      this._sprite.position.x -= (this._sprite.width - this._gridWidth * TILE_SIZE) / 2;
    }

    this._weapon = new DefaultWeaponView(this._resources);
    this._weapon.zIndex = 1;
    this._weapon.position.set(TILE_SIZE * this._gridWidth, TILE_SIZE - 4);

    this._container = new PIXI.Container();
    this._container.addChild(this._weapon, this._sprite);
    parent.addChild(this._container);
  }

  destroy(): void {
    this._container.destroy();
    this._weapon.destroy();
    this._sprite.destroy();
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

  setAnimation(animation: string): void {
    this._sprite.textures = this._resources.animation(animation);
    this._sprite.gotoAndStop(0);
  }

  setFrame(frame: number): void {
    this._sprite.gotoAndStop(frame);
  }

  private updatePosition(): void {
    // process left/right direction
    this._container.scale.set(this._isLeft ? -1 : 1, 1);
    // if left, add offset x
    this._container.position.set(this._x + (this._isLeft ? this._gridWidth * TILE_SIZE : 0), this._y);
  }
}