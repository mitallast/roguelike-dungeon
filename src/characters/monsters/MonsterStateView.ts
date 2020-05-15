import * as PIXI from "pixi.js";
import {UIBarView, Colors} from "../../ui";
import {Monster} from "./Monster";

const HEALTH_MAX_WIDTH = 550;
const HEALTH_WIDTH = 4;

export class MonsterStateView extends PIXI.Container {
  private readonly _monster: Monster;
  private readonly _healthBar: UIBarView;
  private readonly _staminaBar: UIBarView;

  constructor(monster: Monster) {
    super();
    this._monster = monster;

    const width = Math.floor(Math.min(
      HEALTH_WIDTH * monster.state.healthMax.get(),
      HEALTH_MAX_WIDTH
    ));

    this._healthBar = new UIBarView({
      color: Colors.uiRed,
      width: width,
      valueMax: monster.state.healthMax.get(),
      center: true,
    });
    this._healthBar.position.set(-(this._healthBar.width >> 1), 0);
    this.addChild(this._healthBar);

    this._staminaBar = new UIBarView({
      color: Colors.uiGreen,
      width: width,
      valueMax: monster.state.staminaMax.get(),
      center: true,
    });
    this._staminaBar.position.set(-(this._staminaBar.width >> 1), 32);
    this.addChild(this._staminaBar);

    this._monster.state.health.subscribe(this.updateHealth, this);
    this._monster.state.stamina.subscribe(this.updateStamina, this);
    this._monster.state.dead.subscribe(this.updateDead, this);
  }

  destroy(): void {
    this._monster.state.health.unsubscribe(this.updateHealth, this);
    this._monster.state.dead.unsubscribe(this.updateDead, this);
    this._healthBar.destroy();
    super.destroy();
  }

  private updateHealth(health: number): void {
    this._healthBar.value = health;
    this._healthBar.label = `${this._monster.state.name} - ${health.toFixed(1)}`;
  }

  private updateStamina(stamina: number): void {
    this._staminaBar.value = stamina;
    this._staminaBar.label = `${stamina.toFixed(1)}/${this._monster.state.staminaMax.get()}`;
  }

  private updateDead(dead: boolean): void {
    if (dead) {
      this.destroy();
    }
  }
}