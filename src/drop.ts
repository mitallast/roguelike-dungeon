import {RNG} from "./rng";
import {HeroMonster} from "./hero";
import {Tile, TileRegistry} from "./tilemap";

export interface Drop {
  readonly tile: Tile
  pickedUp(hero: HeroMonster): boolean;
}

export interface UsableDrop extends Drop {
  same(item: UsableDrop): boolean;
  use(hero: HeroMonster): void;
}

export class Coins implements Drop {
  readonly tile: Tile;
  private readonly coins: number;

  constructor(rng: RNG, registry: TileRegistry) {
    this.tile = registry.get("coin_anim");
    this.coins = rng.nextRange(1, 30)
  }

  pickedUp(hero: HeroMonster): boolean {
    hero.addCoins(this.coins);
    return true;
  };
}

export class HealthFlask implements UsableDrop {
  readonly tile: Tile;
  private readonly health: number;

  constructor(registry: TileRegistry) {
    this.tile = registry.get("flask_red");
    this.health = 2;
  }

  pickedUp(hero: HeroMonster): boolean {
    return hero.inventory.add(this);

  };

  same(item: UsableDrop): boolean {
    return item instanceof HealthFlask;
  };

  use(hero: HeroMonster) {
    hero.hill(this.health);
  };
}

export class HealthBigFlask implements UsableDrop {
  readonly tile: Tile;
  private readonly health: number;

  constructor(registry: TileRegistry) {
    this.tile = registry.get("flask_big_red");
    this.health = 5;
  }

  pickedUp(hero: HeroMonster): boolean {
    return hero.inventory.add(this);
  };

  same(item: UsableDrop): boolean {
    return item instanceof HealthBigFlask;
  };

  use(hero: HeroMonster) {
    hero.hill(this.health);
  };
}