import * as PIXI from "pixi.js";
import {BarView} from "../bar.view";
import {Colors} from "../ui";
import {BossMonster} from "./BossMonster";

export class BossHealthView extends PIXI.Container {
  private readonly _boss: BossMonster;
  private readonly _health: BarView;

  private readonly _widthMax: number;
  private readonly _pointWidth: number;

  private _isDestroyed = false;

  constructor(boss: BossMonster) {
    super();
    this._boss = boss;

    const HEALTH_MAX_WIDTH = 550;
    const HEALTH_WIDTH = 4;
    this._pointWidth = Math.min(HEALTH_WIDTH, HEALTH_MAX_WIDTH / this._boss.healthMax.get());

    this._widthMax = Math.floor(this._pointWidth * this._boss.healthMax.get());

    this._health = new BarView({
      color: Colors.uiRed,
      widthMax: this._widthMax,
      labelCenter: true
    });
    this._health.position.set(-(this._widthMax >> 1), 0);
    this.addChild(this._health);

    this._boss.health.subscribe(this.updateHealth, this);
    this._boss.dead.subscribe(this.updateDead, this);
  }

  destroy(): void {
    if (!this._isDestroyed) {
      this._isDestroyed = true;
      this._boss.health.unsubscribe(this.updateHealth, this);
      this._boss.dead.unsubscribe(this.updateDead, this);
      this._health.destroy();
      super.destroy();
    }
  }

  private updateHealth(health: number): void {
    this._health.width = Math.floor(this._pointWidth * health);
    this._health.label = `${this._boss.name} - ${health}`;
  }

  private updateDead(dead: boolean): void {
    if (dead) {
      this.destroy();
    }
  }
}