import * as PIXI from "pixi.js";
import {BarView} from "../bar.view";
import {Colors, Sizes} from "../ui";
import {Hero} from "./Hero";

export class HeroStateView extends PIXI.Container {
  private readonly _heroState: Hero;
  private readonly _health: BarView;
  private readonly _xp: BarView;
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
    this._hpBarSize = options.hpBarSize || 8;
    this._maxBarSize = options.maxBarSize || 256;
    this._maxBarInnerSize = this._maxBarSize - (Sizes.uiBorder << 1);

    const barHeight = 18 + (Sizes.uiBorder << 1);
    const offsetY = barHeight + Sizes.uiMargin;

    this._heroState = heroState;
    this._health = new BarView({
      color: Colors.uiRed,
      width: 0,
      widthMax: this._maxBarInnerSize
    });
    this._xp = new BarView({
      color: Colors.uiYellow,
      width: 0,
      widthMax: this._maxBarInnerSize
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
    if (!this._fixedHPSize) {
      this._health.widthMax = this._hpBarSize * healthMax;
    }
    this._health.label = `${health}/${healthMax}`;
  }

  private updateHealth(health: number): void {
    const healthMax = this._heroState.healthMax.get();
    if (this._fixedHPSize) {
      this._health.width = Math.floor(this._maxBarInnerSize * health / healthMax);
    } else {
      this._health.width = this._hpBarSize * health;
    }
    this._health.label = `${health}/${healthMax}`;
  }

  private updateXp(): void {
    const level = this._heroState.level.get();
    const levelXp = this._heroState.levelXp.get();
    const skillPoints = this._heroState.skillPoints.get();
    const xp = this._heroState.xp.get();

    this._xp.widthMax = this._maxBarInnerSize;
    this._xp.width = Math.floor(this._maxBarInnerSize * xp / levelXp);
    this._xp.label = `L:${level} XP:${xp}/${levelXp} SP:${skillPoints}`;
  }

  private updateCoins(coins: number): void {
    this._coins.text = `$${coins}`;
  }
}