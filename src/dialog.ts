import {Hero} from "./hero";
import {NpcCharacter} from "./npc";
import {ModalScene, SceneController} from "./scene";
import {Colors, Layout, Selectable, SelectableMap, Sizes} from "./ui";
import {EventPublisher, Publisher} from "./observable";
import {Expression} from "./expression";
import {Template} from "./template";
import * as PIXI from "pixi.js";

interface NpcDialogConfig {
  readonly start: string[];
  readonly questions: Partial<Record<string, NpcQuestionConfig>>;
}

interface NpcQuestionConfig {
  readonly text: string;
  readonly conditions?: [string];
  readonly answers: NpcAnswerConfig[];
}

interface NpcAnswerConfig {
  readonly text: string;
  readonly conditions?: [string];
  readonly commands: string[];
}

export class DialogManager {
  private readonly controller: SceneController;
  private readonly config: Partial<Record<string, NpcDialogConfig>>;

  constructor(controller: SceneController) {
    this.controller = controller;
    this.config = controller.app.loader.resources['dialogs.json'].data;
  }

  dialog(hero: Hero, npc: NpcCharacter): Dialog {
    const config = this.config[npc.name] || this.config["default"]!;
    return new Dialog(this.controller, hero, npc, config);
  }
}

export class Dialog {
  private readonly controller: SceneController;
  readonly hero: Hero;
  readonly npc: NpcCharacter;

  private readonly _config: NpcDialogConfig;
  private readonly _question: EventPublisher<DialogQuestion> = new EventPublisher<DialogQuestion>();
  private readonly _expression: Expression;
  private readonly _template: Template;

  get question(): Publisher<DialogQuestion> {
    return this._question;
  }

  constructor(controller: SceneController, hero: Hero, npc: NpcCharacter, config: NpcDialogConfig) {
    this.controller = controller;
    this.hero = hero;
    this.npc = npc;
    this._config = config;
    this._expression = new Expression();
    this._expression.register("goto", 100, true, this.goto.bind(this));
    this._expression.register("exit", 100, false, this.exit.bind(this));
    this._expression.register("context", 100, false, this.context.bind(this));

    this._expression.register("hasSkill", 100, false, this.hasSkill.bind(this));
    this._expression.register("skill", 100, false, this.skill.bind(this));

    this._template = new Template();
    this._template.add("hero", this.hero);
    this._template.add("npc", this.npc);
  }

  start(): void {
    this.goto(...this._config.start);
  }

  private hasSkill(id: string): boolean {
    return this.npc.hasSkill(id);
  }

  private skill(id: string): void {
    this.npc.getSkill(id)?.use(this.hero);
  }

  private exit(): void {
    this.controller.closeModal();
  }

  private context(key: string, value: any): any {
    if (value === undefined) {
      return this.npc.getContext(key);
    } else {
      this.npc.setContext(key, value);
      return null;
    }
  }

  private goto(...ids: string[]): void {
    for (let id of ids) {
      const config = this._config.questions[id]!;
      if (this.check(config.conditions || [])) {
        const text = this._template.render(config.text);
        const question = new DialogQuestion(this, text);
        for (let answer of config.answers) {
          if (this.check(answer.conditions)) {
            const text = this._template.render(answer.text);
            question.add(text, answer.commands);
          }
        }
        this._question.send(question);
        return;
      }
    }
  }

  private check(conditions: string[] | undefined): boolean {
    if (conditions) {
      for (let rule of conditions) {
        if (!this.evaluate(rule)) {
          return false;
        }
      }
    }
    return true;
  }

  evaluate(command: string): any {
    return this._expression.evaluate(command);
  }
}

export class DialogQuestion {
  private readonly dialog: Dialog;
  readonly text: string;
  readonly answers: DialogAnswer[] = [];

  constructor(dialog: Dialog, text: string) {
    this.dialog = dialog;
    this.text = text;
  }

  add(text: string, commands: string[]): void {
    this.answers.push(new DialogAnswer(this.dialog, text, commands));
  }
}

export class DialogAnswer {
  readonly dialog: Dialog;
  readonly text: string;
  readonly commands: string[];

  constructor(dialog: Dialog, text: string, commands: string[]) {
    this.dialog = dialog;
    this.text = text;
    this.commands = commands;
  }

  action(): void {
    for (let command of this.commands) {
      this.dialog.evaluate(command);
    }
  }
}

export class DialogModalScene implements ModalScene {
  private readonly controller: SceneController;
  private readonly dialog: Dialog;

  private container: PIXI.Container | null = null;
  private background: PIXI.Graphics | null = null;
  private selectable: SelectableMap | null = null;

  private _width: number = 0;
  private _layout: Layout = new Layout();
  private _question: DialogQuestionView | null = null;
  private _answers: DialogAnswerView[] = [];

  constructor(controller: SceneController, dialog: Dialog) {
    this.controller = controller;
    this.dialog = dialog;
  }

  init(): void {
    this.background = new PIXI.Graphics();

    this.selectable = new SelectableMap(this.controller.joystick);

    const width = 600;
    const height = 400;
    this.background.beginFill(0x000000).drawRect(0, 0, width, height).endFill();
    this.background.zIndex = 0;

    this.container = new PIXI.Container();
    this.container.addChild(this.background);
    this.container.sortChildren();
    this.container.position.set(
      (this.controller.app.screen.width >> 1) - (width >> 1),
      (this.controller.app.screen.height >> 1) - (height >> 1),
    );

    const layout = this._layout;
    layout.offset(Sizes.uiMargin, Sizes.uiMargin);
    const icon = this.controller.resources.animated(this.dialog.npc.name + "_idle");
    icon.animationSpeed = 0.2;
    icon.play();
    icon.width = icon.width * 4;
    icon.height = icon.height * 4;
    icon.position.set(layout.x + Sizes.uiBorder, layout.y + Sizes.uiBorder);

    const iconBg = new PIXI.Graphics();
    iconBg.beginFill(Colors.uiBackground)
      .drawRect(layout.x, layout.y, icon.width + Sizes.uiBorder * 2, icon.height + Sizes.uiBorder * 2)
      .endFill();

    layout.reset();
    layout.offset(icon.width, 0);
    layout.offset(Sizes.uiMargin, 0);
    layout.offset(Sizes.uiBorder * 2, 0);
    layout.commit();
    this._width = width - layout.x;

    this.container.addChild(iconBg, icon);

    this.controller.stage.addChild(this.container);
    this.controller.app.ticker.add(this.handleInput, this);

    this.dialog.question.subscribe(this.onQuestion, this);
    this.dialog.start();
  }

  destroy(): void {
    this.dialog.question.unsubscribe(this.onQuestion, this);
    this.controller.app.ticker.remove(this.handleInput, this);
    this.container?.destroy();
    this.container = null;
    this.background?.destroy();
    this.background = null;
    this.selectable = null;
  }

  private onQuestion(question: DialogQuestion): void {
    this._question?.destroy();
    for (let i = 0; i < this._answers.length; i++) {
      let answer = this._answers[i];
      answer.destroy();
      this.selectable!.remove(0, i);
    }
    this._answers = [];

    const width = this._width - Sizes.uiMargin * 2;
    const layout = this._layout;
    layout.reset();
    layout.offset(Sizes.uiMargin, Sizes.uiMargin);

    this._question = new DialogQuestionView(question, width);
    this._question.position.set(layout.x, layout.y);
    this.container!.addChild(this._question);
    layout.offset(0, this._question.height);
    layout.offset(0, Sizes.uiMargin);

    for (let i = 0; i < question.answers.length; i++) {
      let answer = question.answers[i];
      const view = new DialogAnswerView(answer, width);
      this.selectable!.set(0, i, view, answer.action.bind(answer));
      view.position.set(layout.x, layout.y);
      layout.offset(0, view.height);
      layout.offset(0, Sizes.uiMargin);
      this._answers.push(view);
      this.container!.addChild(view);
    }

    this.selectable!.reset();
  }

  private handleInput(): void {
    this.selectable?.handleInput();
  }
}

class DialogQuestionView extends PIXI.Container {
  private readonly _background: PIXI.Graphics;
  private readonly _text: PIXI.BitmapText;

  constructor(question: DialogQuestion, width: number) {
    super();
    this._text = new PIXI.BitmapText(question.text, {font: {name: "alagard", size: 16}});
    this._text.maxWidth = width - Sizes.uiBorder * 2;
    this._text.calculateBounds();
    this._text.position.set(Sizes.uiBorder, Sizes.uiBorder);
    const height = this._text.height + Sizes.uiBorder * 2;
    this._background = new PIXI.Graphics();
    this._background
      .clear()
      .beginFill(Colors.uiBackground, 0.3)
      .drawRect(0, 0, width, height)
      .endFill();

    this.addChild(this._background, this._text);
  }
}

class DialogAnswerView extends PIXI.Container implements Selectable {
  private readonly _background: PIXI.Graphics;
  private readonly _text: PIXI.BitmapText;
  private readonly _width: number;
  private readonly _height: number;

  private _selected: boolean = false;

  constructor(answer: DialogAnswer, width: number) {
    super();
    this._background = new PIXI.Graphics();
    this._text = new PIXI.BitmapText(answer.text, {font: {name: "alagard", size: 16}});
    this._text.maxWidth = width - Sizes.uiBorder * 2;
    this._text.calculateBounds();
    this._text.position.set(Sizes.uiBorder, Sizes.uiBorder);
    this._width = width;
    this._height = this._text.height + Sizes.uiBorder * 2;
    this.selected = false;
    this.addChild(this._background, this._text);
  }

  get selected(): boolean {
    return this._selected;
  }

  set selected(selected: boolean) {
    this._selected = selected;
    this._background
      .clear()
      .beginFill(selected ? Colors.uiSelected : Colors.uiNotSelected)
      .drawRect(0, 0, this._width, this._height)
      .endFill();
  }
}