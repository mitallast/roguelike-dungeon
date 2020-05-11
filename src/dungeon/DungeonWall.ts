import * as PIXI from "pixi.js";
import {DungeonMap, DungeonZIndexes} from "./DungeonMap";
import {DungeonObject} from "./DungeonObject";

export class DungeonWall extends DungeonObject {
  readonly x: number;
  readonly y: number;

  readonly name: string;

  private readonly _dungeon: DungeonMap;
  private readonly _sprite: PIXI.Sprite | PIXI.AnimatedSprite;

  constructor(dungeon: DungeonMap, x: number, y: number, name: string) {
    super(dungeon.registry, {
      width: 1,
      height: 1,
      static: true,
      interacting: false,
    });
    this.x = x;
    this.y = y;
    this.name = name;
    this._dungeon = dungeon;
    this._sprite = dungeon.sprite(x, y, name);
    this._sprite.zIndex = DungeonZIndexes.wall + y * DungeonZIndexes.row;
  }

  collide(_: DungeonObject): boolean {
    return !this._dungeon.cell(this.x, this.y).hasFloor;
  }

  destroy(): void {
    super.destroy();
    this._sprite.destroy();
  }
}