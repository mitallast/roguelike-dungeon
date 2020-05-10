import {ModalScene, SceneController} from "../scene";
import {UIButton} from "../ui";
import {Hero} from "../characters";

export class DungeonBonfireModal extends ModalScene {
  private readonly _hero: Hero;

  constructor(controller: SceneController, hero: Hero) {
    super(controller, "Bonfire");
    this._hero = hero;
  }

  init(): void {
    super.init();
    let y = 1;
    const addButton = (label: string, action: () => void): void => {
      const button = new UIButton({
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
      addButton(`Level ${level}`, () => {
        this._controller.closeModal();
        this._controller.generateDungeon({
          hero: this._hero,
          level: level
        })
      });
    }
    this._selectable.select(0, 1);
  }
}