import * as PIXI from "pixi.js";
import {DungeonMap, DungeonZIndexes} from "./DungeonMap";
import {Drop} from "../drop";
import {Hero, HeroController} from "../characters";
import {DungeonObject} from "./DungeonObject";

const TILE_SIZE = 16;

export class DungeonDrop implements DungeonObject {
  readonly dungeon: DungeonMap;
  readonly drop: Drop;

  readonly x: number;
  readonly y: number;
  readonly height: number = 1;
  readonly width: number = 1;

  readonly static: boolean = true;
  readonly interacting: boolean = false;

  private readonly _sprite: PIXI.Sprite | PIXI.AnimatedSprite;

  constructor(dungeon: DungeonMap, x: number, y: number, drop: Drop) {
    this.dungeon = dungeon;
    this.x = x;
    this.y = y;
    this.drop = drop;
    this._sprite = dungeon.sprite(x, y, drop.spriteName);
    this._sprite.zIndex = DungeonZIndexes.drop + y * DungeonZIndexes.row;
    this._sprite.x += (TILE_SIZE >> 1);
    this._sprite.y += TILE_SIZE - 2;
    this._sprite.anchor.set(0.5, 1);
  }

  pickedUp(hero: Hero): boolean {
    if (this.drop.pickedUp(hero)) {
      this.dungeon.cell(this.x, this.y).dropItem = null;
      return true;
    } else {
      return false;
    }
  }

  interact(_: HeroController): void {
  }

  collide(_: DungeonObject): boolean {
    return false;
  }

  destroy(): void {
    this._sprite.destroy();
  }
}