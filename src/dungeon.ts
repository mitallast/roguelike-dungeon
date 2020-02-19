import {Joystick} from "./input";
import {Tile, TileRegistry} from "./tilemap";
import {HeroMonster} from "./hero";
import {Level} from "./level";
import {RNG} from "./rng";
import {Monster, MonsterState, MovingMonsterWrapper} from "./monster";
import {WeaponConfig} from "./drop";
import {Render} from "./render";
import {Scene, SceneController} from "./scene";

const scale = 2;

export class DungeonScene implements Scene {
  private level: Level;
  private controller: SceneController;

  constructor(rng: RNG, joystick: Joystick, registry: TileRegistry, controller: SceneController) {
    this.controller = controller;
    const start = new Date().getTime();
    const hero_weapon = WeaponConfig.configs[0].create(registry);
    const hero = new HeroMonster(registry, joystick, 0, 0, "knight_f", hero_weapon, start);
    this.level = new Level(rng, registry, this, hero, 1, start);
  }

  setLevel(level: Level) {
    this.level = level;
  }

  render(render: Render) {
    const time = new Date().getTime();
    this.level.animate(time);
    this.renderLevel(render, time);
    this.renderHUD(render, time);
  }

  renderLevel(render: Render, time: number) {
    const c_w = render.canvas.width;
    const c_h = render.canvas.height;
    render.buffer.width = c_w;
    render.buffer.height = c_h;

    render.ctx.save();
    render.ctx.fillStyle = "rgb(34,34,34)";
    render.ctx.fillRect(0, 0, c_w, c_h);

    render.b_ctx.save();
    render.b_ctx.fillStyle = "black";
    render.b_ctx.fillRect(0, 0, c_w, c_h);
    render.b_ctx.globalCompositeOperation = "lighter";

    // render hero light
    this.renderLight(render, c_w >> 1, c_h >> 1, 16 * scale * 6);

    let t_x = this.level.hero.x * 16 * scale + 8 - c_w / 2;
    let t_y = this.level.hero.y * 16 * scale + 8 - c_h / 2;

    // translate level to hero position
    if (this.level.hero.state === MonsterState.Run) {
      const start = this.level.hero.start;
      const speed = this.level.hero.speed;
      const numOfFrames = this.level.hero.tile.numOfFrames;
      const maxTime = speed * numOfFrames;
      const delta = Math.min(maxTime, time - start) / maxTime;

      const t_offset_x = scale * 16 * (this.level.hero.new_x - this.level.hero.x) * delta;
      const t_offset_y = scale * 16 * (this.level.hero.new_y - this.level.hero.y) * delta;

      t_x = t_x + t_offset_x;
      t_y = t_y + t_offset_y;
    }

    // render floor, drop
    for (let l_x = 0; l_x < this.level.w; l_x++) {
      for (let l_y = 0; l_y < this.level.h; l_y++) {
        const d_x = -t_x + l_x * 16 * scale;
        const d_y = -t_y + l_y * 16 * scale;
        this.renderTile(render, this.level.floor[l_y][l_x], d_x, d_y, time);
        if (this.level.drop[l_y][l_x]) {
          this.renderTile(render, this.level.drop[l_y][l_x].tile, d_x, d_y, time);
        }
      }
    }
    // render wall, monsters
    for (let l_y = 0; l_y < this.level.h; l_y++) {
      for (let l_x = 0; l_x < this.level.w; l_x++) {
        const d_x = -t_x + l_x * 16 * scale;
        const d_y = -t_y + l_y * 16 * scale;
        const tile = this.level.wall[l_y][l_x];
        if (tile) {
          this.renderTile(render, tile, d_x, d_y, time);
          if (tile.name === "wall_fountain_mid_red_anim" || tile.name === "wall_fountain_mid_blue_anim") {
            this.renderLight(render, d_x + 8 * scale, d_y + 8 * scale, 16 * scale * 4);
          }
        }
      }
      if (l_y < this.level.h - 1) {
        for (let l_x = 0; l_x < this.level.w; l_x++) {
          const m_y = l_y + 1;
          const d_x = -t_x + l_x * 16 * scale;
          const d_y = -t_y + m_y * 16 * scale;
          this.renderMonster(render, this.level.monsters[m_y][l_x], d_x, d_y, time);
        }
      }
    }

    render.ctx.restore();

    render.ctx.save();
    render.ctx.globalAlpha = 0.8;
    render.ctx.globalCompositeOperation = "multiply";
    render.ctx.drawImage(render.buffer, 0, 0);
    render.ctx.restore();
  }

  renderLight(render: Render, x: number, y: number, radius: number) {
    const diameter = radius << 1;
    const box_x = x - radius;
    const box_y = y - radius;

    const grd = render.b_ctx.createRadialGradient(x, y, 16, x, y, radius);
    grd.addColorStop(0.5, "rgb(255,255,255)");
    grd.addColorStop(1, "transparent");
    render.b_ctx.fillStyle = grd;
    render.b_ctx.fillRect(box_x, box_y, diameter, diameter);
  }

  renderHUD(render: Render, time: number) {
    this.renderHealth(render, time);
    this.renderLevelTitle(render, time);
    this.renderYouDead(render, time);
    this.renderInventory(render, time);
  }

  renderHealth(render: Render, time: number) {
    const border = 4;
    const height = 20;
    const point_w = 10;
    const h_m = this.level.hero.healthMax;
    const h = this.level.hero.health;

    // render HUD - hero health
    render.ctx.save();
    render.ctx.translate(40, 40);

    // background
    render.ctx.fillStyle = "rgb(0,0,0)";
    render.ctx.fillRect(0, 0, border * 2 + point_w * h_m, border * 2 + height);

    // health red line
    render.ctx.fillStyle = "rgb(255,0,0)";
    render.ctx.fillRect(border, border, point_w * h, height);

    // health points text
    render.ctx.fillStyle = "rgb(255,255,255)";
    render.ctx.font = "20px silkscreennormal";
    render.ctx.fillText(h.toString(), border * 2, border + 16);

    // coins text
    render.ctx.fillText(`$${this.level.hero.coins}`, 0, 50);

    render.ctx.restore();
  }

  renderLevelTitle(render: Render, time: number) {
    const c_w = render.canvas.width;
    const c_h = render.canvas.height;

    // render HUD - level
    render.ctx.save();
    render.ctx.translate(c_w / 2, 60);
    render.ctx.fillStyle = "rgb(255,255,255)";
    render.ctx.textAlign = "center";
    render.ctx.font = "20px silkscreennormal";
    render.ctx.fillText(`level ${this.level.level}`, 0, 0);
    render.ctx.restore();

    // render HUD - boss health
    if (this.level.boss) {
      render.ctx.save();
      render.ctx.translate(c_w / 2, 100);

      const border = 4;
      const height = 20;
      const max_width = 500;

      const h_m = this.level.boss.healthMax;
      const h = this.level.boss.health;

      const point_w = Math.min(10, Math.floor(max_width / h_m));

      // background
      const b_w = border * 2 + point_w * h_m;
      render.ctx.fillStyle = "rgb(0,0,0)";
      render.ctx.fillRect(-(b_w >> 1), 0, b_w, border * 2 + height);

      // health red line
      const h_w = point_w * h;
      render.ctx.fillStyle = "rgb(255,0,0)";
      render.ctx.fillRect(border - ((point_w * h_m) >> 1), border, h_w, height);

      // health points text
      render.ctx.fillStyle = "rgb(255,255,255)";
      render.ctx.font = "20px silkscreennormal";
      render.ctx.fillText(`${this.level.boss.name} - ${h}`, border * 2 - ((point_w * h_m) >> 1), border + 16);
      render.ctx.restore();
    }

    // render HUD - log info
    this.level.log = this.level.log.slice(-5);
    render.ctx.save();
    render.ctx.translate(40, c_h - 100);
    for (let i = 0; i < this.level.log.length; i++) {
      render.ctx.fillStyle = "rgb(255,255,255)";
      render.ctx.font = "20px silkscreennormal";
      render.ctx.fillText(this.level.log[i], 0, i * 20);
    }
    render.ctx.restore();
  }

  renderYouDead(render: Render, time: number) {
    const c_w = render.canvas.width;
    const c_h = render.canvas.height;

    if (this.level.hero.dead) {
      render.ctx.save();

      render.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      render.ctx.fillRect(0, 0, c_w, c_h);

      render.ctx.translate(c_w / 2, c_h / 2);

      render.ctx.fillStyle = "rgb(255,0,0)";
      render.ctx.textAlign = "center";
      render.ctx.font = "200px silkscreennormal";
      render.ctx.fillText("YOU DIED", 0, 0);
      render.ctx.restore();
    }
  }

  renderInventory(render: Render, time: number) {
    const c_w = render.canvas.width;
    const c_h = render.canvas.height;

    const cells = this.level.hero.inventory.cells;
    const cell_size = 16;
    const grid_w = cells.length;
    const grid_spacing = 2;

    const inv_w = scale * (grid_w * (cell_size + grid_spacing) + grid_spacing);
    const inv_h = scale * (cell_size + grid_spacing + grid_spacing);

    render.ctx.save();
    render.ctx.translate((c_w >> 1) - (inv_w >> 1), c_h - inv_h - 40);

    // background
    render.ctx.fillStyle = "rgb(100,100,100)";
    render.ctx.fillRect(0, 0, inv_w, inv_h);

    render.ctx.translate(grid_spacing * scale, grid_spacing * scale); // grid spacing

    for (let g_x = 0; g_x < grid_w; g_x++) {
      const c_x = scale * (g_x * (cell_size + grid_spacing));
      const c_y = 0;

      render.ctx.fillStyle = "rgb(70,70,70)";
      render.ctx.fillRect(c_x, 0, cell_size * scale, cell_size * scale);
      const cell = cells[g_x];
      if (cell.item) {
        const tile = cell.item.tile;
        let sx = tile.x;
        const sy = tile.y;
        const sw = tile.w;
        const sh = tile.h;

        if (tile.isAnim && tile.numOfFrames > 1) {
          const sf = Math.floor(time / 100) % tile.numOfFrames;
          sx = tile.x + sw * sf;
        }

        const d_scale = sh <= cell_size ? 1 : cell_size / sh;
        const dw = sw * scale * d_scale;
        const dh = sh * scale * d_scale;
        const c_offset_x = ((cell_size * scale) >> 1) - (dw >> 1);

        render.ctx.drawImage(tile.tileSet, sx, sy, sw, sh, c_x + c_offset_x, c_y, dw, dh);
        render.ctx.textAlign = "end";
        render.ctx.textBaseline = "top";
        render.ctx.font = "10px silkscreennormal";
        render.ctx.fillStyle = "rgb(255,255,255)";
        render.ctx.fillText(cell.count.toString(), c_x + (cell_size * scale), 0, cell_size * scale);
      }
    }
    render.ctx.restore();
  }

  renderMonster(render: Render, monster: Monster, dx: number, dy: number, time: number) {
    if (monster && !(monster instanceof MovingMonsterWrapper)) {
      const sw = monster.tile.w;
      const sh = monster.tile.h;
      const sx = monster.tile.x + sw * monster.frame;
      const sy = monster.tile.y;
      const dw = sw * scale;
      const dh = sh * scale;

      const tile_offset_y = dh - 14 * scale;

      let offset_x = 0;
      let offset_y = 0;

      if (monster.state === MonsterState.Run) {
        const start = monster.start;
        const speed = monster.speed;
        const numOfFrames = monster.tile.numOfFrames;
        const maxTime = speed * numOfFrames;
        const delta = Math.min(maxTime, time - start) / maxTime;

        offset_x = scale * 16 * (monster.new_x - monster.x) * delta;
        offset_y = scale * 16 * (monster.new_y - monster.y) * delta;
      }

      if (dx + offset_x + dw > 0 && dx + offset_x < render.canvas.width &&
        dy + offset_y + dh > 0 && dy + offset_y < render.canvas.height) {


        render.ctx.save();
        render.ctx.translate(dx + offset_x, dy + offset_y);
        if (monster.is_left) {
          render.ctx.scale(-1, 1);
          if (monster.weapon) {
            render.ctx.save();
            const w = monster.weapon.tile;
            const w_dw = w.w * scale;
            const w_dh = w.h * scale;

            const w_dy = w_dh - 14 * scale;
            const w_dx = 4 * scale;

            render.ctx.translate(-w_dx, -w_dy);

            if (monster.state === MonsterState.Hit) {
              let angle = 90 * monster.weapon.frame / (monster.weapon.numOfFrames - 1);
              render.ctx.translate(w_dw >> 1, w_dh); // to bottom center of tile
              render.ctx.rotate(angle * Math.PI / 180); // 90 degree
              render.ctx.drawImage(w.tileSet, w.x, w.y, w.w, w.h, -(w_dw >> 1), -w_dh, w_dw, w_dh);
            } else {
              render.ctx.drawImage(w.tileSet, w.x, w.y, w.w, w.h, 0, 0, w_dw, w_dh);
            }
            render.ctx.restore();
          }
          render.ctx.drawImage(monster.tile.tileSet, sx, sy, sw, sh, 0 - dw, -tile_offset_y, dw, dh);
        } else {
          if (monster.weapon) {
            render.ctx.save();
            const w = monster.weapon.tile;
            const w_dw = w.w * scale;
            const w_dh = w.h * scale;

            const w_dy = w_dh - 14 * scale;
            const w_dx = 12 * scale;

            render.ctx.translate(w_dx, -w_dy);

            if (monster.state === MonsterState.Hit) {
              let angle = 90 * monster.weapon.frame / (monster.weapon.numOfFrames - 1);
              render.ctx.translate(w_dw >> 1, w_dh); // to bottom center of tile
              render.ctx.rotate(angle * Math.PI / 180); // 90 degree
              render.ctx.drawImage(w.tileSet, w.x, w.y, w.w, w.h, -(w_dw >> 1), -w_dh, w_dw, w_dh);
            } else {
              render.ctx.drawImage(w.tileSet, w.x, w.y, w.w, w.h, 0, 0, w_dw, w_dh);
            }
            render.ctx.restore();
          }
          render.ctx.drawImage(monster.tile.tileSet, sx, sy, sw, sh, 0, -tile_offset_y, dw, dh);
        }
        render.ctx.restore();
      }
    }
  }

  renderTile(render: Render, tile: Tile, dx: number, dy: number, time: number) {
    if (tile) {
      const sw = tile.w;
      const sh = tile.h;
      const dw = sw * scale;
      const dh = sh * scale;
      const offset_y = dh - 16 * scale;
      const offset_x = (16 * scale - dw) >> 1;

      if (dx + dw > 0 && dx < render.ctx.canvas.width &&
        dy - offset_y + dh > 0 && dy - offset_y < render.ctx.canvas.height) {
        if (tile.isAnim && tile.numOfFrames > 1) {
          const sf = Math.floor(time / 100) % tile.numOfFrames;
          const sx = tile.x + sw * sf;
          const sy = tile.y;
          render.ctx.drawImage(tile.tileSet, sx, sy, sw, sh, dx + offset_x, dy - offset_y, dw, dh);
        } else {
          const sx = tile.x;
          const sy = tile.y;
          render.ctx.drawImage(tile.tileSet, sx, sy, sw, sh, dx + offset_x, dy - offset_y, dw, dh);
        }
      }
    }
  }
}
//
// (async function () {
//
//   // https://0x72.itch.io/dungeontileset-ii
//
//   const registry = new TileRegistry();
//   await registry.load();
//
//   const render = new Render();
//   const canvas = render.canvas;
//   const ctx = render.ctx;
//
//   const buffer = render.buffer;
//   const b_ctx = render.b_ctx;
//
//   const start = new Date().getTime();
//   const rng = new RNG();
//   const joystick = new Joystick();
//   const hero_weapon = WeaponConfig.configs[0].create(registry);
//   const hero = new HeroMonster(registry, joystick, 0, 0, "knight_f", hero_weapon, start);
//   const scene = new Scene();
//   this.setLevel(new Level(rng, registry, scene, hero, 1, start));
//
//   const scale = 2;
//
//
// })();