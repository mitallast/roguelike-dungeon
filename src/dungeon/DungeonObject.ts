import {HeroController} from "../characters";

export interface DungeonObject {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;

  readonly static: boolean;
  readonly interacting: boolean;

  interact(hero: HeroController): void;
  collide(object: DungeonObject): boolean;

  destroy(): void;
}

