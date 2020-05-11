import * as PIXI from "pixi.js";
import {UIBarView, Colors} from "../ui";
import {Monster} from "./Monster";

const HEALTH_MAX_WIDTH = 550;
const HEALTH_WIDTH = 4;

export class BossHealthView extends PIXI.Container {
  private readonly _monster: Monster;
  private readonly _health: UIBarView;

  constructor(boss: Monster) {
    super();
    this._monster = boss;

    const width = Math.floor(Math.min(
      HEALTH_WIDTH * boss.healthMax.get(),
      HEALTH_MAX_WIDTH
    ));

    this._health = new UIBarView({
      color: Colors.uiRed,
      width: width,
      valueMax: boss.healthMax.get(),
      center: true,
    });
    this._health.position.set(-(this._health.width >> 1), 0);
    this.addChild(this._health);

    this._monster.health.subscribe(this.updateHealth, this);
    this._monster.dead.subscribe(this.updateDead, this);
  }

  destroy(): void {
    this._monster.health.unsubscribe(this.updateHealth, this);
    this._monster.dead.unsubscribe(this.updateDead, this);
    this._health.destroy();
    super.destroy();
  }

  private updateHealth(health: number): void {
    this._health.value = health;
    this._health.label = `${this._monster.name} - ${health}`;
  }

  private updateDead(dead: boolean): void {
    if (dead) {
      this.destroy();
    }
  }
}