import {NpcState} from "./NpcState";
import {BuyingSkill, HealSkill, SellingSkill} from "./NpcSkill";
import {SceneController} from "../../scene";
import {Npc} from "./Npc";
import {DungeonMap} from "../../dungeon";

export interface NpcConfig {
  readonly name: string;
  readonly width: number;
  readonly height: number;

  readonly healthMax: number;
  readonly health: number;
  readonly baseDamage: number;
  readonly speed: number;
  readonly coins: number;

  readonly skills: readonly string[];
  readonly weapons: readonly string[];
  readonly trading: readonly string[];
}

export interface NpcConfiguration {
  readonly npc: Partial<Record<string, NpcConfig>>;
}

export class NpcManager {
  private readonly _controller: SceneController;
  private _config!: NpcConfiguration;

  constructor(controller: SceneController) {
    this._controller = controller;
  }

  init(): void {
    this._config = this._controller.loader.resources['npc.config.json'].data;
  }

  state(level: number, name: string): NpcState {
    const config = this._config.npc[name];
    if (!config) throw `Npc not found: ${name}`;

    const state = new NpcState({
      name: config.name,

      healthMax: config.healthMax,
      health: config.health,
      baseDamage: config.baseDamage,
      speed: config.speed,
      coins: config.coins,

      level: level,
      width: config.width,
      height: config.height,
    });

    for (const id of config.skills) {
      switch (id) {
        case SellingSkill.id:
          state.addSkill(id, new SellingSkill(state, this._controller));
          break;
        case BuyingSkill.id:
          state.addSkill(id, new BuyingSkill(state, this._controller, config.trading));
          break;
        case HealSkill.id:
          state.addSkill(id, new HealSkill(state, this._controller));
          break;
      }
    }

    const weaponId = this._controller.rng.select(config.weapons);
    if (weaponId) {
      const weapon = this._controller.weaponManager.npcWeapon(weaponId);
      state.inventory.equipment.weapon.set(weapon);
    }

    return state;
  }

  spawnRandom(dungeon: DungeonMap, x: number, y: number): Npc {
    const name = dungeon.rng.select(Object.keys(this._config.npc))!;
    const state = this.state(dungeon.level, name);
    return new Npc(state, dungeon, x, y);
  }
}