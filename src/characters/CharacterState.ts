import {ObservableVar} from "../observable";
import {Inventory} from "../inventory";
import {Weapon} from "../weapon";

export abstract class CharacterState {
  abstract readonly name: string;

  abstract readonly healthMax: ObservableVar<number>;
  abstract readonly health: ObservableVar<number>;
  abstract readonly baseDamage: ObservableVar<number>;
  abstract readonly speed: ObservableVar<number>;
  abstract readonly coins: ObservableVar<number>;

  abstract readonly inventory: Inventory;

  get weapon(): Weapon | null {
    return this.inventory.equipment.weapon.item.get() as Weapon || null;
  }

  get damage(): number {
    return this.baseDamage.get() + (this.weapon?.damage || 0);
  }

  protected constructor() {
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
}