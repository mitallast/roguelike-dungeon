import {Hero} from "../hero";
import {InventoryCell} from "../inventory";
import {RNG} from "../rng";
import {DropInfo, UsableDrop} from "./Drop";
import {WeaponAnimationSet} from "./WeaponAnimation";
import {WeaponConfig, weaponConfigs} from "./WeaponConfig";

// Анимация Алебарды

// Анимация рубящего удара:
// 1) замах с нацеливанием - 9 кадров
// 2) окончательный замах  - 3 кадра
// 3) рубящий удар         - 4 кадра
// 4) возврат на изготовку - 9 кадров

// Анимация колящего удара
// 1) отвод с нацеливанием - 4 кадра
// 2) ожидание             - 4 кадра
// 3) окончательный замах  - 1 кадр
// 4) удар с шлейфом       - 2 кадра
// 5) отвод                - 6 кадров
// 6) возврат на изготовку - 3 кадра

export class Weapon implements UsableDrop {
  private readonly _name: string;
  readonly speed: number;
  readonly animations: WeaponAnimationSet;
  readonly distance: number;
  readonly damage: number;
  private readonly _price: number;

  get spriteName(): string {
    return this._name + ".png";
  }

  constructor(config: WeaponConfig) {
    this._name = config.name;
    this.speed = config.speed;
    this.distance = config.distance;
    this.damage = config.damage;
    this._price = config.price;
    this.animations = config.animations;
  }

  info(): DropInfo {
    return {
      name: this._name.replace(/weapon_/, ''),
      speed: this.speed,
      distance: this.distance,
      damage: this.damage,
      sellPrice: this._price,
      buyPrice: this._price * 10,
    };
  }

  pickedUp(hero: Hero): boolean {
    return hero.inventory.add(this);
  }

  same(): boolean {
    return false;
  }

  use(cell: InventoryCell): void {
    cell.equip();
  }

  static create(rng: RNG, level: number): Weapon | null {
    const available = weaponConfigs.filter(c => c.level <= level);
    if (available.length > 0) {
      const config = rng.select(available)!;
      return new Weapon(config);
    } else {
      return null;
    }
  }

  static select(rng: RNG, weapons: readonly WeaponConfig[]): Weapon | null {
    if (weapons.length > 0) {
      const config = rng.select(weapons)!;
      return new Weapon(config);
    } else {
      return null;
    }
  }
}