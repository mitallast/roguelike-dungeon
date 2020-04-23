import {BaseCharacterAI, Character} from "./character";
import {DungeonMap, DungeonZIndexes} from "./dungeon.map";
import {Hero} from "./hero";
import {SceneController} from "./scene";
import * as PIXI from "pixi.js";

export interface NpcConfig {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly skills: readonly string[];
}

export abstract class NpcSkill {
  protected readonly npc: NpcCharacter;
  protected readonly controller: SceneController;

  protected constructor(npc: NpcCharacter, controller: SceneController) {
    this.npc = npc;
    this.controller = controller;
  }

  abstract use(hero: Hero): void;
}

export class SellingSkill extends NpcSkill {
  static readonly id: string = 'selling';

  constructor(npc: NpcCharacter, controller: SceneController) {
    super(npc, controller);
  }

  use(hero: Hero): void {
    this.controller.showInventory(hero, this.npc);
  }
}

export class HealSkill extends NpcSkill {
  static readonly id: string = 'heal';

  constructor(npc: NpcCharacter, controller: SceneController) {
    super(npc, controller);
  }

  use(hero: Hero): void {
    PIXI.sound.play('big_egg_collect');
    hero.heal(hero.healthMax.get());
  }
}

export const npcCharacters: NpcConfig[] = [
  {name: "alchemist", width: 1, height: 1, skills: [SellingSkill.id]},
  {name: "archer", width: 1, height: 1, skills: [SellingSkill.id]},
  {name: "bishop", width: 1, height: 2, skills: []},
  {name: "blacksmith", width: 1, height: 1, skills: [SellingSkill.id]},
  {name: "butcher", width: 1, height: 1, skills: [SellingSkill.id]},
  {name: "elite_knight", width: 1, height: 1, skills: []},
  {name: "executioner", width: 2, height: 2, skills: []},
  {name: "fat_nun", width: 1, height: 1, skills: [HealSkill.id]},
  {name: "heavy_knight", width: 1, height: 1, skills: []},
  {name: "herald", width: 1, height: 1, skills: []},
  {name: "king", width: 1, height: 1, skills: []},
  {name: "knight", width: 1, height: 1, skills: []},
  {name: "large_elite_knight", width: 2, height: 2, skills: []},
  {name: "large_knight", width: 2, height: 2, skills: []},
  {name: "mage", width: 1, height: 1, skills: [SellingSkill.id]},
  {name: "magic_shop_keeper", width: 1, height: 1, skills: [SellingSkill.id]},
  {name: "merchant", width: 1, height: 1, skills: [SellingSkill.id]},
  {name: "mountain_king", width: 1, height: 1, skills: []},
  {name: "normal_nun", width: 1, height: 1, skills: [HealSkill.id]},
  {name: "princess", width: 1, height: 1, skills: []},
  {name: "queen", width: 1, height: 1, skills: []},
  {name: "skinny_nun", width: 1, height: 1, skills: [HealSkill.id]},
  {name: "thief", width: 1, height: 1, skills: [SellingSkill.id]},
  {name: "townsfolk_f", width: 1, height: 1, skills: []},
];

export class NpcCharacter extends Character {
  private _context: Partial<Record<string, any>> = {};
  private _skill: Partial<Record<string, NpcSkill>> = {};

  setContext(key: string, value: any): void {
    this._context[key] = value;
  }

  getContext(key: string): any {
    return this._context[key];
  }

  hasSkill(id: string): boolean {
    return this._skill.hasOwnProperty(id);
  }

  getSkill(id: string): NpcSkill | null {
    return this._skill[id] || null;
  }

  addSkill(id: string, skill: NpcSkill): void {
    this._skill[id] = skill;
  }

  constructor(name: string) {
    super({
      name: name,
      speed: 1,
      healthMax: 100
    });
  }
}

export class NpcAI extends BaseCharacterAI {
  readonly character: NpcCharacter;

  constructor(config: NpcConfig, dungeon: DungeonMap, controller: SceneController, x: number, y: number) {
    super(dungeon, {
      width: config.width,
      height: config.height,
      x: x,
      y: y,
      zIndex: DungeonZIndexes.character
    });
    this.character = new NpcCharacter(config.name);
    this.initSkills(controller, config.skills);
    this.init();
  }

  protected initSkills(controller: SceneController, skills: readonly string[]): void {
    for (const id of skills) {
      switch (id) {
        case SellingSkill.id:
          this.character.addSkill(id, new SellingSkill(this.character, controller));
          break;
        case HealSkill.id:
          this.character.addSkill(id, new HealSkill(this.character, controller));
          break;
      }
    }
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