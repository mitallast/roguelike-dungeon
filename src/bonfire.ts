import {DungeonMap, DungeonObject, DungeonZIndexes} from "./dungeon.map";
import {HeroAI} from "./hero";
import {LightType} from "./dungeon.light";
import * as PIXI from 'pixi.js';

const TILE_SIZE = 16;

export enum BonfireState {
  UNLIT = 0,
  LIGHT = 1,
  LIT = 2
}

export class Bonfire implements DungeonObject {
  private readonly dungeon: DungeonMap;
  private _sprite: PIXI.AnimatedSprite;
  private _state: BonfireState;

  readonly x: number;
  readonly y: number;
  readonly width: number = 2;
  readonly height: number = 2;

  readonly static: boolean = true;
  readonly interacting: boolean = true;

  constructor(dungeon: DungeonMap, x: number, y: number) {
    this.dungeon = dungeon;
    this.x = x;
    this.y = y;
    this._state = BonfireState.UNLIT;
    this._sprite = this.dungeon.animated(this.x, this.y, `bonfire_unlit`);
    this._sprite.zIndex = DungeonZIndexes.static + this.y * DungeonZIndexes.row;
    this._sprite.anchor.set(0, 0.75);
    this.dungeon.set(this.x, this.y, this);
  }

  destroy(): void {
    this.dungeon.remove(this.x, this.y, this);
    this._sprite.destroy();
  }

  interact(hero: HeroAI): void {
    switch (this._state) {
      case BonfireState.UNLIT:
        this.light();
        break;
      case BonfireState.LIGHT:
        break;
      case BonfireState.LIT:
        this.dungeon.controller.showInventory(hero.character);
        break;
    }
  }

  collide(_: DungeonObject): boolean {
    return true;
  }

  private light(): void {
    if (this._state === BonfireState.UNLIT) {
      this._state = BonfireState.LIGHT;
      this._sprite.destroy();
      this._sprite = this.dungeon.animated(this.x, this.y, "bonfire_lit");
      this._sprite.zIndex = DungeonZIndexes.static + this.y * DungeonZIndexes.row;
      this._sprite.anchor.set(0, 0.75);
      this._sprite.loop = false;
      this._sprite.onComplete = () => this.lit();
      this.dungeon.light.addLight(
        {
          x: this.x * TILE_SIZE + 8,
          y: this.y * TILE_SIZE - TILE_SIZE,
        },
        LightType.BONFIRE
      );
    }
  }

  private lit(): void {
    this._state = BonfireState.LIT;
    this._sprite?.destroy();
    this._sprite = this.dungeon.animated(this.x, this.y, "bonfire");
    this._sprite.zIndex = DungeonZIndexes.static + this.y * DungeonZIndexes.row;
    this._sprite.anchor.set(0, 0.75);
  }
}