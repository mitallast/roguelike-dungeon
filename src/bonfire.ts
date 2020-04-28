import {DungeonMap, DungeonObject, DungeonZIndexes} from "./dungeon.map";
import {Hero, HeroAI} from "./hero";
import {LightType} from "./dungeon.light";
import {ModalScene, SceneController} from "./scene";
import {Button, Layout, SelectableGrid, Sizes} from "./ui";
import * as PIXI from 'pixi.js';

const TILE_SIZE = 16;

export enum BonfireState {
  UNLIT = 0,
  LIGHT = 1,
  LIT = 2
}

export class Bonfire implements DungeonObject {
  private readonly dungeon: DungeonMap;
  private _sprite: PIXI.AnimatedSprite;
  private _state: BonfireState;

  readonly x: number;
  readonly y: number;
  readonly width: number = 1;
  readonly height: number = 1;

  readonly static: boolean = true;
  readonly interacting: boolean = true;

  get state(): BonfireState {
    return this._state;
  }

  constructor(dungeon: DungeonMap, x: number, y: number, light: boolean) {
    this.dungeon = dungeon;
    this.x = x;
    this.y = y;
    this._state = BonfireState.UNLIT;
    this._sprite = this.dungeon.animated(this.x, this.y, `bonfire_unlit`);
    this._sprite.zIndex = DungeonZIndexes.static + this.y * DungeonZIndexes.row;
    this.dungeon.set(this.x, this.y, this);

    if (light) this.light();
  }

  destroy(): void {
    this.dungeon.remove(this.x, this.y, this);
    this._sprite.destroy();
  }

  interact(hero: HeroAI): void {
    switch (this._state) {
      case BonfireState.UNLIT:
        hero.character.bonfires.add(this.dungeon.level);
        this.light();
        break;
      case BonfireState.LIGHT:
      case BonfireState.LIT:
        this.dungeon.controller.showBonfire(hero.character);
        break;
    }
  }

  collide(_: DungeonObject): boolean {
    return true;
  }

  private light(): void {
    if (this._state === BonfireState.UNLIT) {
      this._state = BonfireState.LIGHT;
      this._sprite.destroy();
      this._sprite = this.dungeon.animated(this.x, this.y, "bonfire_light");
      this._sprite.zIndex = DungeonZIndexes.static + this.y * DungeonZIndexes.row;
      this._sprite.loop = false;
      this._sprite.onComplete = () => this.lit();
      this.dungeon.light.addLight(
        {
          x: this.x * TILE_SIZE + 8,
          y: this.y * TILE_SIZE - TILE_SIZE,
        },
        LightType.BONFIRE
      );
    }
  }

  private lit(): void {
    this._state = BonfireState.LIT;
    this._sprite?.destroy();
    this._sprite = this.dungeon.animated(this.x, this.y, "bonfire_lit");
    this._sprite.zIndex = DungeonZIndexes.static + this.y * DungeonZIndexes.row;
  }
}

export class BonfireDialogModal implements ModalScene {
  private readonly controller: SceneController;
  private readonly hero: Hero;

  private container: PIXI.Container | null = null;
  private background: PIXI.Graphics | null = null;
  private selectable: SelectableGrid | null = null;

  constructor(controller: SceneController, hero: Hero) {
    this.controller = controller;
    this.hero = hero;
  }

  init(): void {
    const width = 400;
    const height = 400;

    const button_height = 32;
    const button_text_size = 24;

    this.selectable = new SelectableGrid(this.controller.joystick);

    this.background = new PIXI.Graphics();
    this.background.beginFill(0x000000).drawRect(0, 0, width, height).endFill();
    this.background.zIndex = 0;

    this.container = new PIXI.Container();
    this.container.addChild(this.background);
    this.container.sortChildren();
    this.container.position.set(
      (this.controller.app.screen.width >> 1) - (width >> 1),
      (this.controller.app.screen.height >> 1) - (height >> 1),
    );
    this.controller.stage.addChild(this.container);

    this.controller.app.ticker.add(this.handleInput, this);

    const layout = new Layout();
    layout.offset(Sizes.uiMargin, Sizes.uiMargin);
    layout.commit();

    let y = 0;
    const addButton = (label: string, action: () => void) => {
      const button = new Button({
        label: label,
        width: width - Sizes.uiMargin * 2,
        height: button_height,
        textSize: button_text_size
      });
      this.container!.addChild(button);
      button.position.set(layout.x, layout.y);
      layout.offset(0, button_height);
      layout.offset(0, Sizes.uiMargin);
      this.selectable!.set(0, y, button, action);
      y++;
    };
    const levels = [...this.hero.bonfires].sort((a, b) => a - b);
    for (const level of levels) {
      addButton(`Level ${level}`, () => this.goto(level));
    }
    addButton(`Cancel`, () => this.cancel());
  }

  private goto(level: number): void {
    this.controller.closeModal();
    this.controller.generateDungeon({
      hero: this.hero,
      level: level
    })
  }

  private cancel(): void {
    this.controller.closeModal();
  }

  private handleInput(): void {
    this.selectable?.handleInput();
  }

  destroy(): void {
    this.controller.app.ticker.remove(this.handleInput, this);
    this.container?.destroy();
    this.container = null;
    this.background?.destroy();
    this.background = null;
    this.selectable = null;
  }
}