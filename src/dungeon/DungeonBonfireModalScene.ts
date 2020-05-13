import {ModalScene, SceneController} from "../scene";
import {UIButton} from "../ui";
import {HeroState} from "../characters/hero";

export class DungeonBonfireModal extends ModalScene {
  private readonly _hero: HeroState;

  constructor(controller: SceneController, hero: HeroState) {
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
    const levels = this._hero.dungeons.bonfires().sort((a: number, b: number) => a - b);
    for (const level of levels) {
      addButton(`Level ${level}`, () => {
        this._controller.closeModal();
        this._controller.generateDungeon({
          hero: this._hero.name,
          level: level
        })
      });
    }
    this._selectable.select(0, 1);
  }
}