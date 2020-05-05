import {Button, Colors, SelectableGrid, VStack} from "../ui";
import {ModalScene, SceneController} from "../scene";
import {Hero} from "../characters";

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