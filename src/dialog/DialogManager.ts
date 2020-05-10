import {Hero, Npc} from "../characters";
import {SceneController} from "../scene";
import {EventPublisher, Publisher} from "../observable";
import {Expression} from "../expression";
import {Template} from "../template";
import {DialogConfig} from "./DialogConfig"

export class DialogManager {
  private readonly _controller: SceneController;

  constructor(controller: SceneController) {
    this._controller = controller;
  }

  dialog(hero: Hero, npc: Npc): Dialog {
    const dialogs: Record<string, DialogConfig> = this._controller.loader.resources['dialogs.json'].data;
    const config = dialogs[npc.name] || dialogs["default"]!;
    return new Dialog(this._controller, hero, npc, config);
  }
}

export class Dialog {
  private readonly _controller: SceneController;
  readonly hero: Hero;
  readonly npc: Npc;

  private readonly _config: DialogConfig;
  private readonly _question: EventPublisher<DialogQuestion> = new EventPublisher<DialogQuestion>();
  private readonly _expression: Expression;
  private readonly _template: Template;

  get question(): Publisher<DialogQuestion> {
    return this._question;
  }

  constructor(controller: SceneController, hero: Hero, npc: Npc, config: DialogConfig) {
    this._controller = controller;
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
    this._controller.closeModal();
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
    for (const id of ids) {
      const config = this._config.questions[id]!;
      if (this.check(config.conditions || [])) {
        const text = this._template.render(config.text);
        const question = new DialogQuestion(this, text);
        for (const answer of config.answers) {
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
      for (const rule of conditions) {
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
  private readonly _dialog: Dialog;
  readonly text: string;
  readonly answers: DialogAnswer[] = [];

  constructor(dialog: Dialog, text: string) {
    this._dialog = dialog;
    this.text = text;
  }

  add(text: string, commands: string[]): void {
    this.answers.push(new DialogAnswer(this._dialog, text, commands));
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
    for (const command of this.commands) {
      this.dialog.evaluate(command);
    }
  }
}
