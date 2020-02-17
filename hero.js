import {Inventory} from "./inventory.js";

export const heroMonsterNames = [
  "elf_f",
  "elf_m",
  "knight_f",
  "knight_m",
  "wizard_f",
  "wizard_m",
];
export function HeroMonster(registry, joystick, x, y, name, weapon, time) {
  this.registry = registry;
  this.joystick = joystick;
  this.x = x;
  this.y = y;
  this.new_x = x;
  this.new_y = y;
  this.is_left = false;
  this.name = name;
  this.healthMax = 30;
  this.health = this.healthMax;
  this.coins = 0;
  this.damage = 5;
  this.dead = false;
  this.weapon = weapon;
  this.speed = 100;
  this.inventory = new Inventory();
  this.setAnimation("idle", time);
}
HeroMonster.prototype.setLevel = function(level) {
  this.level = level;
};
HeroMonster.prototype.setAnimation = function(state, time) {
  if(!this.dead) {
    switch (state) {
      case "idle":
        this.state = "idle";
        this.tileName = this.name + "_idle_anim";
        this.tile = this.registry.get(this.tileName);
        this.frame = 0;
        this.start = time;
        break;
      case "run":
        this.state = "run";
        this.tileName = this.name + "_run_anim";
        this.tile = this.registry.get(this.tileName);
        this.frame = 0;
        this.start = time;
        break;
      case "hit":
        this.state = "hit";
        this.tileName = this.name + "_hit_anim";
        this.tile = this.registry.get(this.tileName);
        this.frame = 0;
        this.weapon.frame = 0;
        this.start = time;
        break;
    }
  }
};
HeroMonster.prototype.animate = function(time) {
  switch (this.state) {
    case "idle":
      this.frame = Math.floor((time - this.start) / this.speed);
      if(!this.action(time)) {
        if(this.frame >= this.tile.numOfFrames) {
          this.setAnimation("idle", time);
        }
      }
      break;
    case "run":
      this.frame = Math.floor((time - this.start) / this.speed);
      if(this.frame >= this.tile.numOfFrames) {
        // this.frame = this.frame % this.tile.numOfFrames;
        this.level.monsters[this.y][this.x] = false;
        this.level.monsters[this.new_y][this.new_x] = this;
        this.x = this.new_x;
        this.y = this.new_y;
        this.scanDrop();
        if(!this.action(time)) {
          this.setAnimation("idle", time);
        }
      }
      break;
    case "hit":
      this.weapon.frame = Math.floor((time - this.start) / this.weapon.speed);
      if(this.weapon.frame >= this.weapon.numOfFrames) {
        this.scanHit(time);
        this.scanDrop();
        if(!this.action(time)) {
          this.setAnimation("idle", time);
        }
      }
      break;
  }
};
HeroMonster.prototype.action = function(time) {
  this.scanDrop();
  for(let d=0; d<10; d++) {
    const digit = `digit${(d + 1) % 10}`;
    if(!this.joystick[digit].processed) {
      this.joystick[digit].processed = true;
      this.inventory.cells[d].use(this);
    }
  }

  if(this.joystick.hit.triggered && !this.joystick.hit.processed) {
    if(this.level.floor[this.y][this.x] === "floor_ladder") {
      this.joystick.hit.processed = true;
      this.level.exit(time);
      return true;
    } else {
      this.setAnimation("hit", time);
      return true;
    }
  }
  if(this.joystick.moveUp.triggered || !this.joystick.moveUp.processed) {
    this.joystick.moveUp.processed = true;
    if(this.move(0, -1, time)) {
      return true;
    }
  }
  if(this.joystick.moveDown.triggered || !this.joystick.moveDown.processed) {
    this.joystick.moveDown.processed = true;
    if(this.move(0, 1, time)) {
      return true;
    }
  }
  if(this.joystick.moveLeft.triggered || !this.joystick.moveLeft.processed) {
    this.joystick.moveLeft.processed = true;
    this.is_left = true;
    if(this.move(-1, 0, time)) {
      return true;
    }
  }
  if(this.joystick.moveRight.triggered || !this.joystick.moveRight.processed) {
    this.joystick.moveRight.processed = true;
    this.is_left = false;
    if(this.move(1, 0, time)) {
      return true;
    }
  }
  return false;
};
HeroMonster.prototype.scanDrop = function() {
  if(this.level.drop[this.y][this.x]) {
    const drop = this.level.drop[this.y][this.x];
    if(drop.pickedUp(this)) {
      this.level.drop[this.y][this.x] = false;
    }
  }
};
HeroMonster.prototype.scanHit = function(time) {
  const max_distance = this.weapon.distance;
  // search only left or right path
  const scan_x_min = this.is_left ? Math.max(0, this.x - max_distance) : this.x;
  const scan_x_max = this.is_left ? this.x : Math.min(this.level.w, this.x + max_distance);

  const scan_y_min = Math.max(0, this.y - max_distance);
  const scan_y_max = Math.min(this.level.h, this.y + max_distance);

  for(let s_y = scan_y_min; s_y <= scan_y_max; s_y++) {
    for(let s_x = scan_x_min; s_x <= scan_x_max; s_x++) {
      // not self
      if(!(s_x === this.x && s_y === this.y)) {
        const monster = this.level.monsters[s_y][s_x];
        if(typeof monster === "object") {
          monster.hitDamage(this.damage, this.name, time);
        }
      }
    }
  }
};
HeroMonster.prototype.move = function (d_x, d_y, time) {
  if(!this.dead && this.state === "idle") {
    const new_x = this.x + d_x;
    const new_y = this.y + d_y;

    // check is floor exists
    if(!this.level.floor[new_y][new_x]) return false;

    // check is no monster
    if(this.level.monsters[new_y][new_x]) return false;

    // start move animation
    this.level.monsters[new_y][new_x] = true; // mark as used
    this.new_x = new_x;
    this.new_y = new_y;
    this.setAnimation("run", time);
    return true;
  }
  return false;
};
HeroMonster.prototype.resetPosition = function(x, y) {
  this.x = x;
  this.y = y;
  this.new_x = x;
  this.new_y = y;
};
HeroMonster.prototype.hitDamage = function (damage, name, time) {
  if(!this.dead) {
    this.level.log.push(`${this.name} damaged ${damage} by ${name}`);
    this.health = Math.max(0, this.health - damage);
    if(this.health <= 0) {
      this.level.log.push(`${this.name} killed by ${name}`);
      this.setAnimation("idle", time);
      this.dead = true;
    }
  }
};
HeroMonster.prototype.hill = function (health) {
  this.health = Math.min(this.healthMax, this.health + health);
};
HeroMonster.prototype.addCoins = function (coins) {
  this.coins = this.coins + coins;
};

export const weaponNames = [
  "weapon_knife",
  "weapon_rusty_sword",
  "weapon_regular_sword",
  "weapon_red_gem_sword",
  "weapon_big_hammer",
  "weapon_hammer",
  "weapon_baton_with_spikes",
  "weapon_mace",
  "weapon_katana",
  "weapon_saw_sword",
  "weapon_anime_sword",
  "weapon_axe",
  "weapon_machete",
  "weapon_cleaver",
  "weapon_duel_sword",
  "weapon_knight_sword",
  "weapon_golden_sword",
  "weapon_lavish_sword",
  "weapon_red_magic_staff",
  "weapon_green_magic_staff",
];
export function Weapon(registry, tileName) {
  this.tileName = tileName;
  this.tile = registry.get(this.tileName);
  this.frame = 0;
  this.numOfFrames = 4;
  this.speed = 100;
  this.distance = 1;
}