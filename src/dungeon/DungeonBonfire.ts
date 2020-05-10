import * as PIXI from 'pixi.js';
import {DungeonMap, DungeonZIndexes} from "./DungeonMap";
import {HeroController} from "../characters";
import {DungeonLightType} from "./DungeonLight";
import {Colors} from "../ui";
import {DungeonObject} from "./DungeonObject";

const TILE_SIZE = 16;

export enum BonfireState {
  UNLIT = 0,
  LIGHT = 1,
  LIT = 2
}

export class DungeonBonfire implements DungeonObject {
  private readonly _dungeon: DungeonMap;
  private _sprite: PIXI.AnimatedSprite;
  private _state: BonfireState;

  readonly x: number;
  readonly y: number;
  readonly width: number = 1;
  readonly height: number = 1;

  readonly static: boolean = true;
  readonly interacting: boolean = true;

  get state(): BonfireState {
    return this._state;
  }

  constructor(dungeon: DungeonMap, x: number, y: number, light: boolean) {
    this._dungeon = dungeon;
    this.x = x;
    this.y = y;
    this._state = BonfireState.UNLIT;
    this._sprite = this._dungeon.animated(this.x, this.y, `bonfire_unlit`);
    this._sprite.zIndex = DungeonZIndexes.static + this.y * DungeonZIndexes.row;
    this._dungeon.cell(this.x, this.y).object = this;

    if (light) this.light();
  }

  destroy(): void {
    this._dungeon.remove(this.x, this.y, this);
    this._sprite.destroy();
  }

  interact(hero: HeroController): void {
    switch (this._state) {
      case BonfireState.UNLIT:
        hero.character.bonfires.add(this._dungeon.level);
        this._dungeon.controller.showBanner({
          text: 'BONFIRE LIT',
          color: Colors.uiYellow
        });
        this.light();
        break;
      case BonfireState.LIGHT:
      case BonfireState.LIT:
        this._dungeon.controller.showBonfire(hero.character);
        break;
    }
  }

  collide(): boolean {
    return true;
  }

  private light(): void {
    if (this._state === BonfireState.UNLIT) {
      this._state = BonfireState.LIGHT;
      this._sprite.destroy();
      this._sprite = this._dungeon.animated(this.x, this.y, "bonfire_light");
      this._sprite.zIndex = DungeonZIndexes.static + this.y * DungeonZIndexes.row;
      this._sprite.loop = false;
      this._sprite.onComplete = (): void => this.lit();
      const point = new PIXI.Point(
        this.x * TILE_SIZE + (TILE_SIZE >> 1),
        this.y * TILE_SIZE - TILE_SIZE
      );
      this._dungeon.light.addLight(point, DungeonLightType.BONFIRE);
    }
  }

  private lit(): void {
    this._state = BonfireState.LIT;
    this._sprite?.destroy();
    this._sprite = this._dungeon.animated(this.x, this.y, "bonfire_lit");
    this._sprite.zIndex = DungeonZIndexes.static + this.y * DungeonZIndexes.row;
  }
}
