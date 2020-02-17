import {Joystick} from "./input.js";
import {TileRegistry} from "./tilemap.js";
import {HeroMonster, Weapon} from "./hero.js";
import {Level} from "./level.js";
import {Scene} from "./scene.js";

(async function () {

    // https://0x72.itch.io/dungeontileset-ii

    const registry = new TileRegistry();
    await registry.load();

    const canvas = document.getElementById("dungeon");
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const buffer = document.createElement("canvas");
    const b_ctx = buffer.getContext("2d");
    b_ctx.imageSmoothingEnabled = false;

    const start = new Date().getTime();
    const joystick = new Joystick();
    const hero_weapon = new Weapon(registry,"weapon_rusty_sword");
    const hero = new HeroMonster(registry, joystick,0, 0, "knight_f", hero_weapon, start);
    const scene = new Scene();
    scene.setLevel(new Level(registry, scene, hero, 1, start));

    const scale = 2;
    function render() {
        const time = new Date().getTime();
        scene.level.animate(time);
        renderLevel(time);
        renderHUD(time);
        window.requestAnimationFrame(render);
    }

    // @todo refactor to module-way
    function renderLevel(time) {
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

        // translate level to hero position
        if(scene.level.hero.state === "run") {
            const start = scene.level.hero.start;
            const speed = scene.level.hero.speed;
            const numOfFrames = scene.level.hero.tile.numOfFrames;
            const maxTime = speed * numOfFrames;
            const delta = Math.min(maxTime, time - start) / maxTime;

            const t_offset_x = scale * 16 * (scene.level.hero.new_x - scene.level.hero.x) * delta;
            const t_offset_y = scale * 16 * (scene.level.hero.new_y - scene.level.hero.y) * delta;

            const t_x = scene.level.hero.x * 16 * scale + 8 - c_w / 2 + t_offset_x;
            const t_y = scene.level.hero.y * 16 * scale + 8 - c_h / 2 + t_offset_y;
            ctx.translate(-t_x, -t_y);
            b_ctx.translate(-t_x, -t_y);
        } else {
            const t_x = scene.level.hero.x * 16 * scale + 8 - c_w / 2;
            const t_y = scene.level.hero.y * 16 * scale + 8 - c_h / 2;
            ctx.translate(-t_x, -t_y);
            b_ctx.translate(-t_x, -t_y);
        }

        // render floor, drop
        for(let l_x=0; l_x<scene.level.w; l_x++) {
            for(let l_y=0; l_y<scene.level.h; l_y++) {
                const d_x = l_x * 16 * scale;
                const d_y = l_y * 16 * scale;
                renderTile(scene.level.floor[l_y][l_x], d_x, d_y);
                if(scene.level.drop[l_y][l_x]) {
                    renderTile(scene.level.drop[l_y][l_x].tileName, d_x, d_y);
                }
            }
        }
        // render wall, monsters
        for(let l_y=0; l_y<scene.level.h; l_y++) {
            for(let l_x=0; l_x<scene.level.w; l_x++) {
                const d_x = l_x * 16 * scale;
                const d_y = l_y * 16 * scale;
                renderTile(scene.level.wall[l_y][l_x], d_x, d_y);
            }
            if(l_y < scene.level.h -1) {
                for (let l_x = 0; l_x < scene.level.w; l_x++) {
                    const m_y = l_y + 1;
                    const d_x = l_x * 16 * scale;
                    const d_y = m_y * 16 * scale;
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

    function renderLight(x, y, radius) {
        const diameter = radius << 1;
        const box_x = x - radius;
        const box_y = y - radius;

        const grd = b_ctx.createRadialGradient(x, y, 16, x, y, radius);
        grd.addColorStop(0.5, "rgb(255,255,255)");
        grd.addColorStop(1, "transparent");
        b_ctx.fillStyle = grd;
        b_ctx.fillRect(box_x, box_y, diameter, diameter);
    }

    function renderHUD(time) {
        renderHealth(time);
        renderLevelTitle(time);
        renderYouDead(time);
        renderInventory(time);
    }
    function renderHealth() {
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
        ctx.fillText(h, border * 2, border + 16);

        // coins text
        ctx.fillText(`$${hero.coins}`, 0, 50);

        ctx.restore();
    }
    function renderLevelTitle() {
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
    function renderYouDead() {
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
    function renderInventory(time) {
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
                const tile = registry.get(cell.item.tileName);
                if (tile) {
                    // @todo fix dw/dh for swords
                    if (tile.isAnim && tile.numOfFrames > 1) {
                        let sf;
                        if (tile.numOfFrames === 3) {
                            sf = Math.floor(time / 100) % tile.numOfFrames;
                        } else if (tile.numOfFrames === 4) {
                            sf = (time >> 2) % tile.numOfFrames;
                        } else {
                            sf = (time >> 2) % tile.numOfFrames;
                        }
                        const sw = tile.w;
                        const sh = tile.h;
                        const sx = tile.x + sw * sf;
                        const sy = tile.y;
                        const dw = sw * scale;
                        const dh = sh * scale;
                        ctx.drawImage(tile.tileSet, sx, sy, sw, sh, c_x, c_y, dw, dh);
                    } else {
                        const sx = tile.x;
                        const sy = tile.y;
                        const sw = tile.w;
                        const sh = tile.h;
                        const dw = sw * scale;
                        const dh = sh * scale;
                        ctx.drawImage(tile.tileSet, sx, sy, sw, sh, c_x, c_y, dw, dh);
                    }
                }
                ctx.textAlign = "end";
                ctx.textBaseline = "top";
                ctx.font = "10px silkscreennormal";
                ctx.fillStyle = "rgb(255,255,255)";
                ctx.fillText(cell.count, c_x + (cell_size * scale), 0, cell_size * scale);
            }
        }
        ctx.restore();
    }

    function renderMonster(monster, dx, dy, time) {
        if(monster && typeof monster === "object") {
            const sw = monster.tile.w;
            const sh = monster.tile.h;
            const sx = monster.tile.x + sw * monster.frame;
            const sy = monster.tile.y;
            const dw = sw * scale;
            const dh = sh * scale;

            const tile_offset_y = dh - 14 * scale;

            let offset_x = 0;
            let offset_y = 0;

            if(monster.state === "run") {
                const start = monster.start;
                const speed = monster.speed;
                const numOfFrames = monster.tile.numOfFrames;
                const maxTime = speed * numOfFrames;
                const delta = Math.min(maxTime, time - start) / maxTime;

                offset_x = scale * 16 * (monster.new_x - monster.x) * delta;
                offset_y = scale * 16 * (monster.new_y - monster.y) * delta;
            }

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

                    if(monster.state === "hit") {
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

                    if(monster.state === "hit") {
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

    function renderTile(tileName, dx, dy) {
        const tile = registry.get(tileName);
        if(tile) {
            if (tileName ===  "wall_fountain_mid_red_anim"
              || tileName ===  "wall_fountain_mid_blue_anim"
            ) {
                renderLight(dx + 8, dy + 8, 16 * scale * 4);
            }

            if (tile.isAnim && tile.numOfFrames > 1) {
                const time = new Date().getTime();
                let sf;
                if (tile.numOfFrames === 3) {
                    sf = Math.floor(time / 100) % tile.numOfFrames;
                } else if (tile.numOfFrames === 4) {
                    sf = (time >> 2) % tile.numOfFrames;
                } else {
                    sf = (time >> 2) % tile.numOfFrames;
                }
                const sw = tile.w;
                const sh = tile.h;
                const sx = tile.x + sw * sf;
                const sy = tile.y;
                const dw = sw * scale;
                const dh = sh * scale;
                ctx.drawImage(tile.tileSet, sx, sy, sw, sh, dx, dy, dw, dh);
            } else {
                const sx = tile.x;
                const sy = tile.y;
                const sw = tile.w;
                const sh = tile.h;
                const dw = sw * scale;
                const dh = sh * scale;
                ctx.drawImage(tile.tileSet, sx, sy, sw, sh, dx, dy, dw, dh);
            }
        }
    }

    render();
})();