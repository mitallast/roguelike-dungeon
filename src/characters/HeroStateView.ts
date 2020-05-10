import * as PIXI from "pixi.js";
import {UIBarView, Colors, Sizes} from "../ui";
import {Hero} from "./Hero";

export class HeroStateView extends PIXI.Container {
  private readonly _heroState: Hero;
  private readonly _health: UIBarView;
  private readonly _xp: UIBarView;
  private readonly _coins: PIXI.BitmapText;

  private readonly _fixedHPSize: boolean;
  private readonly _hpBarSize: number;
  private readonly _maxBarSize: number;
  private readonly _maxBarInnerSize: number;

  constructor(heroState: Hero, options: {
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

    this._heroState = heroState;
    this._health = new UIBarView({
      color: Colors.uiRed,
      width: this._maxBarInnerSize,
      valueMax: heroState.healthMax.get(),
    });
    this._xp = new UIBarView({
      color: Colors.uiYellow,
      width: this._maxBarInnerSize,
      valueMax: heroState.levelXp.get(),
    });
    this._xp.position.set(0, offsetY);

    this._coins = new PIXI.BitmapText("", {font: {name: "alagard", size: 16}});
    this._coins.position.set(0, offsetY * 2);

    super.addChild(this._health, this._xp, this._coins);

    heroState.health.subscribe(this.updateHealth, this);
    heroState.healthMax.subscribe(this.updateHealthMax, this);
    heroState.level.subscribe(this.updateXp, this);
    heroState.levelXp.subscribe(this.updateXp, this);
    heroState.skillPoints.subscribe(this.updateXp, this);
    heroState.xp.subscribe(this.updateXp, this);
    heroState.coins.subscribe(this.updateCoins, this);
  }

  destroy(): void {
    super.destroy();
    this._heroState.health.unsubscribe(this.updateHealth, this);
    this._heroState.healthMax.unsubscribe(this.updateHealthMax, this);
    this._heroState.level.unsubscribe(this.updateXp, this);
    this._heroState.levelXp.unsubscribe(this.updateXp, this);
    this._heroState.skillPoints.unsubscribe(this.updateXp, this);
    this._heroState.xp.unsubscribe(this.updateXp, this);
    this._heroState.coins.unsubscribe(this.updateCoins, this);
  }

  private updateHealthMax(healthMax: number): void {
    const health = this._heroState.health.get();
    this._health.valueMax = healthMax;
    this._health.label = `${health}/${healthMax}`;
    if (!this._fixedHPSize) {
      this._health.rectWidth = this._hpBarSize * healthMax;
    }
  }

  private updateHealth(health: number): void {
    const healthMax = this._heroState.healthMax.get();
    this._health.value = health;
    this._health.label = `${health}/${healthMax}`;
  }

  private updateXp(): void {
    const heroState = this._heroState;
    const level = heroState.level.get();
    const levelXp = heroState.levelXp.get();
    const skillPoints = heroState.skillPoints.get();
    const xp = heroState.xp.get();
    this._xp.valueMax = levelXp;
    this._xp.value = xp;
    this._xp.label = `L:${level} XP:${xp}/${levelXp} SP:${skillPoints}`;
  }

  private updateCoins(coins: number): void {
    this._coins.text = `$${coins}`;
  }
}