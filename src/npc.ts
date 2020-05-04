import {BaseCharacterAI, Character} from "./character";
import {DungeonMap, DungeonZIndexes} from "./dungeon.map";
import {Hero, HeroAI} from "./hero";
import {SceneController} from "./scene";
import {HealthBigFlask, HealthFlask, npcWeapons, Weapon, WeaponConfig, weaponConfigs} from "./drop";
import * as PIXI from "pixi.js";

export abstract class NpcSkill {
  protected readonly npc: Npc;
  protected readonly controller: SceneController;

  protected constructor(npc: Npc, controller: SceneController) {
    this.npc = npc;
    this.controller = controller;
  }

  abstract use(hero: Hero): void;
}

export class SellingSkill extends NpcSkill {
  static readonly id: string = 'selling';

  constructor(npc: Npc, controller: SceneController) {
    super(npc, controller);
  }

  use(hero: Hero): void {
    this.controller.sellInventory(hero, this.npc);
  }
}

export class BuyingSkill extends NpcSkill {
  static readonly id: string = 'buying';

  constructor(npc: Npc, controller: SceneController) {
    super(npc, controller);
  }

  use(hero: Hero): void {
    this.controller.buyInventory(hero, this.npc);
  }
}

export class HealSkill extends NpcSkill {
  static readonly id: string = 'heal';

  constructor(npc: Npc, controller: SceneController) {
    super(npc, controller);
  }

  use(hero: Hero): void {
    PIXI.sound.play('big_egg_collect');
    hero.heal(hero.healthMax.get());
  }
}

export enum TradingType {
  POTIONS = 1,
  WEAPONS = 2,
}

export interface NpcConfig {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly baseDamage: number;
  readonly coins: number;

  readonly skills: readonly string[];
  readonly weapons: readonly WeaponConfig[];
  readonly trading: readonly TradingType[];
}

export const NPCs: readonly NpcConfig[] = [
  {
    name: "alchemist",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 1000,
    skills: [SellingSkill.id, BuyingSkill.id],
    weapons: [],
    trading: [TradingType.POTIONS],
  },
  {
    name: "archer",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 1000,
    skills: [],
    weapons: [],
    trading: [],
  },
  {
    name: "bishop",
    width: 1,
    height: 2,
    baseDamage: 0,
    coins: 0,
    skills: [],
    weapons: [],
    trading: [],
  },
  {
    name: "blacksmith",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 1000,
    skills: [SellingSkill.id, BuyingSkill.id],
    weapons: [npcWeapons.hammer],
    trading: [TradingType.WEAPONS]
  },
  {
    name: "butcher",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 1000,
    skills: [SellingSkill.id, BuyingSkill.id],
    weapons: [],
    trading: []
  },
  {
    name: "executioner",
    width: 2,
    height: 2,
    baseDamage: 0,
    coins: 0,
    skills: [],
    weapons: [npcWeapons.axe],
    trading: []
  },
  {
    name: "herald",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 0,
    skills: [],
    weapons: [],
    trading: []
  },
  {
    name: "king",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 0,
    skills: [],
    weapons: [],
    trading: []
  },
  {
    name: "knight",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 0,
    skills: [],
    weapons: [npcWeapons.regular_sword],
    trading: []
  },
  {
    name: "knight_elite",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 0,
    skills: [],
    weapons: [npcWeapons.regular_sword],
    trading: []
  },
  {
    name: "knight_heavy",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 0,
    skills: [],
    weapons: [npcWeapons.regular_sword],
    trading: []
  },
  {
    name: "large_knight",
    width: 2,
    height: 2,
    baseDamage: 0,
    coins: 0,
    skills: [],
    weapons: [npcWeapons.knight_sword],
    trading: []
  },
  {
    name: "large_knight_elite",
    width: 2,
    height: 2,
    baseDamage: 0,
    coins: 0,
    skills: [],
    weapons: [npcWeapons.knight_sword],
    trading: []
  },
  {
    name: "mage",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 1000,
    skills: [SellingSkill.id, BuyingSkill.id],
    weapons: [],
    trading: [TradingType.POTIONS]
  },
  {
    name: "magic_shop_keeper",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 1000,
    skills: [SellingSkill.id, BuyingSkill.id],
    weapons: [],
    trading: [TradingType.POTIONS]
  },
  {
    name: "merchant",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 10000,
    skills: [SellingSkill.id, BuyingSkill.id],
    weapons: [],
    trading: [TradingType.POTIONS]
  },
  {
    name: "mountain_king",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 0,
    skills: [],
    weapons: [],
    trading: []
  },
  {
    name: "nun",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 0,
    skills: [HealSkill.id],
    weapons: [],
    trading: []
  },
  {
    name: "nun_fat",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 0,
    skills: [HealSkill.id],
    weapons: [],
    trading: []
  },
  {
    name: "nun_tall",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 0,
    skills: [HealSkill.id],
    weapons: [],
    trading: []
  },
  {
    name: "princess",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 0,
    skills: [],
    weapons: [],
    trading: []
  },
  {
    name: "queen",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 0,
    skills: [],
    weapons: [],
    trading: []
  },
  {
    name: "thief",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 1000,
    skills: [SellingSkill.id, BuyingSkill.id],
    weapons: [npcWeapons.knife],
    trading: []
  },
  {
    name: "townsfolk_f",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 100,
    skills: [SellingSkill.id, BuyingSkill.id],
    weapons: [],
    trading: []
  },
  {
    name: "townsfolk_m",
    width: 1,
    height: 1,
    baseDamage: 0,
    coins: 100,
    skills: [SellingSkill.id, BuyingSkill.id],
    weapons: [],
    trading: []
  },
];

export class Npc extends Character {
  private _context: Map<string, any> = new Map<string, any>();
  private _skill: Map<string, NpcSkill> = new Map<string, NpcSkill>();

  setContext(key: string, value: any): void {
    this._context.set(key, value);
  }

  getContext(key: string): any {
    return this._context.get(key);
  }

  hasSkill(id: string): boolean {
    return this._skill.has(id);
  }

  getSkill(id: string): NpcSkill | null {
    return this._skill.get(id) || null;
  }

  addSkill(id: string, skill: NpcSkill): void {
    this._skill.set(id, skill);
  }

  constructor(options: {
    readonly name: string;
    readonly baseDamage: number;
    readonly coins: number;
  }) {
    super({
      name: options.name,
      speed: 1,
      healthMax: 1000,
      baseDamage: options.baseDamage,
      coins: options.coins,
    });
  }
}

export class NpcAI extends BaseCharacterAI {
  readonly character: Npc;
  readonly interacting: boolean = true;

  constructor(config: NpcConfig, dungeon: DungeonMap, controller: SceneController, x: number, y: number) {
    super(dungeon, {
      width: config.width,
      height: config.height,
      x: x,
      y: y,
      zIndex: DungeonZIndexes.character
    });
    this.character = new Npc(config);
    const weapon = Weapon.select(this.dungeon.rng, config.weapons);
    if (weapon) {
      this.character.inventory.equipment.weapon.set(weapon);
    }
    this.initSkills(controller, config);
    this.init();
  }

  protected initSkills(controller: SceneController, config: NpcConfig): void {
    const backpack = this.character.inventory.backpack;
    for (const id of config.skills) {
      switch (id) {
        case SellingSkill.id:
          this.character.addSkill(id, new SellingSkill(this.character, controller));
          break;
        case BuyingSkill.id:
          this.character.addSkill(id, new BuyingSkill(this.character, controller));
          for (const trading of config.trading) {
            switch (trading) {
              case TradingType.POTIONS:
                for (let x = 0; x < 10; x++) {
                  backpack.cell(x, 0).set(new HealthFlask(), 3);
                }
                for (let x = 0; x < 10; x++) {
                  backpack.cell(x, 1).set(new HealthBigFlask(), 3);
                }
                break;
              case TradingType.WEAPONS:
                for (const config of weaponConfigs) {
                  if (config.level <= this.dungeon.level + 2) {
                    backpack.add(new Weapon(config));
                  }
                }
                break;
            }
          }
          break;
        case HealSkill.id:
          this.character.addSkill(id, new HealSkill(this.character, controller));
          break;
      }
    }
  }

  protected onDead(): void {
  }

  protected onKilledBy(_: Character): void {
  }

  action(): boolean {
    return false;
  }

  interact(hero: HeroAI): void {
    this.lookAt(hero);
    this.dungeon.controller.showDialog(hero.character, this.character);
  }
}