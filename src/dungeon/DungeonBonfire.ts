import * as PIXI from 'pixi.js';
import {Colors} from "../ui";
import {Hero} from "../characters";
import {DungeonMap, DungeonZIndexes} from "./DungeonMap";
import {DungeonObject} from "./DungeonObject";
import {DungeonLightType} from "./DungeonLight";

const TILE_SIZE = 16;

export enum BonfireState {
  UNLIT = 0,
  LIGHT = 1,
  LIT = 2
}

export class DungeonBonfire extends DungeonObject {
  private readonly _dungeon: DungeonMap;
  private _sprite: PIXI.AnimatedSprite;
  private _state: BonfireState;

  readonly x: number;
  readonly y: number;

  get state(): BonfireState {
    return this._state;
  }

  constructor(dungeon: DungeonMap, x: number, y: number, light: boolean) {
    super(dungeon.registry, {
      static: false,
      interacting: true,
      width: 1,
      height: 1,
    });
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
    super.destroy();
    this._dungeon.remove(this.x, this.y, this);
    this._sprite.destroy();
  }

  interact(hero: Hero): void {
    switch (this._state) {
      case BonfireState.UNLIT:
        hero.state.dungeons.litBonfire(this._dungeon.level);
        this._dungeon.controller.showBanner({
          text: 'BONFIRE LIT',
          color: Colors.uiYellow
        });
        this.light();
        break;
      case BonfireState.LIGHT:
      case BonfireState.LIT:
        this._dungeon.controller.showBonfire(hero.state);
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
