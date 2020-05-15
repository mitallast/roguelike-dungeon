import {ObservableVar} from "../observable";
import {DefaultInventoryState, Inventory} from "../inventory";
import {CharacterState} from "./CharacterState";

export abstract class DefaultCharacterState extends CharacterState {

  readonly name: string;

  readonly healthMax: ObservableVar<number>;
  readonly health: ObservableVar<number>;
  readonly staminaMax: ObservableVar<number>;
  readonly stamina: ObservableVar<number>;
  readonly baseDamage: ObservableVar<number>;
  readonly speed: ObservableVar<number>;
  readonly coins: ObservableVar<number>;

  readonly inventory: Inventory;

  protected constructor(options: {
    name: string;
    healthMax: number;
    health: number;
    staminaMax: number;
    stamina: number;
    baseDamage: number;
    speed: number;
    coins: number;
  }) {
    super()
    this.name = options.name;

    this.healthMax = new ObservableVar<number>(options.healthMax);
    this.health = new ObservableVar<number>(options.health);
    this.staminaMax = new ObservableVar<number>(options.staminaMax);
    this.stamina = new ObservableVar<number>(options.stamina);
    this.baseDamage = new ObservableVar<number>(options.baseDamage);
    this.speed = new ObservableVar<number>(options.speed);
    this.coins = new ObservableVar<number>(options.coins);

    this.inventory = new Inventory(new DefaultInventoryState());
  }
}