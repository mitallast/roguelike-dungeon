import * as PIXI from "pixi.js";
import {DungeonMap, DungeonZIndexes} from "./DungeonMap";
import {HeroController} from "../characters";
import {DungeonObject} from "./DungeonObject";

const TILE_SIZE = 16;

export abstract class DungeonFloor implements DungeonObject {
  readonly dungeon: DungeonMap;

  readonly x: number;
  readonly y: number;
  readonly height: number = 1;
  readonly width: number = 1;

  readonly static: boolean = true;
  abstract readonly interacting: boolean;

  readonly name: string;
  protected readonly sprite: PIXI.Sprite | PIXI.AnimatedSprite;

  protected constructor(dungeon: DungeonMap, x: number, y: number, name: string) {
    this.dungeon = dungeon;
    this.x = x;
    this.y = y;
    this.name = name;
    this.sprite = this.dungeon.controller.resources.sprite(name);
    this.sprite.zIndex = DungeonZIndexes.floor;
    this.sprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
    if (this.sprite instanceof PIXI.AnimatedSprite) {
      this.dungeon.container.addChild(this.sprite);
    } else {
      this.dungeon.floorContainer.addChild(this.sprite);
    }
  }

  abstract interact(hero: HeroController): void;

  collide(): boolean {
    return false;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

export class DefaultDungeonFloor extends DungeonFloor {
  readonly interacting: boolean = false;

  constructor(dungeon: DungeonMap, x: number, y: number, name: string) {
    super(dungeon, x, y, name);
  }

  interact(): void {
  }
}
