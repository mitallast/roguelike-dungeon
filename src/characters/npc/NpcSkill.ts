import * as PIXI from "pixi.js";
import {SceneController} from "../../scene";
import {HeroState} from "../hero";
import {NpcState} from "./NpcState";
import {TradingType} from "./TradingType";
import {HealthBigFlask, HealthFlask} from "../../drop";

export abstract class NpcSkill {
  protected readonly npc: NpcState;
  protected readonly controller: SceneController;

  protected constructor(npc: NpcState, controller: SceneController) {
    this.npc = npc;
    this.controller = controller;
  }

  abstract use(hero: HeroState): void;
}

export class SellingSkill extends NpcSkill {
  static readonly id: string = 'selling';

  constructor(npc: NpcState, controller: SceneController) {
    super(npc, controller);
  }

  use(hero: HeroState): void {
    this.controller.sellInventory(hero, this.npc);
  }
}

export class BuyingSkill extends NpcSkill {
  static readonly id: string = 'buying';

  constructor(npc: NpcState, controller: SceneController, trading: readonly string[]) {
    super(npc, controller);
    for (const id of trading) {
      switch (id) {
        case TradingType.POTIONS:
          for (let x = 0; x < 10; x++) {
            npc.inventory.backpack.cell(x, 0).set(new HealthFlask(), 3);
          }
          for (let x = 0; x < 10; x++) {
            npc.inventory.backpack.cell(x, 1).set(new HealthBigFlask(), 3);
          }
          break;
        case TradingType.WEAPONS:
          for (const config of controller.weaponManager.heroWeapons(npc.level + 2)) {
            const weapon = controller.weaponManager.weapon(config);
            npc.inventory.backpack.add(weapon);
          }
          break;
      }
    }
  }

  use(hero: HeroState): void {
    this.controller.buyInventory(hero, this.npc);
  }
}

export class HealSkill extends NpcSkill {
  static readonly id: string = 'heal';

  constructor(npc: NpcState, controller: SceneController) {
    super(npc, controller);
  }

  use(hero: HeroState): void {
    PIXI.sound.play('big_egg_collect');
    hero.health.set(hero.healthMax.get());
  }
}