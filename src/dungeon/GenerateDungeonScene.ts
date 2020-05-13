import * as PIXI from "pixi.js";
import {Scene, SceneController} from "../scene";
import {DungeonGenerator, GenerateOptions} from "./DungeonGenerator";
import {HybridDungeonGenerator} from "./HybridDungeonGenerator";
import {UIBarView, Colors, Sizes} from "../ui";

export class GenerateDungeonScene extends Scene {
  private readonly _generator: DungeonGenerator;
  private readonly _progressBar: UIBarView;
  private readonly _options: GenerateOptions;

  constructor(controller: SceneController, options: GenerateOptions) {
    super(controller)
    this._generator = new HybridDungeonGenerator(this._controller);

    const screen = this._controller.screen;

    const title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    title.anchor = new PIXI.Point(0.5, 0);
    title.position.set(this._controller.screen.width >> 1, 64);
    this.addChild(title);

    this._progressBar = new UIBarView({
      color: Colors.uiSelected,
      width: screen.width - (Sizes.uiMargin << 2),
      height: 64,
      valueMax: 100,
    });
    this._progressBar.position.set(
      Sizes.uiMargin << 1,
      screen.height - (Sizes.uiMargin << 1) - 64
    );
    this.addChild(this._progressBar);

    this._options = options;
  }

  private async generate(): Promise<void> {
    const dungeon = await this._generator.generate(this._options);
    this._controller.dungeon(dungeon);
  }

  init(): void {
    this._controller.ticker.add(this.update, this);
    this.generate();
  }

  destroy(): void {
    this._controller.ticker.remove(this.update, this);
    super.destroy({children: true});
  }

  pause(): void {
  }

  resume(): void {
  }

  private update(): void {
    this._progressBar.value = this._generator.percent;
  }
}