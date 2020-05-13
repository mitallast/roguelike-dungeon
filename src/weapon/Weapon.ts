import {InventoryCell} from "../inventory";
import {DropInfo, UsableDrop} from "../drop";
import {WeaponAnimationSet} from "./WeaponAnimation";
import {CharacterState} from "../characters/CharacterState";

export class Weapon implements UsableDrop {
  readonly name: string;
  readonly speed: number;
  readonly animations: WeaponAnimationSet;
  readonly distance: number;
  readonly damage: number;
  private readonly _price: number;

  get spriteName(): string {
    return `weapon_${this.name}.png`;
  }

  constructor(options: {
    name: string;
    speed: number;
    distance: number;
    damage: number;
    level: number;
    price: number;
    animations: WeaponAnimationSet;
  }) {
    this.name = options.name;
    this.speed = options.speed;
    this.distance = options.distance;
    this.damage = options.damage;
    this._price = options.price;
    this.animations = options.animations;
  }

  info(): DropInfo {
    return {
      name: this.name,
      speed: this.speed,
      distance: this.distance,
      damage: this.damage,
      sellPrice: this._price,
      buyPrice: this._price * 10,
    };
  }

  pickedUp(character: CharacterState): boolean {
    return character.inventory.add(this);
  }

  same(): boolean {
    return false;
  }

  use(cell: InventoryCell): void {
    cell.equip();
  }

  // static create(rng: RNG, level: number): Weapon | null {
  //   const available = weaponConfigs.filter(c => c.level <= level);
  //   if (available.length > 0) {
  //     const config = rng.select(available)!;
  //     return new Weapon(config);
  //   } else {
  //     return null;
  //   }
  // }

  // static select(rng: RNG, weapons: readonly WeaponConfig[]): Weapon | null {
  //   if (weapons.length > 0) {
  //     const config = rng.select(weapons)!;
  //     return new Weapon(config);
  //   } else {
  //     return null;
  //   }
  // }
}