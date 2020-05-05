import {DungeonMap, DungeonObject, DungeonZIndexes} from "./dungeon.map";
import {Hero, HeroAI} from "./characters";
import {LightType} from "./dungeon.light";
import {ModalScene, SceneController} from "./scene";
import {Button, Colors, SelectableGrid, VStack} from "./ui";
import * as PIXI from 'pixi.js';

const TILE_SIZE = 16;

export enum BonfireState {
  UNLIT = 0,
  LIGHT = 1,
  LIT = 2
}

export class DungeonBonfire implements DungeonObject {
  private readonly _dungeon: DungeonMap;
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
    this._dungeon = dungeon;
    this.x = x;
    this.y = y;
    this._state = BonfireState.UNLIT;
    this._sprite = this._dungeon.animated(this.x, this.y, `bonfire_unlit`);
    this._sprite.zIndex = DungeonZIndexes.static + this.y * DungeonZIndexes.row;
    this._dungeon.set(this.x, this.y, this);

    if (light) this.light();
  }

  destroy(): void {
    this._dungeon.remove(this.x, this.y, this);
    this._sprite.destroy();
  }

  interact(hero: HeroAI): void {
    switch (this._state) {
      case BonfireState.UNLIT:
        hero.character.bonfires.add(this._dungeon.level);
        this._dungeon.controller.showBanner({
          text: 'BONFIRE LIT',
          color: Colors.uiYellow
        });
        this.light();
        break;
      case BonfireState.LIGHT:
      case BonfireState.LIT:
        this._dungeon.controller.showBonfire(hero.character);
        break;
    }
  }

  collide(): boolean {
    return true;
  }

  private light(): void {
    if (this._state === BonfireState.UNLIT) {
      this._state = BonfireState.LIGHT;
      this._sprite.destroy();
      this._sprite = this._dungeon.animated(this.x, this.y, "bonfire_light");
      this._sprite.zIndex = DungeonZIndexes.static + this.y * DungeonZIndexes.row;
      this._sprite.loop = false;
      this._sprite.onComplete = (): void => this.lit();
      this._dungeon.light.addLight(
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
    this._sprite = this._dungeon.animated(this.x, this.y, "bonfire_lit");
    this._sprite.zIndex = DungeonZIndexes.static + this.y * DungeonZIndexes.row;
  }
}

export class DungeonBonfireModal extends VStack implements ModalScene {
  private readonly _controller: SceneController;
  private readonly _hero: Hero;

  private _selectable: SelectableGrid | null = null;

  constructor(controller: SceneController, hero: Hero) {
    super({background: {color: Colors.background}});
    this._controller = controller;
    this._hero = hero;
  }

  destroy(): void {
    this._controller.app.ticker.remove(this.handleInput, this);
    this._selectable = null;
    super.destroy({children: true});
  }

  init(): void {
    this._selectable = new SelectableGrid(this._controller.joystick);

    let y = 0;
    const addButton = (label: string, action: () => void): void => {
      const button = new Button({
        label: label,
        width: 400,
        height: 32,
        textSize: 24
      });
      this.addChild(button);
      this._selectable!.set(0, y, button, action);
      y++;
    };
    const levels = [...this._hero.bonfires].sort((a: number, b: number) => a - b);
    for (const level of levels) {
      addButton(`Level ${level}`, () => this.goto(level));
    }
    addButton(`Cancel`, () => this.cancel());

    this._controller.stage.addChild(this);
    this._controller.app.ticker.add(this.handleInput, this);

    this.position.set(
      (this._controller.app.screen.width >> 1) - (this.width >> 1),
      (this._controller.app.screen.height >> 1) - (this.height >> 1),
    );
  }

  private goto(level: number): void {
    this._controller.closeModal();
    this._controller.generateDungeon({
      hero: this._hero,
      level: level
    })
  }

  private cancel(): void {
    this._controller.closeModal();
  }

  private handleInput(): void {
    this._selectable?.handleInput();
  }
}