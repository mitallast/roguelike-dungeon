export class Coins {
  constructor() {
    const maxCoins = 30;
    this.tileName = "coin_anim";
    this.coins = Math.floor(Math.random() * (maxCoins - 1)) + 1;
  }

  pickedUp(hero) {
    hero.addCoins(this.coins);
    return true;
  };
}

export class HealthFlask {
  constructor() {
    this.tileName = "flask_red";
    this.health = 2;
  }
  pickedUp(hero) {
    return hero.inventory.add(this);

  };
  same(item) {
    return item instanceof HealthFlask;
  };
  use(hero) {
    hero.hill(this.health);
  };
}

export class HealthBigFlask {
  constructor() {
    this.tileName = "flask_big_red";
    this.health = 5;
  }
  pickedUp(hero) {
    return hero.inventory.add(this);
  };
  same(item) {
    return item instanceof HealthBigFlask;
  };
  use(hero) {
    hero.hill(this.health);
  };
}