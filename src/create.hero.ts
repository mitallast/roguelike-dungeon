import {Scene, SceneController} from "./scene";
import {Render} from "./render";
import {RNG} from "./rng";
import {Joystick} from "./input";
import {TileRegistry} from "./tilemap";
import {HeroMonster, heroMonsterNames} from "./hero";
import {WeaponConfig} from "./drop";
import {DungeonScene} from "./dungeon";

export class SelectHeroScene implements Scene {
  private readonly rng: RNG;
  private readonly joystick: Joystick;
  private readonly registry: TileRegistry;
  private readonly controller: SceneController;

  private selected = 0;

  constructor(rng: RNG, joystick: Joystick, registry: TileRegistry, controller: SceneController) {
    this.rng = rng;
    this.joystick = joystick;
    this.registry = registry;
    this.controller = controller;
  }

  render(render: Render): void {
    this.handleInput();

    const time = new Date().getTime();
    const c_w = render.canvas.width;
    const c_h = render.canvas.height;

    render.ctx.save();
    render.ctx.fillStyle = "rgb(34,34,34)";
    render.ctx.fillRect(0, 0, c_w, c_h);

    this.renderTitle(render);
    this.renderHeroes(render, time);

    render.ctx.restore();
  }

  renderTitle(render: Render) {
    render.ctx.textAlign = "center";
    render.ctx.textBaseline = "top";
    render.ctx.font = "100px silkscreennormal";
    render.ctx.fillStyle = "rgb(255,255,255)";
    render.ctx.fillText("ROGUELIKE DUNGEON", render.canvas.width >> 1, 100);
  }

  renderHeroes(render: Render, time: number) {
    const c_w = render.canvas.width;
    const c_h = render.canvas.height;

    const total = heroMonsterNames.length;
    const width = Math.floor(c_w / total);
    const margin = Math.floor(width / 10);

    for (let i = 0; i < total; i++) {
      const heroName = heroMonsterNames[i];
      const tile = this.registry.get(heroName + "_idle_anim");

      const d_x = width * i + margin;
      const d_y = (c_h >> 1) - (width >> 1);

      const d_w = width - (margin << 1);
      const scale = Math.floor(d_w / tile.w);
      const d_h = Math.floor(tile.h * scale);

      let sw = 0;
      if (tile.isAnim && tile.numOfFrames > 1) {
        const sf = Math.floor(time / 100) % tile.numOfFrames;
        sw = sf * tile.w;
      }
      if (this.selected === i) {
        render.ctx.fillStyle = "rgb(90, 90, 90)";
      } else {
        render.ctx.fillStyle = "rgb(50, 50, 50)";
      }

      render.ctx.fillRect(d_x - (margin >> 1), d_y + margin, d_w + margin, d_h);

      render.ctx.drawImage(tile.tileSet, tile.x + sw, tile.y, tile.w, tile.h, d_x, d_y, d_w, d_h);

      if (this.selected === i) {
        render.ctx.textAlign = "center";
        render.ctx.textBaseline = "top";
        render.ctx.font = "20px silkscreennormal";
        render.ctx.fillStyle = "rgb(255,255,255)";
        render.ctx.fillText(heroName, d_x + (d_w >> 1), d_y - 20, d_w);
      }
    }
  }

  handleInput() {
    if (!this.joystick.moveLeft.processed) {
      this.joystick.moveLeft.processed = true;
      if (this.selected === 0) this.selected = heroMonsterNames.length - 1;
      else this.selected--;
    }
    if (!this.joystick.moveRight.processed) {
      this.joystick.moveRight.processed = true;
      this.selected = (this.selected + 1) % heroMonsterNames.length;
    }
    if (!this.joystick.hit.processed) {
      this.joystick.hit.processed = true;
      const name = heroMonsterNames[this.selected];
      const hero_weapon = WeaponConfig.configs[0].create(this.registry);
      const hero = new HeroMonster(this.registry, this.joystick, 0, 0, name, hero_weapon, 0);
      const scene = new DungeonScene(this.rng, this.joystick, this.registry, this.controller, hero);
      this.controller.setScene(scene);
    }
  }
}