import * as PIXI from "pixi.js";
import {UIButton, HStack, UISelectableGrid, VStack, Colors} from "../ui";
import {SceneController} from "./SceneController";

export class ModalScene extends VStack {
  protected readonly _controller: SceneController;
  protected readonly _selectable: UISelectableGrid;

  protected readonly _closeButton: UIButton;
  protected readonly _title: PIXI.BitmapText;

  protected constructor(controller: SceneController, title: string) {
    super({backgroundColor: Colors.background});
    this._controller = controller;
    this._selectable = new UISelectableGrid(controller.joystick);

    const head = new HStack({padding: 0});
    this.addChild(head);

    this._closeButton = new UIButton({label: "X", width: 40, height: 32});
    head.addChild(this._closeButton);
    this._selectable.set(0, 0, this._closeButton, () => this._controller.closeModal());

    this._title = new PIXI.BitmapText(title, {font: {name: "alagard", size: 32}});
    head.addChild(this._title);
  }

  init(): void {
    this._controller.ticker.add(this._selectable.handleInput, this._selectable);
  }

  destroy(): void {
    this._controller.ticker.remove(this._selectable.handleInput, this._selectable);
    super.destroy({children: true});
  }
}