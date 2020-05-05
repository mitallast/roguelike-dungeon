import {RNG} from "../rng";
import {Hero, Character} from "../characters";
import {InventoryCell} from "../inventory";

export interface Drop {
  readonly spriteName: string;
  pickedUp(hero: Hero): boolean;
}

export interface UsableDrop extends Drop {
  info(): DropInfo;
  same(item: UsableDrop): boolean;
  use(cell: InventoryCell, character: Character): void;
}

export interface DropInfo {
  readonly name: string;
  readonly health?: number;
  readonly speed?: number;
  readonly distance?: number;
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

  pickedUp(hero: Hero): boolean {
    hero.addCoins(this._coins);
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

  pickedUp(hero: Hero): boolean {
    return hero.inventory.add(this);
  }

  same(item: UsableDrop): boolean {
    return item instanceof HealthFlask;
  }

  use(cell: InventoryCell, character: Character): void {
    character.heal(this._health);
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

  pickedUp(hero: Hero): boolean {
    return hero.inventory.add(this);
  }

  same(item: UsableDrop): boolean {
    return item instanceof HealthBigFlask;
  }

  use(cell: InventoryCell, character: Character): void {
    character.heal(this._health);
    cell.decrease();
  }
}