import {BaseCharacterAI, Character} from "./character";
import {DungeonMap, DungeonZIndexes} from "./dungeon.map";

export const npcCharacters: NpcConfig[] = [
  {name: "alchemist", width: 1, height: 1},
  {name: "archer", width: 1, height: 1},
  {name: "bishop", width: 1, height: 2},
  {name: "blacksmith", width: 1, height: 1},
  {name: "butcher", width: 1, height: 1},
  {name: "elite_knight", width: 1, height: 1},
  {name: "executioner", width: 2, height: 2},
  {name: "fat_nun", width: 1, height: 1},
  {name: "heavy_knight", width: 1, height: 1},
  {name: "herald", width: 1, height: 1},
  {name: "king", width: 1, height: 1},
  {name: "knight", width: 1, height: 1},
  {name: "large_elite_knight", width: 2, height: 2},
  {name: "large_knight", width: 2, height: 2},
  {name: "mage", width: 1, height: 1},
  {name: "magic_shop_keeper", width: 1, height: 1},
  {name: "merchant", width: 1, height: 1},
  {name: "mountain_king", width: 1, height: 1},
  {name: "normal_nun", width: 1, height: 1},
  {name: "princess", width: 1, height: 1},
  {name: "queen", width: 1, height: 1},
  {name: "skinny_nun", width: 1, height: 1},
  {name: "thief", width: 1, height: 1},
  {name: "townsfolk_f", width: 1, height: 1},
];

export interface NpcConfig {
  name: string
  width: number,
  height: number,
}

export class NpcCharacter extends Character {
  private _context: Partial<Record<string, any>> = {};

  setContext(key: string, value: any): void {
    this._context[key] = value;
  }

  getContext(key: string): any {
    return this._context[key];
  }

  constructor(name: string) {
    super({
      name: name,
      speed: 0.2,
      healthMax: 100
    });
  }
}

export class NpcAI extends BaseCharacterAI {
  readonly character: Character;

  constructor(character: NpcCharacter, config: NpcConfig, dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, {
      width: config.width,
      height: config.height,
      x: x,
      y: y,
      zIndex: DungeonZIndexes.character
    });
    this.character = character;
    this.init();
  }

  protected onDead(): void {
  }

  protected onKilledBy(_by: Character): void {
  }

  action(): boolean {
    return false;
  }

  protected onPositionChanged(): void {
  }

  hit(): void {
    this.idle();
  }
}