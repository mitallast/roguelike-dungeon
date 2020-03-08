import {Scene, SceneController} from "./scene";
import {GenerateOptions} from "./dungeon.generator";
import {HeroState, HeroStateView} from "./hero";
import {Colors} from "./colors";
// @ts-ignore
import * as PIXI from "pixi.js";

const margin = 40;
const tile_w = 16;
const tile_h = 28;

export class UpdateHeroScene implements Scene {
  private readonly controller: SceneController;
  private readonly hero: HeroState;
  private readonly options: GenerateOptions;

  private title: PIXI.BitmapText;
  private sprite: PIXI.AnimatedSprite;
  private state: HeroStateView;

  private selectedButton: number;
  private buttons: [Button, () => void][];

  constructor(controller: SceneController, options: GenerateOptions) {
    this.controller = controller;
    this.hero = options.hero;
    this.options = options;
  }

  destroy(): void {
    this.title?.destroy();
    this.sprite?.destroy();
    this.state?.destroy();
    for (let [button] of this.buttons) {
      (button as PIXI.Container).destroy();
    }
    this.sprite = null;
    this.title = null;
    this.state = null;
    this.buttons = [];
  }

  init(): void {
    this.renderTitle();
    this.renderIcon();
    this.renderState();
    this.renderButtons();
  }

  update(delta: number): void {
    this.handleInput();
  }

  private renderTitle() {
    this.title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    this.title.anchor = 0.5;
    this.title.position.set(this.controller.app.screen.width >> 1, 64);
    this.controller.stage.addChild(this.title);
  }

  private renderIcon() {
    const scale = 10;
    this.sprite = this.controller.resources.animated(this.hero.name + "_idle");
    this.sprite.play();
    this.sprite.animationSpeed = 0.2;
    this.sprite.width = tile_w * scale;
    this.sprite.height = tile_h * scale;
    this.sprite.position.set(margin, 128 + margin);
    this.controller.stage.addChild(this.sprite);
  }

  private renderState() {
    this.state = new HeroStateView(this.hero);
    (this.state as PIXI.Container).position.set(300, 128 + margin);
    this.controller.stage.addChild(this.state);
  }

  private renderButtons() {
    this.selectedButton = 1;
    this.buttons = [
      [new Button({label: "Increase health"}), () => this.increaseHealth()],
      [new Button({label: "Continue ..."}), () => this.continueGame()],
    ];
    let i = 0;
    for (let [button] of this.buttons) {
      (button as PIXI.Container).position.set(300, 400 + i * (8 + 24));
      this.controller.stage.addChild(button);
      i++;
    }
    this.updateSelected();
  }

  private increaseHealth(): void {
    this.hero.increaseHealth();
  }

  private continueGame(): void {
    this.controller.generateDungeon(this.options);
  }

  private handleInput() {
    const joystick = this.controller.joystick;

    if (!joystick.moveUp.processed) {
      joystick.moveUp.processed = true;
      if (this.selectedButton === 0) this.selectedButton = this.buttons.length - 1;
      else this.selectedButton--;
      this.updateSelected();
    }
    if (!joystick.moveDown.processed) {
      joystick.moveDown.processed = true;
      this.selectedButton = (this.selectedButton + 1) % this.buttons.length;
      this.updateSelected();
    }
    if (!joystick.hit.processed) {
      joystick.hit.reset();
      this.action();
    }
  }

  private updateSelected(): void {
    console.log("update selected");
    let i = 0;
    for (let [button] of this.buttons) {
      button.selected = i === this.selectedButton;
      i++;
    }
  }

  private action(): void {
    let [button, callback] = this.buttons[this.selectedButton];
    callback();
  }
}

export class Button extends PIXI.Container {
  private readonly _width: number;
  private readonly _height: number;
  private readonly _text: PIXI.BitmapText;
  private readonly _bg: PIXI.Graphics;

  constructor(options: {
    label: string,
    selected?: boolean,
    width?: number
    height?: number
  }) {
    super();
    this._width = options.width || 200;
    this._height = options.height || 24;
    this._bg = new PIXI.Graphics();
    this._text = new PIXI.BitmapText(options.label, {font: {name: "alagard", size: 16}});
    this._text.anchor = new PIXI.Point(0.5, 0.5);
    this._text.position.set(this._width >> 1, this._height >> 1);
    this.selected = options.selected || false;
    super.addChild(this._bg, this._text);
  }

  set selected(selected: boolean) {
    this._bg
      .clear()
      .beginFill(selected ? Colors.uiSelected : Colors.uiNotSelected)
      .drawRect(0, 0, this._width, this._height)
      .endFill();
  }
}