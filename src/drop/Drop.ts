import {RNG} from "../rng";
import {InventoryCell} from "../inventory";
import {Serializer} from "../persistent";
import {Weapon, WeaponManager} from "../weapon";
import {CharacterState} from "../characters/CharacterState";

export interface Drop {
  readonly spriteName: string;
  pickedUp(character: CharacterState): boolean;
}

export interface UsableDrop extends Drop {
  info(): DropInfo;
  same(item: UsableDrop): boolean;
  use(cell: InventoryCell, character: CharacterState): void;
}

export interface UsableDropState {
  readonly type: "HealthFlask" | "HealthBigFlask" | "Weapon";
  readonly name?: string;
}

export class UsableDropSerializer implements Serializer<UsableDrop> {
  private readonly _weaponManager: WeaponManager;

  constructor(weaponManager: WeaponManager) {
    this._weaponManager = weaponManager;
  }

  deserialize(value: string): UsableDrop {
    const state: UsableDropState = JSON.parse(value);
    switch (state.type) {
      case "HealthFlask":
        return new HealthFlask();
      case "HealthBigFlask":
        return new HealthBigFlask()
      case "Weapon":
        return this._weaponManager.heroWeapon(state.name!);
    }
  }

  serialize(value: UsableDrop): string {
    let state: UsableDropState;
    if (value instanceof HealthFlask) {
      state = {type: "HealthFlask"};
    } else if (value instanceof HealthBigFlask) {
      state = {type: "HealthBigFlask"};
    } else if (value instanceof Weapon) {
      state = {type: "Weapon", name: value.name};
    } else {
      throw "unexpected value";
    }

    return JSON.stringify(state);
  }
}

export interface DropInfo {
  readonly name: string;
  readonly health?: number;
  readonly speed?: number;
  readonly distance?: number;
  readonly stamina?: number;
  readonly damage?: number;

  price?: number;
  readonly sellPrice?: number;
  readonly buyPrice?: number;
}

export class Coins implements Drop {
  readonly spriteName: string = "coin"; // @animated

  private readonly _coins: number;

  constructor(rng: RNG) {
    this._coins = rng.range(1, 30);
  }

  pickedUp(character: CharacterState): boolean {
    character.coins.update(c => c + this._coins);
    return true;
  }
}

export class HealthFlask implements UsableDrop {
  readonly spriteName: string = "flask_red.png";

  private readonly _health: number = 2;

  info(): DropInfo {
    return {
      name: "Health flask",
      health: this._health,
      buyPrice: 100,
    };
  }

  pickedUp(character: CharacterState): boolean {
    return character.inventory.add(this);
  }

  same(item: UsableDrop): boolean {
    return item instanceof HealthFlask;
  }

  use(cell: InventoryCell, character: CharacterState): void {
    character.health.update(h => Math.min(character.healthMax.get(), h + this._health));
    cell.decrease();
  }
}

export class HealthBigFlask implements UsableDrop {
  readonly spriteName: string = "flask_big_red.png";

  private readonly _health: number = 5;

  info(): DropInfo {
    return {
      name: "Big health flask",
      health: this._health,
      buyPrice: 300,
    };
  }

  pickedUp(character: CharacterState): boolean {
    return character.inventory.add(this);
  }

  same(item: UsableDrop): boolean {
    return item instanceof HealthBigFlask;
  }

  use(cell: InventoryCell, character: CharacterState): void {
    character.heal(this._health);
    cell.decrease();
  }
}