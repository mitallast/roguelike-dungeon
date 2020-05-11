import * as PIXI from "pixi.js";
import {DungeonMap, DungeonZIndexes} from "./DungeonMap";
import {DungeonObject} from "./DungeonObject";

const TILE_SIZE = 16;

export class DungeonFloor extends DungeonObject {
  readonly x: number;
  readonly y: number;

  readonly name: string;

  protected readonly _dungeon: DungeonMap;
  protected readonly _sprite: PIXI.Sprite | PIXI.AnimatedSprite;

  constructor(dungeon: DungeonMap, x: number, y: number, name: string, interacting: boolean = false) {
    super(dungeon.registry, {
      width: 1,
      height: 1,
      static: true,
      interacting: interacting,
    });
    this.x = x;
    this.y = y;
    this.name = name;
    this._dungeon = dungeon;
    this._sprite = this._dungeon.controller.resources.sprite(name);
    this._sprite.zIndex = DungeonZIndexes.floor;
    this._sprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
    if (this._sprite instanceof PIXI.AnimatedSprite) {
      this._dungeon.layer.addChild(this._sprite);
    } else {
      this._dungeon.floorContainer.addChild(this._sprite);
    }
  }

  destroy(): void {
    super.destroy();
    this._sprite.destroy();
  }
}