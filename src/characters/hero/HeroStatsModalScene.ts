import {ModalScene, SceneController} from "../../scene";
import {HeroState} from "./HeroState";
import {Colors, Sizes, UIButton, UIFixedSizeContainer, UIGrid, UISelectableGrid} from "../../ui";

export class HeroStatsModalScene extends ModalScene {
  private readonly _hero: HeroState;

  private _level!: PIXI.BitmapText;
  private _xp!: PIXI.BitmapText;
  private _skillPoints!: PIXI.BitmapText;

  private _healthStats!: HealthStatsController;
  private _staminaStats!: StaminaStatsController;
  private _baseDamageStats!: BaseDamageStatsController;
  private _speedStats!: SpeedStatsController;

  private _grid!: UIGrid;

  constructor(controller: SceneController, hero: HeroState) {
    super(controller, "Hero stats");
    this._hero = hero;
  }

  init(): void {
    super.init();
    this._controller.ticker.add(this.handleInput, this);

    const grid = this._grid = new UIGrid({spacing: Sizes.uiMargin, padding: 0});
    this.addChild(grid);

    const label = (row: number, col: number, title: string): void => {
      const text = new PIXI.BitmapText(title, {font: {name: "alagard", size: 16}, tint: Colors.uiYellow});
      grid.setGrid(row, col, text);
    };
    const value = (row: number, col: number): PIXI.BitmapText => {
      const text = new PIXI.BitmapText("", {font: {name: "alagard", size: 16}});
      text.anchor = new PIXI.Point(1, 0);
      text.position.set(100, 0);
      const wrapper = new UIFixedSizeContainer({width: 100});
      wrapper.addChild(text)
      grid.setGrid(row, col, wrapper);
      return text;
    };

    label(0, 0, "Level");
    label(1, 0, "XP");
    label(2, 0, "Skill points");
    this._level = value(0, 1);
    this._xp = value(1, 1);
    this._skillPoints = value(2, 1);

    this._healthStats = new HealthStatsController(this._hero, grid, 3, this._selectable, 1);
    this._staminaStats = new StaminaStatsController(this._hero, grid, 4, this._selectable, 2);
    this._baseDamageStats = new BaseDamageStatsController(this._hero, grid, 5, this._selectable, 3);
    this._speedStats = new SpeedStatsController(this._hero, grid, 6, this._selectable, 4);

    this._hero.level.subscribe(this.updateLevel, this);
    this._hero.levelXp.subscribe(this.updateLevelXp, this);
    this._hero.xp.subscribe(this.updateXp, this);
    this._hero.skillPoints.subscribe(this.updateSkillPoints, this);
  }

  private updateLevel(level: number): void {
    this._level.text = `${level}`;
    this._grid.updateLayout();
  }

  private updateLevelXp(levelXp: number): void {
    this._xp.text = `${this._hero.xp.get()}/${levelXp}`;
    this._grid.updateLayout();
  }

  private updateXp(xp: number): void {
    this._xp.text = `${xp}/${this._hero.levelXp.get()}`;
    this._grid.updateLayout();
  }

  private updateSkillPoints(skillPoints: number): void {
    this._skillPoints.text = `${skillPoints}`;
    this._grid.updateLayout();
  }

  destroy(): void {
    this._controller.ticker.remove(this.handleInput, this);
    this._hero.level.unsubscribe(this.updateLevel, this);
    this._hero.levelXp.unsubscribe(this.updateLevelXp, this);
    this._hero.xp.unsubscribe(this.updateXp, this);
    this._hero.skillPoints.unsubscribe(this.updateSkillPoints, this);

    this._healthStats.destroy();
    this._staminaStats.destroy();
    this._baseDamageStats.destroy();
    this._speedStats.destroy();
    super.destroy();
  }

  private handleInput(): void {
    if (this._controller.joystick.stats.once()) {
      this._controller.closeModal();
      return;
    }
  }
}

abstract class StatsController {
  protected readonly _hero: HeroState;
  protected readonly _label: PIXI.BitmapText;
  protected readonly _text: PIXI.BitmapText;
  protected readonly _grid: UIGrid;
  protected readonly _gridRow: number;
  protected readonly _selectable: UISelectableGrid;
  protected readonly _selectableRow: number;

  private readonly _stack: number[];
  private readonly _decrease: UIButton;
  private readonly _increase: UIButton;
  private _decreaseEnabled: boolean = false;
  private _increaseEnabled: boolean = false;

  protected constructor(
    hero: HeroState,
    label: string,
    grid: UIGrid,
    gridRow: number,
    selectable: UISelectableGrid,
    selectableRow: number
  ) {
    this._hero = hero;
    this._label = new PIXI.BitmapText(label, {font: {name: "alagard", size: 16}, tint: Colors.uiYellow});
    this._text = new PIXI.BitmapText(label, {font: {name: "alagard", size: 16}});
    this._text.anchor = new PIXI.Point(1, 0);
    this._text.position.set(100, 0);
    const wrapper = new UIFixedSizeContainer({width: 100});
    wrapper.addChild(this._text);

    this._stack = [];
    this._decrease = new UIButton({label: "-", width: 18, height: 18});
    this._increase = new UIButton({label: "+", width: 18, height: 18});
    this._grid = grid;
    this._gridRow = gridRow;
    this._selectable = selectable;
    this._selectableRow = selectableRow;

    this._grid.setGrid(this._gridRow, 0, this._label);
    this._grid.setGrid(this._gridRow, 1, wrapper);
    this._grid.setGrid(this._gridRow, 2, this._decrease);
    this._grid.setGrid(this._gridRow, 3, this._increase);

    this._selectable.set(0, this._selectableRow, this._decrease, () => {
      if (this._decreaseEnabled) {
        this.onDecrease()
      }
    });
    this._selectable.set(1, this._selectableRow, this._increase, () => {
      if (this._increaseEnabled) {
        this.onIncrease()
      }
    });
    this.disableDecrease();
    this.disableIncrease();

    this._hero.skillPoints.subscribe(this.updateSkillPoints, this);
  }

  destroy(): void {
    this._hero.skillPoints.unsubscribe(this.updateSkillPoints, this);
  }

  private updateSkillPoints(skillPoints: number): void {
    console.log("updateSkillPoints", skillPoints);
    if (skillPoints > 0) {
      this.enableIncrease();
    } else {
      this.disableIncrease();
    }
  }

  private enableDecrease(): void {
    this._decreaseEnabled = true;
    this._decrease.alpha = 1;
  }

  private disableDecrease(): void {
    this._decreaseEnabled = false;
    this._decrease.alpha = 0.5;
  }

  private enableIncrease(): void {
    this._increaseEnabled = true;
    this._increase.alpha = 1;
  }

  private disableIncrease(): void {
    this._increaseEnabled = false;
    this._increase.alpha = 0.5;
  }

  private onDecrease(): void {
    if (this._stack.length === 0) throw "illegal state";
    this._hero.skillPoints.update(sp => sp + 1);
    const prev = this._stack.pop()!;
    this.decrease(prev);
    if (this._stack.length === 0) {
      this.disableDecrease();
    }
  }

  private onIncrease(): void {
    if (this._hero.skillPoints.get() === 0) throw "illegal state";
    this._stack.push(this.current());
    this.increase();
    this._hero.skillPoints.update(sp => sp - 1);
    this.enableDecrease();
  }

  protected abstract current(): number;

  protected abstract decrease(prev: number): void;

  protected abstract increase(): void;
}

class HealthStatsController extends StatsController {
  constructor(
    hero: HeroState,
    grid: UIGrid,
    gridRow: number,
    selectable: UISelectableGrid,
    selectableRow: number,
  ) {
    super(hero, "Health", grid, gridRow, selectable, selectableRow);
    this._hero.healthMax.subscribe(this.updateHealthMax, this);
    this._hero.health.subscribe(this.updateHealth, this);
  }

  destroy(): void {
    super.destroy();
    this._hero.healthMax.unsubscribe(this.updateHealthMax, this);
    this._hero.health.unsubscribe(this.updateHealth, this);
  }

  private updateHealthMax(healthMax: number): void {
    this._text.text = `${this._hero.health.get()}/${healthMax}`;
    this._grid.updateLayout();
  }

  private updateHealth(health: number): void {
    this._text.text = `${health}/${this._hero.healthMax.get()}`;
    this._grid.updateLayout();
  }

  protected decrease(prev: number): void {
    this._hero.healthMax.set(prev);
  }

  protected current(): number {
    return this._hero.healthMax.get();
  }

  protected increase(): void {
    this._hero.increaseHealthMax();
  }
}

class StaminaStatsController extends StatsController {
  constructor(
    hero: HeroState,
    grid: UIGrid,
    gridRow: number,
    selectable: UISelectableGrid,
    selectableRow: number,
  ) {
    super(hero, "Stamina", grid, gridRow, selectable, selectableRow);
    this._hero.staminaMax.subscribe(this.updateStaminaMax, this);
  }

  destroy(): void {
    super.destroy();
    this._hero.staminaMax.unsubscribe(this.updateStaminaMax, this);
  }

  private updateStaminaMax(staminaMax: number): void {
    this._text.text = `${staminaMax}`;
    this._grid.updateLayout();
  }

  protected current(): number {
    return this._hero.staminaMax.get();
  }

  protected decrease(prev: number): void {
    this._hero.staminaMax.set(prev);
  }

  protected increase(): void {
    this._hero.increaseStamina();
  }
}

class BaseDamageStatsController extends StatsController {
  constructor(
    hero: HeroState,
    grid: UIGrid,
    gridRow: number,
    selectable: UISelectableGrid,
    selectableRow: number,
  ) {
    super(hero, "Base damage", grid, gridRow, selectable, selectableRow);
    this._hero.baseDamage.subscribe(this.updateBaseDamage, this);
  }

  destroy(): void {
    super.destroy();
    this._hero.baseDamage.unsubscribe(this.updateBaseDamage, this);
  }

  private updateBaseDamage(baseDamage: number): void {
    this._text.text = `${baseDamage}`;
    this._grid.updateLayout();
  }

  protected current(): number {
    return this._hero.baseDamage.get();
  }

  protected decrease(prev: number): void {
    this._hero.baseDamage.set(prev);
  }

  protected increase(): void {
    this._hero.increaseBaseDamage();
  }
}

class SpeedStatsController extends StatsController {
  constructor(
    hero: HeroState,
    grid: UIGrid,
    gridRow: number,
    selectable: UISelectableGrid,
    selectableRow: number,
  ) {
    super(hero, "Speed", grid, gridRow, selectable, selectableRow);
    this._hero.speed.subscribe(this.updateSpeed, this);
  }

  destroy(): void {
    super.destroy();
    this._hero.speed.unsubscribe(this.updateSpeed, this);
  }

  private updateSpeed(speed: number): void {
    this._text.text = `${speed}`;
    this._grid.updateLayout();
  }

  protected current(): number {
    return this._hero.speed.get();
  }

  protected decrease(prev: number): void {
    this._hero.speed.set(prev);
  }

  protected increase(): void {
    this._hero.increaseSpeed();
  }
}