import {SceneController} from "../scene";
import {Weapon, WeaponAnimation, WeaponAnimationSet} from "./Weapon";
import {DungeonMap} from "../dungeon";

interface WeaponConfig {
  readonly name: string;
  readonly speed: number;
  readonly distance: number;
  readonly damage: number;
  readonly stamina: number;
  readonly level: number;
  readonly price: number;
  readonly animations: WeaponAnimationConfig;
}

interface WeaponAnimationConfig {
  readonly idle: string;
  readonly run: string;
  readonly hit: string[];
}

interface WeaponsConfig {
  readonly animations: Partial<Record<string, WeaponAnimation>>;
  readonly weapons: {
    readonly hero: Partial<Record<string, WeaponConfig>>;
    readonly npc: Partial<Record<string, WeaponConfig>>;
    readonly monster: Partial<Record<string, WeaponConfig>>;
  };
}

export class WeaponManager {
  private readonly _controller: SceneController;
  private _config!: WeaponsConfig;

  constructor(controller: SceneController) {
    this._controller = controller;
  }

  init(): void {
    this._config = this._controller.loader.resources['weapon.config.json'].data;
  }

  animation(name: string): WeaponAnimation {
    const animation = this._config.animations[name];
    if (!animation) throw "Animation not found";
    return animation;
  }

  animations(config: WeaponAnimationConfig): WeaponAnimationSet {
    return {
      idle: this.animation(config.idle),
      run: this.animation(config.run),
      hit: config.hit.map(name => this.animation(name))
    }
  }

  weapon(config: WeaponConfig): Weapon {
    return new Weapon({
      name: config.name,
      speed: config.speed,
      distance: config.distance,
      damage: config.damage,
      stamina: config.stamina,
      level: config.level,
      price: config.price,
      animations: this.animations(config.animations),
    });
  }

  randomHeroWeapon(dungeon: DungeonMap): Weapon | null {
    const available = this.heroWeapons(dungeon.level);
    const config = dungeon.rng.select(available);
    if (config) {
      return this.weapon(config);
    } else {
      return null;
    }
  }

  heroWeapons(level: number): WeaponConfig[] {
    return Object.keys(this._config.weapons.hero)
      .map(name => this._config.weapons.hero[name]!)
      .filter(c => c.level <= level);
  }

  heroWeapon(name: string): Weapon {
    const config = this._config.weapons.hero[name];
    if (!config) throw `Hero weapon config not found: ${name}`;
    return this.weapon(config);
  }

  npcWeapon(name: string): Weapon {
    const config = this._config.weapons.npc[name];
    if (!config) throw `Npc weapon config not found: ${name}`;
    return this.weapon(config);
  }

  monsterWeapon(name: string): Weapon {
    const config = this._config.weapons.monster[name];
    if (!config) throw `Monster weapon config not found: ${name}`;
    return this.weapon(config);
  }
}