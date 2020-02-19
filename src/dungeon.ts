import {Joystick} from "./input";
import {Tile, TileRegistry} from "./tilemap";
import {HeroMonster} from "./hero";
import {Level} from "./level";
import {Scene} from "./scene";
import {RNG} from "./rng";
import {Monster, MonsterState, MovingMonsterWrapper} from "./monster";
import {Weapon, WeaponConfig} from "./drop";

(async function () {

  // https://0x72.itch.io/dungeontileset-ii

  const registry = new TileRegistry();
  await registry.load();

  const canvas: HTMLCanvasElement = document.getElementById("dungeon") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const buffer = document.createElement("canvas");
  const b_ctx = buffer.getContext("2d");
  b_ctx.imageSmoothingEnabled = false;

  const start = new Date().getTime();
  const rng = new RNG();
  const joystick = new Joystick();
  const hero_weapon = WeaponConfig.configs[0].create(registry);
  const hero = new HeroMonster(registry, joystick,0, 0, "knight_f", hero_weapon, start);
  const scene = new Scene();
  scene.setLevel(new Level(rng, registry, scene, hero, 1, start));

  const scale = 2;
  function render() {
    const time = new Date().getTime();
    scene.level.animate(time);
    renderLevel(time);
    renderHUD(time);
    window.requestAnimationFrame(render);
  }

  function renderLevel(time: number) {
    const c_w = canvas.width;
    const c_h = canvas.height;
    buffer.width = c_w;
    buffer.height = c_h;

    ctx.save();
    ctx.fillStyle = "rgb(34,34,34)";
    ctx.fillRect(0, 0, c_w, c_h);

    b_ctx.save();
    b_ctx.fillStyle = "black";
    b_ctx.fillRect(0, 0, c_w, c_h);
    b_ctx.globalCompositeOperation = "lighter";

    // render hero light
    renderLight(c_w >> 1, c_h >> 1, 16 * scale * 6);

    let t_x = scene.level.hero.x * 16 * scale + 8 - c_w / 2;
    let t_y = scene.level.hero.y * 16 * scale + 8 - c_h / 2;

    // translate level to hero position
    if(scene.level.hero.state === MonsterState.Run) {
      const start = scene.level.hero.start;
      const speed = scene.level.hero.speed;
      const numOfFrames = scene.level.hero.tile.numOfFrames;
      const maxTime = speed * numOfFrames;
      const delta = Math.min(maxTime, time - start) / maxTime;

      const t_offset_x = scale * 16 * (scene.level.hero.new_x - scene.level.hero.x) * delta;
      const t_offset_y = scale * 16 * (scene.level.hero.new_y - scene.level.hero.y) * delta;

      t_x = t_x + t_offset_x;
      t_y = t_y + t_offset_y;
    }

    // render floor, drop
    for(let l_x=0; l_x<scene.level.w; l_x++) {
      for(let l_y=0; l_y<scene.level.h; l_y++) {
        const d_x = -t_x + l_x * 16 * scale;
        const d_y = -t_y + l_y * 16 * scale;
        renderTile(scene.level.floor[l_y][l_x], d_x, d_y);
        if(scene.level.drop[l_y][l_x]) {
          renderTile(scene.level.drop[l_y][l_x].tile, d_x, d_y);
        }
      }
    }
    // render wall, monsters
    for(let l_y=0; l_y<scene.level.h; l_y++) {
      for(let l_x=0; l_x<scene.level.w; l_x++) {
        const d_x = -t_x + l_x * 16 * scale;
        const d_y = -t_y + l_y * 16 * scale;
        const tile = scene.level.wall[l_y][l_x];
        if(tile) {
          renderTile(tile, d_x, d_y);
          if (tile.name === "wall_fountain_mid_red_anim" || tile.name === "wall_fountain_mid_blue_anim") {
            renderLight(d_x + 8 * scale, d_y + 8 * scale, 16 * scale * 4);
          }
        }
      }
      if(l_y < scene.level.h -1) {
        for (let l_x = 0; l_x < scene.level.w; l_x++) {
          const m_y = l_y + 1;
          const d_x = -t_x + l_x * 16 * scale;
          const d_y = -t_y + m_y * 16 * scale;
          renderMonster(scene.level.monsters[m_y][l_x], d_x, d_y, time);
        }
      }
    }

    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(buffer, 0, 0);
    ctx.restore();
  }

  function renderLight(x: number, y: number, radius: number) {
    const diameter = radius << 1;
    const box_x = x - radius;
    const box_y = y - radius;

    const grd = b_ctx.createRadialGradient(x, y, 16, x, y, radius);
    grd.addColorStop(0.5, "rgb(255,255,255)");
    grd.addColorStop(1, "transparent");
    b_ctx.fillStyle = grd;
    b_ctx.fillRect(box_x, box_y, diameter, diameter);
  }

  function renderHUD(time: number) {
    renderHealth(time);
    renderLevelTitle(time);
    renderYouDead(time);
    renderInventory(time);
  }
  function renderHealth(time: number) {
    const border = 4;
    const height = 20;
    const point_w = 10;
    const h_m = scene.level.hero.healthMax;
    const h = scene.level.hero.health;

    // render HUD - hero health
    ctx.save();
    ctx.translate(40, 40);

    // background
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, border * 2 + point_w * h_m, border * 2 + height);

    // health red line
    ctx.fillStyle = "rgb(255,0,0)";
    ctx.fillRect(border, border, point_w * h, height);

    // health points text
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.font = "20px silkscreennormal";
    ctx.fillText(h.toString(), border * 2, border + 16);

    // coins text
    ctx.fillText(`$${hero.coins}`, 0, 50);

    ctx.restore();
  }
  function renderLevelTitle(time: number) {
    const c_w = canvas.width;
    const c_h = canvas.height;

    // render HUD - level
    ctx.save();
    ctx.translate(c_w / 2, 60);
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.textAlign = "center";
    ctx.font = "20px silkscreennormal";
    ctx.fillText(`level ${scene.level.level}`, 0, 0);
    ctx.restore();

    // render HUD - log info
    scene.level.log = scene.level.log.slice(-5);
    ctx.save();
    ctx.translate(40, c_h - 100);
    for(let i=0; i<scene.level.log.length; i++) {
      ctx.fillStyle = "rgb(255,255,255)";
      ctx.font = "20px silkscreennormal";
      ctx.fillText(scene.level.log[i], 0, i * 20);
    }

    ctx.restore();
  }
  function renderYouDead(time: number) {
    const c_w = canvas.width;
    const c_h = canvas.height;

    if(scene.level.hero.dead) {
      ctx.save();

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, c_w, c_h);

      ctx.translate(c_w / 2, c_h / 2);

      ctx.fillStyle = "rgb(255,0,0)";
      ctx.textAlign = "center";
      ctx.font = "200px silkscreennormal";
      ctx.fillText("YOU DIED", 0, 0);
      ctx.restore();
    }
  }
  function renderInventory(time: number) {
    const c_w = canvas.width;
    const c_h = canvas.height;

    const cells = scene.level.hero.inventory.cells;
    const cell_size = 16;
    const grid_w = cells.length;
    const grid_spacing = 2;

    const inv_w = scale * (grid_w * (cell_size + grid_spacing) + grid_spacing);
    const inv_h = scale * (cell_size + grid_spacing + grid_spacing);

    ctx.save();
    ctx.translate((c_w >> 1) - (inv_w >> 1), c_h - inv_h - 40);

    // background
    ctx.fillStyle = "rgb(100,100,100)";
    ctx.fillRect(0, 0, inv_w, inv_h);

    ctx.translate(grid_spacing * scale, grid_spacing * scale); // grid spacing

    for (let g_x = 0; g_x < grid_w; g_x++) {
      const c_x = scale * (g_x * (cell_size + grid_spacing));
      const c_y = 0;

      ctx.fillStyle = "rgb(70,70,70)";
      ctx.fillRect(c_x, 0, cell_size * scale, cell_size * scale);
      const cell = cells[g_x];
      if(cell.item) {
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

        ctx.drawImage(tile.tileSet, sx, sy, sw, sh, c_x + c_offset_x, c_y, dw, dh);
        ctx.textAlign = "end";
        ctx.textBaseline = "top";
        ctx.font = "10px silkscreennormal";
        ctx.fillStyle = "rgb(255,255,255)";
        ctx.fillText(cell.count.toString(), c_x + (cell_size * scale), 0, cell_size * scale);
      }
    }
    ctx.restore();
  }

  function renderMonster(monster: Monster, dx: number, dy: number, time: number) {
    if(monster && !(monster instanceof MovingMonsterWrapper)) {
      const sw = monster.tile.w;
      const sh = monster.tile.h;
      const sx = monster.tile.x + sw * monster.frame;
      const sy = monster.tile.y;
      const dw = sw * scale;
      const dh = sh * scale;

      const tile_offset_y = dh - 14 * scale;

      let offset_x = 0;
      let offset_y = 0;

      if(monster.state === MonsterState.Run) {
        const start = monster.start;
        const speed = monster.speed;
        const numOfFrames = monster.tile.numOfFrames;
        const maxTime = speed * numOfFrames;
        const delta = Math.min(maxTime, time - start) / maxTime;

        offset_x = scale * 16 * (monster.new_x - monster.x) * delta;
        offset_y = scale * 16 * (monster.new_y - monster.y) * delta;
      }

      if(dx + offset_x + dw > 0 && dx + offset_x < ctx.canvas.width &&
        dy + offset_y + dh > 0 && dy + offset_y < ctx.canvas.height) {


        ctx.save();
        ctx.translate(dx + offset_x, dy + offset_y);
        if(monster.is_left) {
          ctx.scale(-1, 1);
          if(monster.weapon) {
            ctx.save();
            const w = monster.weapon.tile;
            const w_dw = w.w * scale;
            const w_dh = w.h * scale;

            const w_dy = w_dh - 14 * scale;
            const w_dx = 4 * scale;

            ctx.translate(-w_dx, -w_dy);

            if(monster.state === MonsterState.Hit) {
              let angle = 90 * monster.weapon.frame / (monster.weapon.numOfFrames - 1);
              ctx.translate(w_dw >> 1, w_dh); // to bottom center of tile
              ctx.rotate(angle * Math.PI / 180); // 90 degree
              ctx.drawImage(w.tileSet, w.x, w.y, w.w, w.h, -(w_dw >> 1), -w_dh, w_dw, w_dh);
            } else {
              ctx.drawImage(w.tileSet, w.x, w.y, w.w, w.h, 0, 0, w_dw, w_dh);
            }
            ctx.restore();
          }
          ctx.drawImage(monster.tile.tileSet, sx, sy, sw, sh, 0 - dw, -tile_offset_y, dw, dh);
        } else {
          if(monster.weapon) {
            ctx.save();
            const w = monster.weapon.tile;
            const w_dw = w.w * scale;
            const w_dh = w.h * scale;

            const w_dy = w_dh - 14 * scale;
            const w_dx = 12 * scale;

            ctx.translate(w_dx, -w_dy);

            if(monster.state === MonsterState.Hit) {
              let angle = 90 * monster.weapon.frame / (monster.weapon.numOfFrames - 1);
              ctx.translate(w_dw >> 1, w_dh); // to bottom center of tile
              ctx.rotate(angle * Math.PI / 180); // 90 degree
              ctx.drawImage(w.tileSet, w.x, w.y, w.w, w.h, -(w_dw >> 1), -w_dh, w_dw, w_dh);
            }else {
              ctx.drawImage(w.tileSet, w.x, w.y, w.w, w.h, 0, 0, w_dw, w_dh);
            }
            ctx.restore();
          }
          ctx.drawImage(monster.tile.tileSet, sx, sy, sw, sh, 0, -tile_offset_y, dw, dh);
        }
        ctx.restore();
      }
    }
  }

  function renderTile(tile: Tile, dx: number, dy: number) {
    if(tile) {
      const sw = tile.w;
      const sh = tile.h;
      const dw = sw * scale;
      const dh = sh * scale;
      const offset_y = dh - 16 * scale;
      const offset_x = (16 * scale - dw) >> 1;

      if(dx + dw > 0 && dx < ctx.canvas.width &&
        dy - offset_y + dh > 0 && dy - offset_y < ctx.canvas.height) {
        if (tile.isAnim && tile.numOfFrames > 1) {
          const time = new Date().getTime();
          const sf = Math.floor(time / 100) % tile.numOfFrames;
          const sx = tile.x + sw * sf;
          const sy = tile.y;
          ctx.drawImage(tile.tileSet, sx, sy, sw, sh, dx + offset_x, dy - offset_y, dw, dh);
        } else {
          const sx = tile.x;
          const sy = tile.y;
          ctx.drawImage(tile.tileSet, sx, sy, sw, sh, dx + offset_x, dy - offset_y, dw, dh);
        }
      }
    }
  }

  render();
})();