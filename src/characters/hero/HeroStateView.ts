import * as PIXI from "pixi.js";
import {UIBarView, Colors, Sizes} from "../../ui";
import {Hero} from "./Hero";

export class HeroStateView extends PIXI.Container {
  private readonly _hero: Hero;
  private readonly _healthBar: UIBarView;
  private readonly _staminaBar: UIBarView;
  private readonly _xpBar: UIBarView;
  private readonly _coins: PIXI.BitmapText;

  private readonly _fixedHPSize: boolean;
  private readonly _hpBarSize: number;
  private readonly _maxBarSize: number;
  private readonly _maxBarInnerSize: number;

  constructor(hero: Hero, options: {
    fixedHPSize: boolean;
    hpBarSize?: number;
    maxBarSize?: number;
  }) {
    super();
    this._fixedHPSize = options.fixedHPSize;
    this._hpBarSize = options.hpBarSize || ((256 - (Sizes.uiBorder << 1)) / 30);
    this._maxBarSize = options.maxBarSize || 256;
    this._maxBarInnerSize = this._maxBarSize - (Sizes.uiBorder << 1);

    const barHeight = 18 + (Sizes.uiBorder << 1);
    const offsetY = barHeight + Sizes.uiMargin;

    this._hero = hero;
    this._healthBar = new UIBarView({
      color: Colors.uiRed,
      width: this._maxBarInnerSize,
      valueMax: hero.state.healthMax.get(),
    });

    this._staminaBar = new UIBarView({
      color: Colors.uiGreen,
      width: this._maxBarInnerSize,
      valueMax: hero.state.staminaMax.get(),
    });
    this._staminaBar.position.set(0, offsetY);

    this._xpBar = new UIBarView({
      color: Colors.uiYellow,
      width: this._maxBarInnerSize,
      valueMax: hero.state.levelXp.get(),
    });
    this._xpBar.position.set(0, offsetY * 2);

    this._coins = new PIXI.BitmapText("", {font: {name: "alagard", size: 16}});
    this._coins.position.set(0, offsetY * 3);

    super.addChild(this._healthBar, this._staminaBar, this._xpBar, this._coins);

    hero.state.healthMax.subscribe(this.updateHealthMax, this);
    hero.state.health.subscribe(this.updateHealth, this);
    hero.state.staminaMax.subscribe(this.updateStaminaMax, this);
    hero.state.stamina.subscribe(this.updateStamina, this);
    hero.state.level.subscribe(this.updateXp, this);
    hero.state.levelXp.subscribe(this.updateXp, this);
    hero.state.skillPoints.subscribe(this.updateXp, this);
    hero.state.xp.subscribe(this.updateXp, this);
    hero.state.coins.subscribe(this.updateCoins, this);
  }

  destroy(): void {
    super.destroy();
    this._hero.state.healthMax.unsubscribe(this.updateHealthMax, this);
    this._hero.state.health.unsubscribe(this.updateHealth, this);
    this._hero.state.staminaMax.unsubscribe(this.updateStaminaMax, this);
    this._hero.state.stamina.unsubscribe(this.updateStamina, this);
    this._hero.state.level.unsubscribe(this.updateXp, this);
    this._hero.state.levelXp.unsubscribe(this.updateXp, this);
    this._hero.state.skillPoints.unsubscribe(this.updateXp, this);
    this._hero.state.xp.unsubscribe(this.updateXp, this);
    this._hero.state.coins.unsubscribe(this.updateCoins, this);
  }

  private updateHealthMax(healthMax: number): void {
    const health = this._hero.state.health.get();
    this._healthBar.valueMax = healthMax;
    this._healthBar.label = `${health.toFixed(1)}/${healthMax}`;
    if (!this._fixedHPSize) {
      this._healthBar.rectWidth = this._hpBarSize * healthMax;
    }
  }

  private updateHealth(health: number): void {
    const healthMax = this._hero.state.healthMax.get();
    this._healthBar.value = health;
    this._healthBar.label = `${health.toFixed(1)}/${healthMax}`;
  }

  private updateStaminaMax(staminaMax: number): void {
    const stamina = this._hero.state.stamina.get();
    this._staminaBar.valueMax = staminaMax;
    this._staminaBar.label = `${stamina.toFixed(1)}/${staminaMax}`;
  }

  private updateStamina(stamina: number): void {
    const staminaMax = this._hero.state.staminaMax.get();
    this._staminaBar.value = stamina;
    this._staminaBar.label = `${stamina.toFixed(1)}/${staminaMax}`;
  }

  private updateXp(): void {
    const hero = this._hero;
    const level = hero.state.level.get();
    const levelXp = hero.state.levelXp.get();
    const skillPoints = hero.state.skillPoints.get();
    const xp = hero.state.xp.get();
    this._xpBar.valueMax = levelXp;
    this._xpBar.value = xp;
    this._xpBar.label = `L:${level} XP:${xp}/${levelXp} SP:${skillPoints}`;
  }

  private updateCoins(coins: number): void {
    this._coins.text = `$${coins}`;
  }
}