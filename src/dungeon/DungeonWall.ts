import * as PIXI from "pixi.js";
import {DungeonMap, DungeonZIndexes} from "./DungeonMap";
import {HeroAI} from "../characters";
import {DungeonObject} from "./DungeonObject";

export class DungeonWall implements DungeonObject {
  readonly dungeon: DungeonMap;

  readonly x: number;
  readonly y: number;
  readonly height: number = 1;
  readonly width: number = 1;

  readonly static: boolean = true;
  readonly interacting: boolean = false;

  readonly name: string;
  protected readonly sprite: PIXI.Sprite | PIXI.AnimatedSprite;

  constructor(dungeon: DungeonMap, x: number, y: number, name: string) {
    this.dungeon = dungeon;
    this.x = x;
    this.y = y;
    this.name = name;
    this.sprite = dungeon.sprite(x, y, name);
    this.sprite.zIndex = DungeonZIndexes.wall + y * DungeonZIndexes.row;
  }

  interact(_: HeroAI): void {
  }

  collide(_: DungeonObject): boolean {
    return !this.dungeon.cell(this.x, this.y).hasFloor;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}