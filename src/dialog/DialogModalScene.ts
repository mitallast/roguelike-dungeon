import * as PIXI from "pixi.js";
import {ModalScene, SceneController} from "../scene";
import {UIButton, UIHorizontalStack, UIVerticalStack, Colors, Sizes} from "../ui";
import {Dialog, DialogQuestion} from "./DialogManager";

export class DialogModalScene extends ModalScene {
  private readonly _dialog: Dialog;

  private _dialogView: UIVerticalStack | null = null;
  private _questionView: DialogQuestionView | null = null;
  private _answers: UIButton[] = [];

  constructor(controller: SceneController, dialog: Dialog) {
    super(controller, "Dialog");
    this._dialog = dialog;
  }

  init(): void {
    super.init();

    const container = new UIHorizontalStack({padding: 0});
    this.addChild(container);

    const iconView = new UIVerticalStack({
      spacing: 0,
      backgroundColor: Colors.uiBackground,
    });
    container.addChild(iconView);

    const icon = this._controller.resources.animatedSprite(this._dialog.npc.name + "_idle");
    icon.width = icon.width * 4;
    icon.height = icon.height * 4;
    iconView.addChild(icon);

    this._dialogView = new UIVerticalStack({padding: 0});
    container.addChild(this._dialogView);

    this._questionView = new DialogQuestionView(300);
    this._dialogView.addChild(this._questionView);

    this._dialog.question.subscribe(this.onQuestion, this);
    this._dialog.start();
  }

  destroy(): void {
    this._dialog.question.unsubscribe(this.onQuestion, this);
    super.destroy();
  }

  private onQuestion(question: DialogQuestion): void {
    for (let i = 0; i < this._answers.length; i++) {
      const answer = this._answers[i];
      answer.destroy();
      this._selectable!.remove(0, i + 1);
    }
    this._selectable!.reset();
    this._answers = [];

    this._questionView!.text = question.text;

    for (let i = 0; i < question.answers.length; i++) {
      const answer = question.answers[i];
      const answerView = new UIButton({
        label: answer.text,
        width: 300,
      })
      this._selectable!.set(0, i + 1, answerView, answer.action.bind(answer));
      this._answers.push(answerView);
      this._dialogView!.addChild(answerView);
    }
    this._selectable.select(0, 1);

    this.updateLayout();

    this._selectable!.reset();
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