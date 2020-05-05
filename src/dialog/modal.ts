import {ModalScene, SceneController} from "../scene";
import {Button, Colors, HStack, SelectableGrid, Sizes, VStack} from "../ui";
import {Dialog, DialogQuestion} from "./dialog";
import * as PIXI from "pixi.js";

export class DialogModalScene extends HStack implements ModalScene {
  private readonly _controller: SceneController;
  private readonly _dialog: Dialog;

  private _selectable: SelectableGrid | null = null;

  private _dialogView: VStack | null = null;
  private _questionView: DialogQuestionView | null = null;
  private _answers: Button[] = [];

  constructor(controller: SceneController, dialog: Dialog) {
    super({
      background: {color: Colors.background},
    });
    this._controller = controller;
    this._dialog = dialog;
  }

  init(): void {
    this._selectable = new SelectableGrid(this._controller.joystick);

    const iconView = new VStack({
      spacing: 0,
      background: {color: Colors.uiBackground},
    });
    this.addChild(iconView);

    const icon = this._controller.resources.animated(this._dialog.npc.name + "_idle");
    icon.width = icon.width * 4;
    icon.height = icon.height * 4;
    iconView.addChild(icon);

    this._dialogView = new VStack({
      padding: 0
    });
    this.addChild(this._dialogView);

    this._questionView = new DialogQuestionView(300);
    this._dialogView.addChild(this._questionView);

    this.position.set(
      (this._controller.app.screen.width >> 1) - (this.width >> 1),
      (this._controller.app.screen.height >> 1) - (this.height >> 1),
    );

    this._controller.stage.addChild(this);
    this._controller.app.ticker.add(this.handleInput, this);

    this._dialog.question.subscribe(this.onQuestion, this);
    this._dialog.start();
  }

  destroy(): void {
    this._dialog.question.unsubscribe(this.onQuestion, this);
    this._controller.app.ticker.remove(this.handleInput, this);
    this._selectable = null;
    super.destroy({children: true});
  }

  private onQuestion(question: DialogQuestion): void {
    for (let i = 0; i < this._answers.length; i++) {
      const answer = this._answers[i];
      answer.destroy();
      this._selectable!.remove(0, i);
    }
    this._selectable!.reset();
    this._answers = [];

    this._questionView!.text = question.text;

    for (let i = 0; i < question.answers.length; i++) {
      const answer = question.answers[i];
      const answerView = new Button({
        label: answer.text,
        width: 300,
      })
      this._selectable!.set(0, i, answerView, answer.action.bind(answer));
      this._answers.push(answerView);
      this._dialogView!.addChild(answerView);
    }

    this.updateLayout();

    this._selectable!.reset();
  }

  private handleInput(): void {
    this._selectable?.handleInput();
  }
}

class DialogQuestionView extends PIXI.Container {
  private readonly _background: PIXI.Graphics;
  private readonly _text: PIXI.BitmapText;

  set text(text: string) {
    this._text.text = text;
    this._background.height = this._text.height + Sizes.uiBorder * 2;
  }

  constructor(width: number) {
    super();
    this._text = new PIXI.BitmapText("", {font: {name: "alagard", size: 16}});
    this._text.maxWidth = width - Sizes.uiBorder * 2;
    this._text.calculateBounds();
    this._text.position.set(Sizes.uiBorder, Sizes.uiBorder);
    this._background = new PIXI.Graphics().beginFill(Colors.uiBackground).drawRect(0, 0, 1, 1).endFill();
    this._background.width = width;
    this.addChild(this._background, this._text);
  }
}