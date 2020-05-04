/* eslint-disable @typescript-eslint/camelcase */
import {RNG} from "./rng";
import {Hero} from "./hero";
import {InventoryCell} from "./inventory";
import {Character} from "./character";
import {AnimationEvent, AnimationKeyFrame} from "./animation";

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

export interface WeaponAnimation {
  readonly angle: AnimationKeyFrame<[number]>[];
  readonly pos: AnimationEvent<[number, number]>[];
}

export interface WeaponAnimationSet {
  readonly idle: WeaponAnimation;
  readonly run: WeaponAnimation;
  readonly hit: WeaponAnimation;
}

interface WeaponAnimations {
  readonly knife: WeaponAnimationSet;
  readonly rusty_sword: WeaponAnimationSet;
  readonly regular_sword: WeaponAnimationSet;
  readonly red_gem_sword: WeaponAnimationSet;
  readonly hammer: WeaponAnimationSet;
  readonly big_hammer: WeaponAnimationSet;
  readonly baton_with_spikes: WeaponAnimationSet;
  readonly mace: WeaponAnimationSet;
  readonly katana: WeaponAnimationSet;
  readonly saw_sword: WeaponAnimationSet;
  readonly anime_sword: WeaponAnimationSet;
  readonly axe: WeaponAnimationSet;
  readonly machete: WeaponAnimationSet;
  readonly cleaver: WeaponAnimationSet;
  readonly duel_sword: WeaponAnimationSet;
  readonly knight_sword: WeaponAnimationSet;
  readonly golden_sword: WeaponAnimationSet;
  readonly lavish_sword: WeaponAnimationSet;
}

const basic: WeaponAnimationSet = {
  idle: {
    angle: [
      {time: 0, args: [0]},
    ],
    pos: [
      {time: 0, args: [-1, 0]},
      {time: 1, args: [-1, 1]},
      {time: 2, args: [-1, 2]},
      {time: 3, args: [-1, 1]},
    ]
  },
  run: {
    angle: [
      {time: 0, args: [0]}
    ],
    pos: [
      {time: 0, args: [-1, -1]},
      {time: 1, args: [-1, -2]},
      {time: 2, args: [-1, -1]},
      {time: 3, args: [-1, 0]},
    ]
  },
  hit: {
    angle: [
      {time: 0, args: [0]},
      {time: 1.5, args: [-30]},
      {time: 2, args: [120]},
      {time: 3, args: [90]},
      {time: 4, args: [0]},
    ],
    pos: [
      {time: 0, args: [-1, 0]},
      {time: 1, args: [-1, 0]},
      {time: 2, args: [-1, 0]},
      {time: 3, args: [-1, 0]},
    ]
  },
};

const weaponAnimations: WeaponAnimations = {
  knife: {
    idle: basic.idle,
    run: basic.run,
    hit: {
      angle: [
        {time: 0, args: [90]},
      ],
      pos: [
        {time: 0, args: [-8, -4]},
        {time: 1, args: [-4, -4]},
        {time: 2, args: [4, -4]},
        {time: 3, args: [-2, -4]},
      ]
    },
  },
  rusty_sword: basic,
  regular_sword: basic,
  red_gem_sword: basic,
  hammer: basic,
  big_hammer: basic,
  baton_with_spikes: basic,
  mace: basic,
  katana: basic,
  saw_sword: basic,
  anime_sword: basic,
  axe: basic,
  machete: basic,
  cleaver: basic,
  duel_sword: basic,
  knight_sword: basic,
  golden_sword: basic,
  lavish_sword: basic,
};

export interface WeaponConfig {
  readonly name: string;
  readonly speed: number;
  readonly distance: number;
  readonly damage: number;
  readonly level: number;
  readonly price: number;
  readonly animations: WeaponAnimationSet;
}

export interface Weapons extends Record<string, WeaponConfig> {
  readonly knife: WeaponConfig;
  readonly rusty_sword: WeaponConfig;
  readonly regular_sword: WeaponConfig;
  readonly red_gem_sword: WeaponConfig;
  readonly hammer: WeaponConfig;
  readonly big_hammer: WeaponConfig;
  readonly baton_with_spikes: WeaponConfig;
  readonly mace: WeaponConfig;
  readonly katana: WeaponConfig;
  readonly saw_sword: WeaponConfig;
  readonly anime_sword: WeaponConfig;
  readonly axe: WeaponConfig;
  readonly machete: WeaponConfig;
  readonly cleaver: WeaponConfig;
  readonly duel_sword: WeaponConfig;
  readonly knight_sword: WeaponConfig;
  readonly golden_sword: WeaponConfig;
  readonly lavish_sword: WeaponConfig;
}

export const weapons: Weapons = {
  knife: {
    name: "weapon_knife",
    speed: 1.4,
    distance: 1,
    damage: 2,
    level: 1,
    price: 12,
    animations: weaponAnimations.knife
  },
  rusty_sword: {
    name: "weapon_rusty_sword",
    speed: 1.0,
    distance: 1,
    damage: 4,
    level: 1,
    price: 15,
    animations: weaponAnimations.rusty_sword
  },
  regular_sword: {
    name: "weapon_regular_sword",
    speed: 1.0,
    distance: 1,
    damage: 5,
    level: 3,
    price: 20,
    animations: weaponAnimations.regular_sword
  },
  red_gem_sword: {
    name: "weapon_red_gem_sword",
    speed: 1.0,
    distance: 1,
    damage: 6,
    level: 3,
    price: 30,
    animations: weaponAnimations.red_gem_sword
  },
  hammer: {
    name: "weapon_hammer",
    speed: 0.7,
    distance: 1,
    damage: 7,
    level: 5,
    price: 38,
    animations: weaponAnimations.hammer
  },
  big_hammer: {
    name: "weapon_big_hammer",
    speed: 0.5,
    distance: 2,
    damage: 10,
    level: 5,
    price: 40,
    animations: weaponAnimations.big_hammer
  },
  baton_with_spikes: {
    name: "weapon_baton_with_spikes",
    speed: 0.6,
    distance: 1,
    damage: 7,
    level: 5,
    price: 42,
    animations: weaponAnimations.baton_with_spikes
  },
  mace: {
    name: "weapon_mace",
    speed: 0.6,
    distance: 1,
    damage: 7,
    level: 5,
    price: 45,
    animations: weaponAnimations.mace
  },
  katana: {
    name: "weapon_katana",
    speed: 1.5,
    distance: 1,
    damage: 8,
    level: 7,
    price: 100,
    animations: weaponAnimations.katana
  },
  saw_sword: {
    name: "weapon_saw_sword",
    speed: 1.5,
    distance: 1,
    damage: 9,
    level: 7,
    price: 110,
    animations: weaponAnimations.saw_sword
  },
  anime_sword: {
    name: "weapon_anime_sword",
    speed: 0.7,
    distance: 1,
    damage: 12,
    level: 7,
    price: 130,
    animations: weaponAnimations.anime_sword
  },
  axe: {
    name: "weapon_axe",
    speed: 0.8,
    distance: 1,
    damage: 12,
    level: 7,
    price: 115,
    animations: weaponAnimations.axe
  },
  machete: {
    name: "weapon_machete",
    speed: 1.0,
    distance: 1,
    damage: 11,
    level: 9,
    price: 150,
    animations: weaponAnimations.machete
  },
  cleaver: {
    name: "weapon_cleaver",
    speed: 1.0,
    distance: 1,
    damage: 12,
    level: 9,
    price: 160,
    animations: weaponAnimations.cleaver
  },
  duel_sword: {
    name: "weapon_duel_sword",
    speed: 1.5,
    distance: 1,
    damage: 13,
    level: 9,
    price: 170,
    animations: weaponAnimations.duel_sword
  },
  knight_sword: {
    name: "weapon_knight_sword",
    speed: 1.5,
    distance: 1,
    damage: 14,
    level: 9,
    price: 180,
    animations: weaponAnimations.knight_sword
  },
  golden_sword: {
    name: "weapon_golden_sword",
    speed: 1.5,
    distance: 1,
    damage: 15,
    level: 11,
    price: 220,
    animations: weaponAnimations.golden_sword
  },
  lavish_sword: {
    name: "weapon_lavish_sword",
    speed: 1.5,
    distance: 1,
    damage: 16,
    level: 11,
    price: 240,
    animations: weaponAnimations.lavish_sword
  },
};

export const weaponConfigs: readonly WeaponConfig[] = Object.getOwnPropertyNames(weapons).map(w => weapons[w]);

export interface MonsterWeapons extends Record<string, WeaponConfig> {
  readonly knife: WeaponConfig;
  readonly baton_with_spikes: WeaponConfig;
  readonly anime_sword: WeaponConfig;
  readonly big_hammer: WeaponConfig;
  readonly mace: WeaponConfig;
  readonly cleaver: WeaponConfig;
}

export const monsterWeapons: MonsterWeapons = {
  knife: {
    name: "weapon_knife",
    speed: 0.7,
    distance: 1,
    damage: 0.5,
    level: 1,
    price: 0,
    animations: weaponAnimations.knife
  },
  baton_with_spikes: {
    name: "weapon_baton_with_spikes",
    speed: 0.3,
    distance: 1,
    damage: 3,
    level: 5,
    price: 0,
    animations: weaponAnimations.baton_with_spikes
  },
  anime_sword: {
    name: "weapon_anime_sword",
    speed: 0.4,
    distance: 1,
    damage: 4,
    level: 10,
    price: 0,
    animations: weaponAnimations.anime_sword
  },
  big_hammer: {
    name: "weapon_big_hammer",
    speed: 0.3,
    distance: 2,
    damage: 5,
    level: 15,
    price: 0,
    animations: weaponAnimations.big_hammer
  },
  mace: {
    name: "weapon_mace",
    speed: 0.6,
    distance: 1,
    damage: 6,
    level: 20,
    price: 0,
    animations: weaponAnimations.mace
  },
  cleaver: {
    name: "weapon_cleaver",
    speed: 0.5,
    distance: 1,
    damage: 7,
    level: 25,
    price: 0,
    animations: weaponAnimations.cleaver
  },
};

export interface NpcWeapons extends Record<string, WeaponConfig> {
  readonly knife: WeaponConfig;
  readonly hammer: WeaponConfig;
  readonly cleaver: WeaponConfig;
  readonly axe: WeaponConfig;
  readonly regular_sword: WeaponConfig;
  readonly knight_sword: WeaponConfig;
}

export const npcWeapons: NpcWeapons = {
  knife: {
    name: "weapon_knife",
    speed: 1.4,
    distance: 1,
    damage: 2,
    level: 1,
    price: 12,
    animations: weaponAnimations.knife
  },
  hammer: {
    name: "weapon_hammer",
    speed: 0.7,
    distance: 1,
    damage: 7,
    level: 5,
    price: 38,
    animations: weaponAnimations.hammer
  },
  cleaver: {
    name: "weapon_cleaver",
    speed: 1.0,
    distance: 1,
    damage: 12,
    level: 9,
    price: 160,
    animations: weaponAnimations.cleaver
  },
  axe: {
    name: "weapon_axe",
    speed: 0.8,
    distance: 1,
    damage: 12,
    level: 7,
    price: 115,
    animations: weaponAnimations.axe
  },
  regular_sword: {
    name: "weapon_regular_sword",
    speed: 1.0,
    distance: 1,
    damage: 5,
    level: 3,
    price: 20,
    animations: weaponAnimations.regular_sword
  },
  knight_sword: {
    name: "weapon_knight_sword",
    speed: 1.5,
    distance: 1,
    damage: 14,
    level: 9,
    price: 180,
    animations: weaponAnimations.knight_sword
  },
}

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