export const tinyMonsterNames = [
  "tiny_zombie",
  "goblin",
  "imp",
  "skeleton",
  "muddy",
  "swampy",
  "zombie",
  "ice_zombie",
];

export function TinyMonster(registry, level, x, y, name, time) {
  this.registry = registry;
  this.level = level;
  this.x = x;
  this.y = y;
  this.new_x = x;
  this.new_y = y;
  this.is_left = false;
  this.name = name;
  this.healthMax = 10;
  this.health = this.healthMax;
  this.damage = 1;
  this.luck = 0.5;
  this.speed = 100;
  this.setAnimation("idle", time);
}
TinyMonster.prototype.setAnimation = async function(state, time) {
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
  }
};
TinyMonster.prototype.animate = function(time) {
  this.frame = Math.floor((time - this.start) / this.speed);
  if(this.frame >= this.tile.numOfFrames) {
    if(this.state === "run") {
      // console.log("finish run animation");
      this.level.monsters[this.y][this.x] = false;
      this.level.monsters[this.new_y][this.new_x] = this;
      this.x = this.new_x;
      this.y = this.new_y;
    }

    this.setAnimation("idle", time);

    // search hero near
    const max_distance = 3;
    const scan_x_min = Math.max(0, this.x - max_distance);
    const scan_y_min = Math.max(0, this.y - max_distance);
    const scan_x_max = Math.min(this.level.w, this.x + max_distance);
    const scan_y_max = Math.min(this.level.h, this.y + max_distance);

    const is_hero_near = !this.level.hero.dead
      && this.level.hero.x >= scan_x_min && this.level.hero.x <= scan_x_max
      && this.level.hero.y >= scan_y_min && this.level.hero.y <= scan_y_max;

    // console.log("hero is near", scan_x_min, scan_x_max, scan_y_min, scan_y_max);

    if(is_hero_near) {
      const dist_x = Math.abs(this.x - this.level.hero.x);
      const dist_y = Math.abs(this.y - this.level.hero.y);

      if(dist_x > 1) {
        const move_x = Math.max(-1, Math.min(1, this.level.hero.x - this.x));
        if(this.move(move_x, 0, time)) {
          console.log("move to hero x");
          return;
        }
      }
      if(dist_y > 0) {
        const move_y = Math.max(-1, Math.min(1, this.level.hero.y - this.y));
        if(this.move(0, move_y, time)) {
          console.log("move to hero y");
          return;
        }
      }

      if(dist_x  <= 1 && dist_y <= 1 && Math.random() < this.luck) {
        this.level.hero.hitDamage(this.damage, this.name, time);
        return;
      }
    }

    // random move ?
    const random_move_percent = 0.1;
    if(Math.random() < random_move_percent) {
      const move_x = Math.floor(Math.random() * 3 - 1);
      const move_y = Math.floor(Math.random() * 3 - 1);
      // console.log("random move", move_x, move_y);
      if(this.move(move_x, move_y, time)){
        return;
      }
    }
  }
};
TinyMonster.prototype.move = function (d_x, d_y, time) {
  this.is_left = d_x < 0;
  if(this.state === "idle") {
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
TinyMonster.prototype.hitDamage = function (damage, name, time) {
  this.level.log.push(`${this.name} damaged ${damage} by ${name}`);
  this.health = Math.max(0, this.health - damage);
  if(this.health <= 0) {
    this.level.log.push(`${this.name} killed by ${name}`);
    this.level.monsters[this.y][this.x] = false;
    this.level.monsters[this.new_y][this.new_x] = false;
    this.level.monsterList = this.level.monsterList.filter(s => s !== this);
    if(Math.random() < this.luck) {
      this.level.randomDrop(this.x, this.y);
    }
  }
};