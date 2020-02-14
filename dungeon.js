(async function () {

    // https://0x72.itch.io/dungeontileset-ii

    async function loadTilesInfo() {
        const response = await fetch("tiles_list_v1.1");
        const text = await response.text();
        const lines = text.split(/(\r?\n)/g);
        const data = {};
        lines.forEach(function (line) {
            let m = line.match(/([a-z0-9_]+) +([0-9]+) +([0-9]+) +([0-9]+) +([0-9]+) ?([0-9]?)/);
            if (m) {
                data[m[1]] = {
                    x: parseInt(m[2]),
                    y: parseInt(m[3]),
                    w: parseInt(m[4]),
                    h: parseInt(m[5]),
                    numOfFrames: parseInt(m[6] || 1),
                    isAnim: !!m[6],
                };
            }
        });
        return data;
    }

    async function loadTileSet() {
        return await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = ev => resolve(img);
            img.src = "0x72_DungeonTilesetII_v1.2.png";
        });
    }

    const tileMap = await loadTilesInfo();
    const tiles = Object.keys(tileMap);
    const floorTiles = tiles.filter(s => s.startsWith("floor_"));
    const wallTiles = tiles.filter(s => s.startsWith("wall_"));
        // .filter(t => t.indexOf("fountain") < 0)
        // .filter(t => t.indexOf("banner") < 0)
        // .filter(t => t.indexOf("column") < 0)
        // .filter(t => t.indexOf("goo") < 0);
    const monsterTiles = tiles.filter(s => s.match(/_(idle|run|hit)_anim/g));
    console.log(tileMap);
    console.log(floorTiles);
    console.log(wallTiles);

    const tileSet = await loadTileSet();

    const canvas = document.getElementById("dungeon");
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const tinyMonsterNames = [
        "tiny_zombie",
        "goblin",
        "imp",
        "skeleton",
        "muddy",
        "swampy",
        "zombie",
        "ice_zombie",
    ];
    function TinyMonster(x, y, name) {
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
        this.setAnimation("idle");
    }
    TinyMonster.prototype.setAnimation = function(state) {
        switch (state) {
            case "idle":
                this.state = "idle";
                this.tileName = this.name + "_idle_anim";
                this.tile = tileMap[this.tileName];
                this.frame = 0;
                break;
            case "run":
                this.state = "run";
                this.tileName = this.name + "_run_anim";
                this.tile = tileMap[this.tileName];
                this.frame = 0;
                break;
        }
    };
    TinyMonster.prototype.animate = function() {
        this.frame = (this.frame + 1) % this.tile.numOfFrames;
        if(this.frame === 0) {
            if(this.state === "run") {
                // console.log("finish run animation");
                level.monsters[this.y][this.x] = false;
                level.monsters[this.new_y][this.new_x] = this;
                this.x = this.new_x;
                this.y = this.new_y;
            }

            this.setAnimation("idle");

            // search hero near
            const max_distance = 3;
            const scan_x_min = Math.max(0, this.x - max_distance);
            const scan_y_min = Math.max(0, this.y - max_distance);
            const scan_x_max = Math.min(level.w, this.x + max_distance);
            const scan_y_max = Math.min(level.h, this.y + max_distance);

            const is_hero_near = !level.hero.dead
                && level.hero.x >= scan_x_min && level.hero.x <= scan_x_max
                && level.hero.y >= scan_y_min && level.hero.y <= scan_y_max;

            // console.log("hero is near", scan_x_min, scan_x_max, scan_y_min, scan_y_max);

            if(is_hero_near) {
                const dist_x = Math.abs(this.x - level.hero.x);
                const dist_y = Math.abs(this.y - level.hero.y);

                if(dist_x > 1) {
                    const move_x = Math.max(-1, Math.min(1, level.hero.x - this.x));
                    if(this.move(move_x, 0)) {
                        console.log("move to hero x");
                        return;
                    }
                }
                if(dist_y > 0) {
                    const move_y = Math.max(-1, Math.min(1, level.hero.y - this.y));
                    if(this.move(0, move_y)) {
                        console.log("move to hero y");
                        return;
                    }
                }

                if(dist_x  <= 1 && dist_y <= 1 && Math.random() < this.luck) {
                    level.hero.hitDamage(this.damage, this.name);
                    return;
                }
            }

            // random move ?
            const random_move_percent = 0.1;
            if(Math.random() < random_move_percent) {
                const move_x = Math.floor(Math.random() * 3 - 1);
                const move_y = Math.floor(Math.random() * 3 - 1);
                // console.log("random move", move_x, move_y);
                if(this.move(move_x, move_y)){
                    return;
                }
            }
        }
    };
    TinyMonster.prototype.move = function (d_x, d_y) {
        this.is_left = d_x < 0;
        if(this.state === "idle") {
            const new_x = this.x + d_x;
            const new_y = this.y + d_y;

            // check is floor exists
            if(!level.floor[new_y][new_x]) return false;

            // check is no monster
            if(level.monsters[new_y][new_x]) return false;

            // start move animation
            level.monsters[new_y][new_x] = true; // mark as used
            this.new_x = new_x;
            this.new_y = new_y;
            this.setAnimation("run");
            return true;
        }
        return false;
    };
    TinyMonster.prototype.hitDamage = function (damage, name) {
        level.log.push(`${this.name} damaged ${damage} by ${name}`);
        this.health = Math.max(0, this.health - damage);
        if(this.health <= 0) {
            level.log.push(`${this.name} killed by ${name}`);
            level.monsters[this.y][this.x] = false;
            level.monsters[this.new_y][this.new_x] = false;
            level.monsterList = level.monsterList.filter(s => s !== this);
            if(Math.random() < this.luck) {
                level.randomDrop(this.x, this.y);
            }
        }
    };

    const heroMonsterNames = [
        "elf_f",
        "elf_m",
        "knight_f",
        "knight_m",
        "wizard_f",
        "wizard_m",
    ];
    function HeroMonster(x, y, name, weapon) {
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
        this.setAnimation("idle");
    }
    HeroMonster.prototype.setAnimation = function(state) {
        if(!this.dead) {
            switch (state) {
                case "idle":
                    this.state = "idle";
                    this.tileName = this.name + "_idle_anim";
                    this.tile = tileMap[this.tileName];
                    this.frame = 0;
                    break;
                case "run":
                    this.state = "run";
                    this.tileName = this.name + "_run_anim";
                    this.tile = tileMap[this.tileName];
                    this.frame = 0;
                    break;
                case "hit":
                    this.state = "hit";
                    this.tileName = this.name + "_hit_anim";
                    this.tile = tileMap[this.tileName];
                    this.frame = 0;
                    break;
            }
        }
    };
    HeroMonster.prototype.animate = function() {
        switch (this.state) {
            case "idle":
                this.frame = (this.frame + 1) % this.tile.numOfFrames;
                if(this.frame === 0) {
                    this.scanDrop();
                }
                break;
            case "run":
                this.frame = (this.frame + 1) % this.tile.numOfFrames;
                if(this.frame === 0) {
                    // console.log("finish run animation");
                    level.monsters[this.y][this.x] = false;
                    level.monsters[this.new_y][this.new_x] = this;
                    this.x = this.new_x;
                    this.y = this.new_y;
                    this.scanDrop();
                    this.setAnimation("idle");
                }
                break;
            case "hit":
                this.weapon.frame = (this.weapon.frame + 1) % this.weapon.numOfFrames;
                if(this.weapon.frame === 0) {
                    this.scanHit();
                    this.scanDrop();
                    this.setAnimation("idle");
                }
                break;
        }
    };
    HeroMonster.prototype.scanDrop = function() {
        if(level.drop[this.y][this.x]) {
            const drop = level.drop[this.y][this.x];
            level.drop[this.y][this.x] = false;
            drop.process(this);
        }
    };
    HeroMonster.prototype.scanHit = function() {
        const max_distance = this.weapon.distance;
        // search only left or right path
        const scan_x_min = this.is_left ? Math.max(0, this.x - max_distance) : this.x;
        const scan_x_max = this.is_left ? this.x : Math.min(level.w, this.x + max_distance);

        const scan_y_min = Math.max(0, this.y - max_distance);
        const scan_y_max = Math.min(level.h, this.y + max_distance);

        for(let s_y = scan_y_min; s_y <= scan_y_max; s_y++) {
            for(let s_x = scan_x_min; s_x <= scan_x_max; s_x++) {
                // not self
                if(!(s_x === this.x && s_y === this.y)) {
                    const monster = level.monsters[s_y][s_x];
                    if(typeof monster === "object") {
                        monster.hitDamage(this.damage, this.name);
                    }
                }
            }
        }
    };
    HeroMonster.prototype.moveUp = function () {
        this.move(0, -1);
    };
    HeroMonster.prototype.moveLeft = function () {
        this.is_left = true;
        this.move(-1, 0);
    };
    HeroMonster.prototype.moveDown = function () {
        this.move(0, 1);
    };
    HeroMonster.prototype.moveRight = function () {
        this.is_left = false;
        this.move(1, 0);
    };
    HeroMonster.prototype.move = function (d_x, d_y) {
        if(!this.dead && this.state === "idle") {
            const new_x = this.x + d_x;
            const new_y = this.y + d_y;

            // check is floor exists
            if(!level.floor[new_y][new_x]) return false;

            // check is no monster
            if(level.monsters[new_y][new_x]) return false;

            // start move animation
            level.monsters[new_y][new_x] = true; // mark as used
            this.new_x = new_x;
            this.new_y = new_y;
            this.setAnimation("run");
        }
    };
    HeroMonster.prototype.resetPosition = function(x, y) {
        this.x = x;
        this.y = y;
        this.new_x = x;
        this.new_y = y;
    };
    HeroMonster.prototype.hit = function () {
        if(!this.dead && this.state === "idle") {
            if(level.floor[this.y][this.x] === "floor_ladder") {
                level.exit();
                return;
            }

            this.setAnimation("hit");
        }
    };
    HeroMonster.prototype.hitDamage = function (damage, name) {
        if(!this.dead) {
            level.log.push(`${this.name} damaged ${damage} by ${name}`);
            this.health = Math.max(0, this.health - damage);
            if(this.health <= 0) {
                level.log.push(`${this.name} killed by ${name}`);
                this.setAnimation("idle");
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

    function Coins(x, y) {
        const maxCoins = 30;
        this.x = x;
        this.y = y;
        this.tileName = "coin_anim";
        this.coins = Math.floor(Math.random() * (maxCoins - 1)) + 1;
    }
    Coins.prototype.process = function (hero) {
        hero.addCoins(this.coins);
    };

    function HealthFlask(x, y) {
        this.x = x;
        this.y = y;
        this.tileName = "flask_red";
        this.health = 2;
    }
    HealthFlask.prototype.process = function (hero) {
        hero.hill(this.health);
    };

    function HealthBigFlask(x, y) {
        this.x = x;
        this.y = y;
        this.tileName = "flask_big_red";
        this.health = 5;
    }
    HealthBigFlask.prototype.process = function (hero) {
        hero.hill(this.health);
    };

    const weaponNames = [
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
    function Weapon(tileName) {
        this.tileName = tileName;
        this.tile = tileMap[this.tileName];
        this.frame = 0;
        this.numOfFrames = 4;
        this.distance = 1;
    }

    function Level(hero, l) {
        this.level = l;
        this.w = parseInt(canvas.width / 16);
        this.h = parseInt(canvas.height / 16);

        this.log = [];
        this.rooms = [];
        this.corridorsV = [];
        this.corridorsH = [];

        this.createBuffer = function (defaultValue) {
            const rows = [];
            for(let y=0; y<this.h; y++) {
                const row = [];
                rows.push(row);
                for(let x=0; x<this.w; x++) {
                    row.push(defaultValue());
                }
            }
            return rows;
        };

        this.floor = this.createBuffer(() => false);
        this.drop = this.createBuffer(() => false);
        this.wall = this.createBuffer(() => false);

        this.monsterList = [];
        this.hero = hero;
        this.monsters = this.createBuffer(() => false);

        this.generate = function () {
            const rooms_total = 1 + this.level;
            const monsters_total = 2 + this.level;
            const drop_total = 3;

            const room_min_w = 5;
            const room_min_h = 3;
            const room_max_w = 15;
            const room_max_h = 10;
            const room_min_x = 2;
            const room_min_y = 2;

            const retries = 20;
            let last_max_x = room_min_x + room_min_w;
            let last_max_y = room_min_y + room_min_h;

            // create rooms
            for(let r = 0; r < rooms_total; r++) {
                // console.log("last max", r, last_max_x, last_max_y);

                const room_w = parseInt(Math.random() * (room_max_w - room_min_w) + room_min_w);
                const room_h = parseInt(Math.random() * (room_max_h - room_min_h) + room_min_h);

                const world_room_max_x = this.w - 2 - room_w;
                const world_room_max_y = this.h - 2 - room_h;

                const room = {
                    x: 0,
                    y: 0,
                    w: room_w,
                    h: room_h
                };

                for(let t=0; t<retries; t++) {

                    const room_max_x = Math.min(world_room_max_x, last_max_x + room_w + retries);
                    const room_max_y = Math.min(world_room_max_y, last_max_y + room_h + retries);

                    room.x = parseInt(Math.random() * (room_max_x - room_min_x) + room_min_x);
                    room.y = parseInt(Math.random() * (room_max_y - room_min_y) + room_min_y);

                    if(!this.isRoomOverlap(room)) {
                        // free position found
                        if(this.rooms.length === 0) {
                            this.rooms.push(room);
                            break;
                        } else {
                            // find connection
                            const a = room;
                            let connected = false;

                            // console.log("try find corridor", a);

                            // find closest room
                            for(let i=0; i<this.rooms.length; i++) {
                                let b = this.rooms[i];

                                // try calculate horizontal distance
                                const max_x = Math.max(a.x, b.x);
                                const min_x_w = Math.min(a.x+a.w, b.x+b.w);
                                if(max_x + 5 <= min_x_w) {
                                    let rect;
                                    if(a.y+a.h < b.y) {
                                        rect = {
                                            y: a.y + a.h,
                                            x: max_x + 2,
                                            h: b.y - a.y - a.h,
                                            w: min_x_w - max_x - 4,
                                        }
                                    } else {
                                        rect = {
                                            y: b.y + b.h,
                                            x: max_x + 2,
                                            h: a.y - b.y - b.h,
                                            w: min_x_w - max_x - 4,
                                        }
                                    }
                                    if(!this.isCorrVOverlap(rect)) {
                                        // console.log("has vertical", b);
                                        this.corridorsV.push(rect);
                                        connected = true;
                                    }
                                }

                                // try calculate vertical distance
                                const max_y = Math.max(a.y, b.y);
                                const min_y_h = Math.min(a.y+a.h, b.y+b.h);
                                if(max_y + 3 <= min_y_h) {
                                    let rect;
                                    if(a.x+a.w < b.x) {
                                        rect = {
                                            x: a.x + a.w,
                                            y: max_y + 1,
                                            w: b.x - a.x - a.w,
                                            h: min_y_h - max_y - 2,
                                        };
                                    } else {
                                        rect = {
                                            x: b.x + b.w,
                                            y: max_y + 1,
                                            w: a.x - b.x - b.w,
                                            h: min_y_h - max_y - 2,
                                        };
                                    }
                                    if(!this.isCorrHOverlap(rect)) {
                                        // console.log("has horizontal", b);
                                        this.corridorsH.push(rect);
                                        connected = true;
                                    }
                                }
                            }

                            if(connected) {
                                this.rooms.push(room);
                                last_max_x = Math.max(last_max_x, room.x + room.w);
                                last_max_y = Math.max(last_max_y, room.y + room.h);
                                break;
                            }
                        }
                    }
                }
            }

            // create monsters
            for(let m = 0; m < monsters_total; m++) {
                const r = Math.floor(Math.random() * (this.rooms.length - 2)) + 1;
                const room = this.rooms[r];
                for(let t=0; t < 10; t++) {
                    const x = parseInt(Math.random() * room.w) + room.x;
                    const y = parseInt(Math.random() * room.h) + room.y;
                    if(!this.monsters[y][x]) {
                        const n = parseInt(Math.random() * tinyMonsterNames.length);
                        const name = tinyMonsterNames[n];
                        const monster = new TinyMonster(x, y, name);
                        this.monsterList.push(monster);
                        this.monsters[y][x] = monster;
                        break;
                    }
                }
            }

            // create drop
            for(let d = 0; d < drop_total; d++) {
                const r = parseInt(Math.random() * this.rooms.length);
                const room = this.rooms[r];
                for(let t=0; t < 10; t++) {
                    const x = parseInt(Math.random() * room.w) + room.x;
                    const y = parseInt(Math.random() * room.h) + room.y;
                    if(!this.drop[y][x]) {
                        this.randomDrop(x, y);
                        break;
                    }
                }
            }

            // position of hero
            {
                const room = this.rooms[0];
                const hero_x = room.x + (room.w >> 1);
                const hero_y = room.y + (room.h >> 1);
                this.hero.resetPosition(hero_x, hero_y);
                this.monsters[hero_y][hero_x] = hero;
            }
        };
        this.randomDrop = function randomDrop(x, y) {
            if(Math.random() < 0.6) {
                this.drop[y][x] = new Coins(x, y);
            }
            else if(Math.random() < 0.3) {
                this.drop[y][x] = new HealthFlask(x, y);
            }
            else if(Math.random() < 0.1) {
                this.drop[y][x] = new HealthBigFlask(x, y);
            }
        };

        this.isRoomOverlap = function (a) {
            const min_dist = 5;
            const a_dist = {
                x: a.x - min_dist,
                y: a.y - min_dist,
                w: a.w + min_dist + min_dist,
                h: a.h + min_dist + min_dist
            };
            for(let i=0; i<this.rooms.length; i++) {
                let b = this.rooms[i];
                if(this.isRectOverlapWith(a_dist, b)) {
                    return true;
                }
            }
            for(let i=0; i<this.corridorsV.length; i++) {
                let b = this.corridorsV[i];
                if(this.isRectOverlapWith(a_dist, b)) {
                    return true;
                }
            }
            for(let i=0; i<this.corridorsH.length; i++) {
                let b = this.corridorsH[i];
                if(this.isRectOverlapWith(a_dist, b)) {
                    return true;
                }
            }
            return false;
        };
        this.isCorrHOverlap = function (a) {
            const min_dist = 3;
            const a_dist = {
                x: a.x,
                y: a.y - min_dist,
                w: a.w,
                h: a.h + min_dist + min_dist
            };
            for(let i=0; i<this.rooms.length; i++) {
                let b = this.rooms[i];
                if(this.isRectOverlapWith(a_dist, b)) {
                    return true;
                }
            }
            for(let i=0; i<this.corridorsV.length; i++) {
                let b = this.corridorsV[i];
                if(this.isRectOverlapWith(a_dist, b)) {
                    return true;
                }
            }
            for(let i=0; i<this.corridorsH.length; i++) {
                let b = this.corridorsH[i];
                if(this.isRectOverlapWith(a_dist, b)) {
                    return true;
                }
            }
            return false;
        };
        this.isCorrVOverlap = function (a) {
            const min_dist = 2;
            const a_dist = {
                x: a.x - min_dist,
                y: a.y,
                w: a.w + min_dist + min_dist,
                h: a.h
            };
            for(let i=0; i<this.rooms.length; i++) {
                let b = this.rooms[i];
                if(this.isRectOverlapWith(a_dist, b)) {
                    return true;
                }
            }
            for(let i=0; i<this.corridorsV.length; i++) {
                let b = this.corridorsV[i];
                if(this.isRectOverlapWith(a_dist, b)) {
                    return true;
                }
            }
            for(let i=0; i<this.corridorsH.length; i++) {
                let b = this.corridorsH[i];
                if(this.isRectOverlapWith(a_dist, b)) {
                    return true;
                }
            }
            return false;
        };
        this.isRectOverlapWith = function (a, b) {
            return a.x < b.x + b.w
                && a.x + a.w > b.x
                && a.y < b.y + b.h
                && a.y + a.h > b.y;
        };

        this.fill = function () {
            this.rooms.forEach(r => this.fillRoom(r.x, r.y, r.w, r.h));
            this.corridorsH.forEach(r => this.fillCorridorH(r.x, r.y, r.w, r.h));
            this.corridorsV.forEach(r => this.fillCorridorV(r.x, r.y, r.w, r.h));
        };
        this.fillRoom = function(x, y, w, h) {
            // fill floor
            for(let r_y = y; r_y < y + h; r_y++){
                for(let r_x = x; r_x < x + w; r_x++) {
                    this.floor[r_y][r_x] = "floor_1";
                }
            }
            // fill top wall
            this.wall[y-2][x] = "wall_corner_top_left";
            this.wall[y-1][x] = "wall_corner_left";
            if(w > 1) {
                for(let r_x = x + 1; r_x < x + w - 1; r_x++) {
                    this.wall[y-2][r_x] = "wall_top_mid";
                    this.wall[y-1][r_x] = "wall_mid";
                }
                this.wall[y-2][x + w - 1] = "wall_corner_top_right";
                this.wall[y-1][x + w - 1] = "wall_corner_right";
            }
            // fill bottom wall
            this.wall[y+h-1][x] = "wall_corner_bottom_left";
            this.wall[y+h][x] = "wall_left";
            if(w > 1) {
                for(let r_x = x + 1; r_x < x + w - 1; r_x++) {
                    this.wall[y+h-1][r_x] = "wall_top_mid";
                    this.wall[y+h][r_x] = "wall_mid"
                }
                this.wall[y+h-1][x + w - 1] = "wall_corner_bottom_right";
                this.wall[y+h][x + w - 1] = "wall_right";
            }
            // fill right wall
            for(let r_y = y; r_y < y + h - 1; r_y++){
                this.wall[r_y][x] = "wall_side_mid_right";
            }
            // fill left wall
            for(let r_y = y; r_y < y + h - 1; r_y++){
                this.wall[r_y][x + w - 1] = "wall_side_mid_left";
            }
        };
        this.fillCorridorH = function (x, y, w, h) {
            // fill floor
            for(let r_y = y; r_y < y + h; r_y++){
                for(let r_x = x; r_x < x + w; r_x++) {
                    this.floor[r_y][r_x] = "floor_1";
                }
            }

            // connect with room top left
            switch (this.wall[y-2][x - 1]) {
                case "wall_corner_top_right":
                    this.wall[y-2][x - 1] = "wall_top_mid";
                    break;
                case "wall_side_mid_left":
                    break;
                default:
                    console.log("top left 2", this.wall[y-2][x - 1]);
                    break;
            }
            switch (this.wall[y-1][x - 1]) {
                case "wall_corner_right":
                    this.wall[y-1][x - 1] = "wall_mid";
                    break;
                case "wall_side_mid_left":
                    this.wall[y-1][x - 1] = "wall_side_front_left";
                    break;
                default:
                    console.log("top left 1", this.wall[y-1][x - 1]);
                    break;
            }

            // connect with room mid left
            if(h>1){
                for(let l_y=y; l_y < y + h - 1; l_y++) {
                    switch (this.wall[l_y][x - 1]) {
                        case "wall_side_mid_left":
                            this.wall[l_y][x - 1] = false;
                            break;
                        default:
                            console.log("mid left", this.wall[l_y][x - 1]);
                            break;
                    }
                }
            }

            // connect with room bottom left
            switch (this.wall[y+h-1][x - 1]) {
                case "wall_side_mid_left":
                    this.wall[y+h-1][x - 1] = "wall_side_top_left";
                    break;
                case "wall_corner_bottom_right":
                    this.wall[y+h-1][x - 1] = "wall_top_mid";
                    break;
                default:
                    console.log("bottom left 0", this.wall[y+h-1][x - 1]);
                    break;
            }
            switch (this.wall[y+h][x - 1]) {
                case "wall_side_mid_left":
                    break;
                case "wall_right":
                    this.wall[y+h][x - 1] = "wall_mid";
                    break;
                default:
                    console.log("bottom left 1", this.wall[y+h][x - 1]);
                    break;
            }

            // connect with room top right
            switch (this.wall[y-2][x + w]) {
                case "wall_corner_top_left":
                    this.wall[y-2][x + w] = "wall_top_mid";
                    break;
                case "wall_side_mid_right":
                    break;
                default:
                    console.log("top right 2", this.wall[y-2][x + w]);
                    break;
            }
            switch (this.wall[y-1][x + w]) {
                case "wall_corner_left":
                    this.wall[y-1][x + w] = "wall_mid";
                    break;
                case "wall_side_mid_right":
                    this.wall[y-1][x + w] = "wall_side_front_right";
                    break;
                default:
                    console.log("top right 1", this.wall[y-1][x + w]);
                    break;
            }

            // connect with room mid right
            if(h>1){
                for(let l_y=y; l_y < y + h - 1; l_y++) {
                    switch (this.wall[l_y][x + w]) {
                        case "wall_side_mid_right":
                            this.wall[l_y][x + w] = false;
                            break;
                        default:
                            console.log("mid right", this.wall[l_y][x + w]);
                            break;
                    }
                }
            }

            // connect with room bottom right
            switch (this.wall[y + h - 1][x + w]) {
                case "wall_side_mid_right":
                    this.wall[y + h - 1][x + w] = "wall_side_top_right";
                    break;
                case "wall_corner_bottom_left":
                    this.wall[y + h - 1][x + w] = "wall_top_mid";
                    break;
                default:
                    console.log("bottom right 0", this.wall[y + h - 1][x + w]);
                    break;
            }
            switch (this.wall[y+h][x + w]) {
                case "wall_side_mid_right":
                    break;
                case "wall_left":
                    this.wall[y+h][x + w] = "wall_mid";
                    break;
                default:
                    console.log("bottom right +1", this.wall[y+h][x + w]);
                    break;
            }

            // fill top wall
            for(let r_x = x; r_x < x + w; r_x++) {
                this.wall[y-2][r_x] = "wall_top_mid";
                this.wall[y-1][r_x] = "wall_mid";
            }

            // fill bottom wall
            for(let r_x = x; r_x < x + w; r_x++) {
                this.wall[y+h-1][r_x] = "wall_top_mid";
                this.wall[y+h][r_x] = "wall_mid"
            }
        };
        this.fillCorridorV = function (x, y, w, h) {
            // fill floor
            for(let r_y = y; r_y < y + h; r_y++){
                for(let r_x = x; r_x < x + w; r_x++) {
                    this.floor[r_y][r_x] = "floor_1";
                }
            }

            // connect with room top left
            switch (this.wall[y-1][x-1]) {
                case "wall_top_mid":
                    this.wall[y-1][x-1] = "wall_corner_top_right";
                    break;
                default:
                    console.log("top left -1 -1", this.wall[y-1][x-1]);
                    break;
            }
            switch (this.wall[y][x-1]) {
                case "wall_mid":
                    this.wall[y][x-1] = "wall_corner_right";
                    break;
                default:
                    console.log("top left 0 -1", this.wall[y][x-1]);
                    break;
            }

            // connect with room top mid
            for (let r_x = x; r_x < x + w; r_x++) {
                switch (this.wall[y-1][r_x]) {
                    case "wall_top_mid":
                        this.wall[y-1][r_x] = false;
                        break;
                    default:
                        console.log("top mid -1", this.wall[y-1][r_x]);
                        break;
                }
                switch (this.wall[y][r_x]) {
                    case "wall_mid":
                        this.wall[y][r_x] = false;
                        break;
                    default:
                        console.log("top mid 0", this.wall[y][r_x]);
                        break;
                }
            }

            // connect with room top right
            switch (this.wall[y-1][x+w]) {
                case "wall_top_mid":
                    this.wall[y-1][x+w] = "wall_corner_top_left";
                    break;
                default:
                    console.log("top right -1 1", this.wall[y-1][x+w]);
                    break;
            }
            switch (this.wall[y][x+w]) {
                case "wall_mid":
                    this.wall[y][x+w] = "wall_corner_left";
                    break;
                default:
                    console.log("top right 0 -1", this.wall[y][x+w]);
                    break;
            }


            // connect with room bottom left
            switch (this.wall[y+h-2][x-1]) {
                case "wall_top_mid":
                    this.wall[y+h-2][x-1] = "wall_corner_bottom_right";
                    break;
                default:
                    console.log("bottom left -2 -1", this.wall[y+h-2][x-1]);
                    break;
            }
            switch (this.wall[y+h-1][x-1]) {
                case "wall_mid":
                    this.wall[y+h-1][x-1] = "wall_corner_front_right";
                    break;
                default:
                    console.log("top left 0 -1", this.wall[y+h-1][x-1]);
                    break;
            }

            // connect with room bottom mid
            for (let r_x = x; r_x < x + w; r_x++) {
                switch (this.wall[y+h-2][r_x]) {
                    case "wall_top_mid":
                        this.wall[y+h-2][r_x] = false;
                        break;
                    default:
                        console.log("bottom mid -2", this.wall[y+h-2][r_x]);
                        break;
                }
                switch (this.wall[y+h-1][r_x]) {
                    case "wall_mid":
                        this.wall[y+h-1][r_x] = false;
                        break;
                    default:
                        console.log("bottom mid -1", this.wall[y+h-1][r_x]);
                        break;
                }
            }

            // connect with room bottom right
            switch (this.wall[y+h-2][x+w]) {
                case "wall_top_mid":
                    this.wall[y+h-2][x+w] = "wall_corner_bottom_left";
                    break;
                default:
                    console.log("bottom right -2 -1", this.wall[y+h-2][x-1]);
                    break;
            }
            switch (this.wall[y+h-1][x+w]) {
                case "wall_mid":
                    this.wall[y+h-1][x+w] = "wall_corner_front_left";
                    break;
                default:
                    console.log("bottom right 0 -1", this.wall[y+h-1][x-1]);
                    break;
            }

            // fill side walls
            for (let r_y = y+1; r_y<y+h-2; r_y++) {
                this.wall[r_y][x-1] = "wall_side_mid_left";
                this.wall[r_y][x+w] = "wall_side_mid_right";
            }
        };

        this.replace = function () {
            this.replaceFloorRandomly();
            this.replaceLadder();
            this.replaceWallRandomly();
        };
        this.replaceFloorRandomly = function () {
            const replacements = ["floor_2", "floor_3", "floor_4", "floor_5", "floor_6", "floor_7", "floor_8"];
            const percent = 0.2;
            for(let y=0; y<this.h; y++) {
                for(let x=0; x<this.w; x++) {
                    if(this.floor[y][x] && Math.random() < percent) {
                        const i = parseInt(Math.random() * replacements.length);
                        this.floor[y][x] = replacements[i];
                    }
                }
            }
        };
        this.replaceLadder = function () {
            // replace one tile in last room as ladder = out from level!
            const last = this.rooms[this.rooms.length-1];

            const ladder_x = last.x + (last.w >> 1);
            const ladder_y = last.y + (last.h >> 1);
            console.log(ladder_x, ladder_y, last);
            this.floor[ladder_y][ladder_x] = "floor_ladder";
        };
        this.replaceWallRandomly = function () {
            const wall_mid_top_replaces = [
                "wall_hole_1",
                "wall_hole_2",
                "wall_banner_red",
                "wall_banner_blue",
                "wall_banner_green",
                "wall_banner_yellow",
                "wall_goo",
                "wall_fountain_mid_red_anim",
                "wall_fountain_mid_blue_anim",
            ];
            const wall_mid_bottom_replaces = [
                "wall_hole_1",
                "wall_hole_2",
            ];
            const percent = 0.2;
            for(let y=0; y<this.h; y++) {
                for(let x=0; x<this.w; x++) {
                    if(this.wall[y][x]) {
                        // const i = parseInt(Math.random() * replacements.length);
                        // this.floor[y][x] = replacements[i];
                        switch (this.wall[y][x]) {
                            case "wall_mid":
                                if(Math.random() < percent) {
                                    const is_top = !!this.floor[y + 1][x];
                                    let replacements;
                                    if (is_top) {
                                        replacements = wall_mid_top_replaces;
                                    } else {
                                        replacements = wall_mid_bottom_replaces;
                                    }
                                    const i = parseInt(Math.random() * replacements.length);
                                    const replacement = replacements[i];
                                    switch (replacement) {
                                        case "wall_goo":
                                            this.wall[y][x] = "wall_goo";
                                            this.floor[y+1][x] = "wall_goo_base";
                                            break;
                                        case "wall_fountain_mid_red_anim":
                                            this.wall[y-1][x] = "wall_fountain_top";
                                            this.wall[y][x] = "wall_fountain_mid_red_anim";
                                            this.floor[y+1][x] = "wall_fountain_basin_red_anim";
                                            break;
                                        case "wall_fountain_mid_blue_anim":
                                            this.wall[y-1][x] = "wall_fountain_top";
                                            this.wall[y][x] = "wall_fountain_mid_blue_anim";
                                            this.floor[y+1][x] = "wall_fountain_basin_blue_anim";
                                            break;
                                        default:
                                            this.wall[y][x] = replacement;
                                            break;
                                    }
                                }
                                break;
                            default:
                                // console.log("replace", this.wall[y][x]);
                                break;
                        }
                    }
                }
            }
        };

        this.animate = function () {
            this.monsterList.forEach(m => m.animate());
            this.hero.animate();
        };

        this.generate();
        this.fill();
        this.replace();

        this.timer = setInterval(() => this.animate(), 80);

        this.exit = function () {
            clearInterval(this.timer);
            level = new Level(this.hero, this.level + 1);
        }
    }

    const hero_weapon = new Weapon("weapon_rusty_sword");

    const hero = new HeroMonster(0, 0, "knight_f", hero_weapon);
    let level = new Level(hero, 1);

    window.addEventListener("keydown", function (e) {
        switch (e.code) {
            case "KeyW":
                e.preventDefault();
                level.hero.moveUp();
                break;
            case "KeyA":
                e.preventDefault();
                level.hero.moveLeft();
                break;
            case "KeyS":
                e.preventDefault();
                level.hero.moveDown();
                break;
            case "KeyD":
                e.preventDefault();
                level.hero.moveRight();
                break;
            case "KeyF":
                e.preventDefault();
                level.hero.hit();
                break;
        }
    });

    const scale = 2;
    function render() {

        renderLevel();
        renderHUD();

        // floorTiles.forEach((tileName, i) => {
        //     renderTile(tileName, i * 17 * scale, 0);
        // });
        // wallTiles.forEach((tileName, i) => {
        //     const row = parseInt(i / 10);
        //     const col = i % 10;
        //     renderTile(tileName, col * 17 * scale, (17 + 17 * row) * scale);
        // });
        // monsterTiles.forEach((tileName, i) => {
        //     const row = parseInt(i / 18);
        //     const col = i % 18;
        //     renderTile(tileName, col * 16 * scale, (16 * 5 + 16 * row) * scale);
        // });

        window.requestAnimationFrame(render);
    }

    function renderLevel() {
        const c_w = canvas.width;
        const c_h = canvas.height;

        ctx.save();
        ctx.fillStyle = "rgb(34,34,34)";
        ctx.fillRect(0, 0, c_w, c_h);

        // translate level to hero position
        if(level.hero.state === "run") {
            const offset_x = scale * 16 * (level.hero.new_x - level.hero.x) * (level.hero.frame / level.hero.tile.numOfFrames);
            const offset_y = scale * 16 * (level.hero.new_y - level.hero.y) * (level.hero.frame / level.hero.tile.numOfFrames);
            const t_x = level.hero.x * 16 * scale - c_w / 2 + offset_x;
            const t_y = level.hero.y * 16 * scale - c_h / 2 + offset_y;
            ctx.translate(-t_x, -t_y);
        } else {
            const t_x = level.hero.x * 16 * scale - c_w / 2;
            const t_y = level.hero.y * 16 * scale - c_h / 2;
            ctx.translate(-t_x, -t_y);
        }

        for(let l_x=0; l_x<level.w; l_x++) {
            for(let l_y=0; l_y<level.h; l_y++) {
                const d_x = l_x * 16 * scale;
                const d_y = l_y * 16 * scale;
                renderTile(level.floor[l_y][l_x], d_x, d_y);
                if(level.drop[l_y][l_x]) {
                    renderTile(level.drop[l_y][l_x].tileName, d_x, d_y);
                }
            }
        }
        for(let l_y=0; l_y<level.h; l_y++) {
            for(let l_x=0; l_x<level.w; l_x++) {
                const d_x = l_x * 16 * scale;
                const d_y = l_y * 16 * scale;
                renderTile(level.wall[l_y][l_x], d_x, d_y);
            }
            if(l_y < level.h -1) {
                for (let l_x = 0; l_x < level.w; l_x++) {
                    const m_y = l_y + 1;
                    const d_x = l_x * 16 * scale;
                    const d_y = m_y * 16 * scale;
                    renderMonster(level.monsters[m_y][l_x], d_x, d_y);
                }
            }
        }

        ctx.restore();
    }

    function renderHUD() {
        const c_w = canvas.width;
        const c_h = canvas.height;

        const border = 4;
        const height = 20;
        const point_w = 10;
        const h_m = level.hero.healthMax;
        const h = level.hero.health;

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

        // render HUD - level
        ctx.save();
        ctx.translate(c_w / 2, 60);
        ctx.fillStyle = "rgb(255,255,255)";
        ctx.textAlign = "center";
        ctx.font = "20px silkscreennormal";
        ctx.fillText(`level ${level.level}`, 0, 0);
        ctx.restore();

        // render HUD - log info
        level.log = level.log.slice(-5);
        ctx.save();
        ctx.translate(40, c_h - 100);
        for(let i=0; i<level.log.length; i++) {
            ctx.fillStyle = "rgb(255,255,255)";
            ctx.font = "20px silkscreennormal";
            ctx.fillText(level.log[i], 0, i * 20);
        }

        ctx.restore();

        // render HUD - YOU DEAD
        if(level.hero.dead) {
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

    function renderMonster(monster, dx, dy) {
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
                offset_x = scale * 16 * (monster.new_x - monster.x) * (monster.frame / monster.tile.numOfFrames);
                offset_y = scale * 16 * (monster.new_y - monster.y) * (monster.frame / monster.tile.numOfFrames);
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
                        ctx.drawImage(tileSet, w.x, w.y, w.w, w.h, -(w_dw >> 1), -w_dh, w_dw, w_dh);
                    } else {
                        ctx.drawImage(tileSet, w.x, w.y, w.w, w.h, 0, 0, w_dw, w_dh);
                    }
                    ctx.restore();
                }
                ctx.drawImage(tileSet, sx, sy, sw, sh, 0 - dw, -tile_offset_y, dw, dh);
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
                        ctx.drawImage(tileSet, w.x, w.y, w.w, w.h, -(w_dw >> 1), -w_dh, w_dw, w_dh);
                    }else {
                        ctx.drawImage(tileSet, w.x, w.y, w.w, w.h, 0, 0, w_dw, w_dh);
                    }
                    ctx.restore();
                }
                ctx.drawImage(tileSet, sx, sy, sw, sh, 0, -tile_offset_y, dw, dh);
            }
            ctx.restore();
        }
    }

    function renderTile(tileName, dx, dy) {
        const tile = tileMap[tileName];
        if(tile) {
            if (tile.isAnim && tile.numOfFrames > 1) {
                const time = new Date().getTime();
                let sf;
                if (tile.numOfFrames === 3) {
                    sf = parseInt(time / 100) % tile.numOfFrames;
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
                ctx.drawImage(tileSet, sx, sy, sw, sh, dx, dy, dw, dh);
            } else {
                const sx = tile.x;
                const sy = tile.y;
                const sw = tile.w;
                const sh = tile.h;
                const dw = sw * scale;
                const dh = sh * scale;
                ctx.drawImage(tileSet, sx, sy, sw, sh, dx, dy, dw, dh);
            }
        }
    }

    render();
})();