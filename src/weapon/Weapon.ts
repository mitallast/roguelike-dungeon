import {InventoryCell} from "../inventory";
import {DropInfo, UsableDrop} from "../drop";
import {CharacterState} from "../characters/CharacterState";
import {AnimationEventFrame} from "../animation";

export interface WeaponAnimation {
  readonly smoothly: boolean;
  readonly angle: readonly AnimationEventFrame<[number]>[];
  readonly trail: readonly AnimationEventFrame<[number, number]>[];
  readonly pos: readonly AnimationEventFrame<[number, number]>[];
}

export interface WeaponAnimationSet {
  readonly idle: WeaponAnimation;
  readonly run: WeaponAnimation;
  readonly hit: WeaponAnimation[];
}

export class Weapon implements UsableDrop {
  readonly name: string;
  readonly speed: number;
  readonly animations: WeaponAnimationSet;
  readonly distance: number;
  readonly damage: number;
  readonly stamina: number;
  private readonly _price: number;

  get spriteName(): string {
    return `weapon_${this.name}.png`;
  }

  get slashTexture(): string {
    return `w_slash_${this.name}.png`;
  }

  constructor(options: {
    name: string;
    speed: number;
    distance: number;
    damage: number;
    stamina: number;
    level: number;
    price: number;
    animations: WeaponAnimationSet;
  }) {
    this.name = options.name;
    this.speed = options.speed;
    this.distance = options.distance;
    this.damage = options.damage;
    this.stamina = options.stamina;
    this._price = options.price;
    this.animations = options.animations;
  }

  info(): DropInfo {
    return {
      name: this.name,
      speed: this.speed,
      distance: this.distance,
      stamina: this.stamina,
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
}