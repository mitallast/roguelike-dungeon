import {EventPublisher, ObservableVar} from "../observable";
import {Inventory} from "../inventory";
import {Weapon} from "../weapon";
import {Character} from "./Character";

export abstract class CharacterState {
  abstract readonly name: string;

  readonly dead: ObservableVar<boolean>;
  readonly killedBy: EventPublisher<Character>;

  abstract readonly healthMax: ObservableVar<number>;
  abstract readonly health: ObservableVar<number>;
  abstract readonly staminaMax: ObservableVar<number>;
  abstract readonly stamina: ObservableVar<number>;
  abstract readonly baseDamage: ObservableVar<number>;
  abstract readonly speed: ObservableVar<number>;
  abstract readonly coins: ObservableVar<number>;

  abstract readonly inventory: Inventory;

  get weapon(): Weapon | null {
    return this.inventory.equipment.weapon.item.get() as Weapon || null;
  }

  get damage(): number {
    return this._damage(1, AttackType.LIGHT);
  }

  _damage(combo: number, attackType: AttackType): number {
    const base = this.baseDamage.get();
    const weapon = this.weapon?.damage || 0;
    const comboBonus = 1 + combo / 10;
    const attackTypeBonus = attackType === AttackType.CHARGED ? 1.5 : 1;
    return (base + weapon) * comboBonus * attackTypeBonus;
  }

  protected constructor() {
    this.dead = new ObservableVar<boolean>(false);
    this.killedBy = new EventPublisher<Character>();
  }

  hitDamage(by: Character, damage: number): void {
    if (!this.dead.get()) {
      this.health.update(h => {
        const hp = parseFloat(Math.max(0, h - damage).toFixed(1));
        console.log(`${this.name} damaged by ${by.state.name} damage=${damage} hp=${hp}`);
        return hp
      });
      if (this.health.get() === 0) {
        console.log(`${this.name} killed by ${by.state.name}`);
        this.killedBy.send(by);
        this.dead.set(true);
      }
    }
  }

  addCoins(coins: number): void {
    this.coins.update(c => c + coins);
  }

  decreaseCoins(coins: number): boolean {
    const current = this.coins.get()
    if (current >= coins) {
      this.coins.set(current - coins);
      return true;
    } else {
      return false;
    }
  }

  heal(health: number): void {
    this.health.update(h => Math.min(this.healthMax.get(), h + health));
  }

  regenStamina(): void {
    const stamina = this.stamina.get();
    const staminaMax = this.staminaMax.get();
    if (stamina < staminaMax) {
      this.stamina.set(Math.min(staminaMax, stamina + 0.75));
    }
  }

  hasStamina(spend: number): boolean {
    return this.stamina.get() >= spend;
  }

  spendStamina(spend: number): void {
    this.stamina.update(st => Math.max(0, st - spend));
  }

  get hitStamina(): number {
    return this.weapon?.stamina || 20;
  }

  get dashStamina(): number {
    return 16;
  }
}

export const enum AttackType {
  LIGHT = 0,
  CHARGED = 1,
}