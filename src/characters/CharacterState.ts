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
    return this.baseDamage.get() + (this.weapon?.damage || 0);
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

  spendHitStamina(): boolean {
    const spend = this.weapon?.stamina || 20;
    const stamina = this.stamina.get();
    if (stamina >= spend) {
      this.stamina.set(stamina - spend);
      return true;
    } else {
      return false;
    }
  }
}