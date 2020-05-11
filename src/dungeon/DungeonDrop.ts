import * as PIXI from "pixi.js";
import {DungeonMap, DungeonZIndexes} from "./DungeonMap";
import {Drop} from "../drop";
import {Hero} from "../characters";
import {DungeonObject} from "./DungeonObject";

const TILE_SIZE = 16;

export class DungeonDrop extends DungeonObject {
  readonly drop: Drop;

  readonly x: number;
  readonly y: number;

  private readonly _dungeon: DungeonMap;
  private readonly _sprite: PIXI.Sprite | PIXI.AnimatedSprite;

  constructor(dungeon: DungeonMap, x: number, y: number, drop: Drop) {
    super(dungeon.registry, {
      width: 1,
      height: 1,
      static: false,
      interacting: false,
    })
    this.x = x;
    this.y = y;
    this.drop = drop;
    this._dungeon = dungeon;
    this._sprite = dungeon.sprite(x, y, drop.spriteName);
    this._sprite.zIndex = DungeonZIndexes.drop + y * DungeonZIndexes.row;
    this._sprite.x += (TILE_SIZE >> 1);
    this._sprite.y += TILE_SIZE - 2;
    this._sprite.anchor.set(0.5, 1);
  }

  pickedUp(hero: Hero): boolean {
    if (this.drop.pickedUp(hero)) {
      this._dungeon.cell(this.x, this.y).dropItem = null;
      return true;
    } else {
      return false;
    }
  }

  destroy(): void {
    super.destroy();
    this._sprite.destroy();
  }
}