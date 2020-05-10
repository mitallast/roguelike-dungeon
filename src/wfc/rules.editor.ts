import {Resources} from "../resources";
import {CellType, Direction, TilesetRules, TilesetRulesBuilder} from "./even.simple.tiled";
import {UIButton, Colors, UILayout} from "../ui";
import * as PIXI from "pixi.js";

interface TileConfig {
  name: string;
  type: CellType;
}

const SCALE = 1;
const BORDER = 2;
const SPRITE_SIZE = 16;

export class RulesEditor {
  private readonly _resources: Resources;
  private readonly _app: PIXI.Application;

  private readonly _tiles: TileConfig[];
  private readonly _cells: [number, number, CellType][] = [];

  private readonly _rulesRight: boolean[][];
  private readonly _rulesDown: boolean[][];

  private readonly _checkboxRight: RuleCheckboxCell[][] = [];
  private readonly _checkboxDown: RuleCheckboxCell[][] = [];

  constructor(resources: Resources, tiles: TileConfig[]) {
    this._resources = resources;
    this._tiles = tiles;

    this._cells.push([-1, -1, CellType.EMPTY]);

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      switch (tile.type) {
        case CellType.FLOOR:
          this._cells.push([i, -1, CellType.FLOOR]);
          for (let t = 0; t < tiles.length; t++) {
            const tTile = tiles[t];
            if (tTile.type === CellType.WALL_TOP) {
              this._cells.push([i, t, CellType.FLOOR_WALL_TOP]);
            }
          }
          break;
        case CellType.WALL_MID:
          this._cells.push([-1, i, CellType.WALL_MID]);
          break;
        case CellType.WALL_TOP:
          this._cells.push([-1, i, CellType.WALL_TOP]);
          break;
        case CellType.WALL_SIDE:
          this._cells.push([-1, i, CellType.WALL_SIDE]);
          break;
      }
    }

    const size = this._cells.length;

    this._rulesRight = [];
    this._rulesDown = [];
    for (let first = 0; first < size; first++) {
      this._rulesRight[first] = [];
      this._rulesDown[first] = [];
      for (let second = 0; second < size; second++) {
        this._rulesRight[first][second] = false;
        this._rulesDown[first][second] = false;
      }
    }

    this._app = new PIXI.Application({
      width: (size + 1) * SPRITE_SIZE,
      height: (size + 1) * SPRITE_SIZE,
      resolution: 2,
    });
    this._app.stage.scale.set(SCALE, SCALE);

    const div = document.createElement("div");
    div.classList.add("container");
    div.appendChild(this._app.view);
    document.body.appendChild(div);

    const layout = new UILayout();
    layout.offset(BORDER, BORDER);
    layout.commit();
    this.initButtons(layout);
    this.initMap(layout, Direction.RIGHT, false);
    this.initMap(layout, Direction.DOWN, true);

    const sW = this._app.stage.width + BORDER + BORDER;
    const sH = this._app.stage.height + BORDER + BORDER;
    this._app.renderer.resize(sW, sH);
  }

  get floorTiles(): string[] {
    return this._tiles.filter(c => c.type === CellType.FLOOR).map(c => c.name);
  }

  get wallTiles(): string[] {
    return this._tiles.filter(c =>
      c.type === CellType.WALL_MID ||
      c.type === CellType.WALL_TOP ||
      c.type === CellType.WALL_SIDE
    ).map(c => c.name);
  }

  private initButtons(layout: UILayout): void {
    const dump = new UIButton({
      label: "Dump rules"
    });
    dump.position.set(layout.x, layout.y);
    dump.interactive = true;
    dump.buttonMode = true;
    dump.on('click', () => this.dumpRules());
    this._app.stage.addChild(dump);

    layout.offset(dump.width, 0);
    layout.offset(BORDER, 0);

    const load = new UIButton({
      label: "Load rules"
    });
    load.position.set(layout.x, layout.y);
    load.interactive = true;
    load.buttonMode = true;
    load.on('click', () => this.loadRules());
    this._app.stage.addChild(load);

    layout.offset(dump.width, 0);
    layout.offset(BORDER, 0);

    const saveState = new UIButton({
      label: "Save state"
    });
    saveState.position.set(layout.x, layout.y);
    saveState.interactive = true;
    saveState.buttonMode = true;
    saveState.on('click', () => this.saveState());
    this._app.stage.addChild(saveState);

    layout.offset(saveState.width, 0);
    layout.offset(BORDER, 0);

    const loadState = new UIButton({
      label: "Load state"
    });
    loadState.position.set(layout.x, layout.y);
    loadState.interactive = true;
    loadState.buttonMode = true;
    loadState.on('click', () => this.loadState());
    this._app.stage.addChild(loadState);

    layout.offset(loadState.width, 0);
    layout.offset(BORDER, 0);

    const clear = new UIButton({
      label: "Clear"
    });
    clear.position.set(layout.x, layout.y);
    clear.interactive = true;
    clear.buttonMode = true;
    clear.on('click', () => this.clear());
    this._app.stage.addChild(clear);

    layout.reset();
    layout.offset(0, dump.height);
    layout.offset(0, SPRITE_SIZE);
    layout.commit();
  }

  private saveState(): void {
    localStorage.setItem("rules.editor", JSON.stringify(this.buildRules()));
  }

  private loadState(): void {
    const source = localStorage.getItem("rules.editor")
    if (source) {
      const rules: TilesetRules = JSON.parse(source);
      this.setRules(rules);
    }
  }

  buildRules(): TilesetRules {
    const builder = new TilesetRulesBuilder();
    const indexes: number[] = [];

    for (const [f, w, type] of this._cells) {
      const floor = f >= 0 ? this._tiles[f].name : undefined;
      const wall = w >= 0 ? this._tiles[w].name : undefined;
      const index = builder.addCell(floor, wall, type);
      indexes.push(index);
    }

    for (let first = 0; first < this._cells.length; first++) {
      for (let second = 0; second < this._cells.length; second++) {
        if (this._rulesRight[first][second]) {
          builder.addRuleRight(indexes[first], indexes[second]);
        }
        if (this._rulesDown[first][second]) {
          builder.addRuleDown(indexes[first], indexes[second]);
        }
      }
    }

    return builder.build();
  }

  private dumpRules(): void {
    const rules = this.buildRules();
    console.log(JSON.stringify(rules));
  }

  private loadRules(): void {
    const source = prompt("Enter rules json");
    if (source) {
      const tileset: TilesetRules = JSON.parse(source);
      this.setRules(tileset);
    }
  }

  private clear(): void {
    for (let first = 0; first < this._cells.length; first++) {
      for (let second = 0; second < this._cells.length; second++) {
        this._rulesRight[first][second] = false;
        this._rulesDown[first][second] = false;
      }
    }
    this.refresh();
  }

  private refresh(): void {
    for (let first = 0; first < this._cells.length; first++) {
      for (let second = 0; second < this._cells.length; second++) {
        this._checkboxRight[first][second].refresh();
        this._checkboxDown[first][second].refresh();
      }
    }
  }

  private setRules(rules: TilesetRules): void {
    this.clear();
    const findTile = (i: number): number => {
      const name = i >= 0 ? rules.tiles[i] : null;
      return name ? this._tiles.findIndex(v => v.name === name) : -1;
    }

    const findCell = (i: number): number => {
      const [fi, wi] = rules.cells[i];
      const f = findTile(fi);
      const w = findTile(wi);
      return this._cells.findIndex(c => c[0] === f && c[1] === w);
    };

    for (const [fi, si] of rules.right) {
      const first = findCell(fi);
      const second = findCell(si);
      console.assert(first >= 0);
      console.assert(second >= 0);

      this.setRule(first, second, Direction.RIGHT, true);
    }

    for (const [fi, si] of rules.down) {
      const first = findCell(fi);
      const second = findCell(si);
      console.assert(first >= 0);
      console.assert(second >= 0);

      this.setRule(first, second, Direction.DOWN, true);
    }

    this.refresh();
  }

  private initMap(layout: UILayout, direction: Direction, bottom: boolean): void {
    // init top line
    layout.reset();
    layout.offset(SPRITE_SIZE + BORDER, 0);
    for (let i = 0; i < this._cells.length; i++) {
      const [f, w] = this._cells[i];
      const floor = f >= 0 ? this._tiles[f].name : null;
      const wall = w >= 0 ? this._tiles[w].name : null;
      const sample = new RuleSampleCell(this._resources, floor, wall);
      sample.position.set(layout.x, layout.y);
      this._app.stage.addChild(sample);
      layout.offset(SPRITE_SIZE + BORDER, 0);
    }

    // init bottom line
    if (bottom) {
      layout.reset();
      layout.offset(SPRITE_SIZE + BORDER, 0);
      for (let i = 0; i <= this._cells.length; i++) {
        layout.offset(0, SPRITE_SIZE + BORDER);
      }
      for (let i = 0; i < this._cells.length; i++) {
        const [f, w] = this._cells[i];
        const floor = f >= 0 ? this._tiles[f].name : null;
        const wall = w >= 0 ? this._tiles[w].name : null;
        const sample = new RuleSampleCell(this._resources, floor, wall);
        sample.position.set(layout.x, layout.y);
        this._app.stage.addChild(sample);
        layout.offset(SPRITE_SIZE + BORDER, 0);
      }
    }

    // init left line
    layout.reset();
    layout.offset(0, SPRITE_SIZE + BORDER);
    for (let i = 0; i < this._cells.length; i++) {
      const [f, w] = this._cells[i];
      const floor = f >= 0 ? this._tiles[f].name : null;
      const wall = w >= 0 ? this._tiles[w].name : null;
      const sample = new RuleSampleCell(this._resources, floor, wall);
      sample.position.set(layout.x, layout.y);
      this._app.stage.addChild(sample);
      layout.offset(0, SPRITE_SIZE + BORDER);
    }

    // init right line
    layout.reset();
    layout.offset(0, SPRITE_SIZE + BORDER);
    for (let i = 0; i <= this._cells.length; i++) {
      layout.offset(SPRITE_SIZE + BORDER, 0);
    }
    for (let i = 0; i < this._cells.length; i++) {
      const [f, w] = this._cells[i];
      const floor = f >= 0 ? this._tiles[f].name : null;
      const wall = w >= 0 ? this._tiles[w].name : null;
      const sample = new RuleSampleCell(this._resources, floor, wall);
      sample.position.set(layout.x, layout.y);
      this._app.stage.addChild(sample);
      layout.offset(0, SPRITE_SIZE + BORDER);
    }

    const checkboxes = direction === Direction.RIGHT ? this._checkboxRight : this._checkboxDown;

    // init checkbox map
    for (let first = 0; first < this._cells.length; first++) {
      layout.reset();
      layout.offset(SPRITE_SIZE + BORDER, 0);
      layout.offset(0, SPRITE_SIZE + BORDER);

      for (let i = 0; i < first; i++) {
        layout.offset(0, SPRITE_SIZE + BORDER);
      }

      checkboxes[first] = [];

      for (let second = 0; second < this._cells.length; second++) {
        const checkbox = new RuleCheckboxCell(this, first, second, direction);
        checkbox.position.set(layout.x, layout.y);
        this._app.stage.addChild(checkbox);
        checkboxes[first][second] = checkbox;
        layout.offset(SPRITE_SIZE + BORDER, 0);
      }
    }

    // commit layout at bottom
    layout.reset();
    for (let i = 0; i <= this._cells.length; i++) {
      layout.offset(0, SPRITE_SIZE + BORDER);
    }

    layout.commit();
  }

  getRule(first: number, second: number, direction: Direction): boolean {
    const rules = direction === Direction.RIGHT ? this._rulesRight : this._rulesDown;
    return rules[first][second];
  }

  setRule(first: number, second: number, direction: Direction, value: boolean): void {
    const rules = direction === Direction.RIGHT ? this._rulesRight : this._rulesDown;
    rules[first][second] = value;
  }

  static dungeon(resources: Resources): RulesEditor {
    return new RulesEditor(resources, [
      {name: "floor_1.png", type: CellType.FLOOR},

      {name: "wall_left.png", type: CellType.WALL_MID},
      {name: "wall_mid.png", type: CellType.WALL_MID},
      {name: "wall_right.png", type: CellType.WALL_MID},
      {name: "wall_inner_corner_mid_left.png", type: CellType.WALL_MID},
      {name: "wall_inner_corner_mid_right.png", type: CellType.WALL_MID},
      {name: "wall_inner_corner_i_top_left.png", type: CellType.WALL_MID},
      {name: "wall_inner_corner_i_top_mid.png", type: CellType.WALL_MID},
      {name: "wall_inner_corner_i_top_right.png", type: CellType.WALL_MID},
      {name: "wall_side_mid_top_left.png", type: CellType.WALL_MID},
      {name: "wall_side_mid_top_right.png", type: CellType.WALL_MID},

      {name: "wall_one_mid_left_inner_corner_right.png", type: CellType.WALL_MID},
      {name: "wall_one_mid_right_inner_corner_left.png", type: CellType.WALL_MID},
      {name: "wall_one_inner_corner_left_dot_right.png", type: CellType.WALL_MID},
      {name: "wall_one_inner_corner_right_dot_left.png", type: CellType.WALL_MID},
      {name: "wall_one_left_inner_corner_right.png", type: CellType.WALL_MID},
      {name: "wall_one_left_top_dot_left.png", type: CellType.WALL_MID},
      {name: "wall_one_left_top_dot_right.png", type: CellType.WALL_MID},
      {name: "wall_one_left_top_left.png", type: CellType.WALL_MID},
      {name: "wall_one_left_top_mid.png", type: CellType.WALL_MID},
      {name: "wall_one_left_top_right.png", type: CellType.WALL_MID},
      {name: "wall_one_mid.png", type: CellType.WALL_MID},
      {name: "wall_one_mid_full.png", type: CellType.WALL_MID},
      {name: "wall_one_mid_inner_corner.png", type: CellType.WALL_MID},
      {name: "wall_one_mid_top_left.png", type: CellType.WALL_MID},
      {name: "wall_one_mid_top_right.png", type: CellType.WALL_MID},
      {name: "wall_one_right_inner_corner_left.png", type: CellType.WALL_MID},
      {name: "wall_one_right_top_dot_left.png", type: CellType.WALL_MID},
      {name: "wall_one_right_top_dot_right.png", type: CellType.WALL_MID},
      {name: "wall_one_right_top_left.png", type: CellType.WALL_MID},
      {name: "wall_one_right_top_mid.png", type: CellType.WALL_MID},
      {name: "wall_one_right_top_right.png", type: CellType.WALL_MID},

      {name: "wall_one_front.png", type: CellType.WALL_SIDE},
      {name: "wall_one_front_dot_left.png", type: CellType.WALL_SIDE},
      {name: "wall_one_front_dot_right.png", type: CellType.WALL_SIDE},
      {name: "wall_one_front_side_left.png", type: CellType.WALL_SIDE},
      {name: "wall_one_front_side_right.png", type: CellType.WALL_SIDE},

      {name: "wall_one_inner_corner.png", type: CellType.WALL_SIDE},
      {name: "wall_one_side.png", type: CellType.WALL_SIDE},
      {name: "wall_one_side_dot_left.png", type: CellType.WALL_SIDE},
      {name: "wall_one_side_dot_right.png", type: CellType.WALL_SIDE},
      {name: "wall_one_top_dots.png", type: CellType.WALL_SIDE},

      {name: "wall_one_left_corner_right.png", type: CellType.WALL_MID},
      {name: "wall_one_mid_corner_right.png", type: CellType.WALL_MID},
      {name: "wall_one_right_corner_left.png", type: CellType.WALL_MID},
      {name: "wall_one_mid_corner_left.png", type: CellType.WALL_MID},

      {name: "wall_side_front_left.png", type: CellType.WALL_TOP},
      {name: "wall_side_front_right.png", type: CellType.WALL_TOP},
      {name: "wall_inner_corner_l_top_left.png", type: CellType.WALL_TOP},
      {name: "wall_inner_corner_l_top_right.png", type: CellType.WALL_TOP},
      {name: "wall_inner_corner_t_top_left.png", type: CellType.WALL_TOP},
      {name: "wall_inner_corner_t_top_right.png", type: CellType.WALL_TOP},
      {name: "wall_side_mid_left.png", type: CellType.WALL_TOP},
      {name: "wall_side_mid_right.png", type: CellType.WALL_TOP},
      {name: "wall_side_top_left.png", type: CellType.WALL_TOP},
      {name: "wall_side_top_right.png", type: CellType.WALL_TOP},
      {name: "wall_top_mid.png", type: CellType.WALL_TOP},

      {name: "wall_one_corner_left.png", type: CellType.WALL_TOP},
      {name: "wall_one_corner_right.png", type: CellType.WALL_TOP},
      {name: "wall_one_top.png", type: CellType.WALL_TOP},
    ]);
  }
}

class RuleSampleCell extends PIXI.Container {
  private readonly _floorSprite: PIXI.Sprite | null;
  private readonly _wallSprite: PIXI.Sprite | null;

  constructor(resources: Resources, floor: string | null, wall: string | null) {
    super()

    if (floor) {
      this._floorSprite = resources.sprite(floor);
      this.addChild(this._floorSprite);
    } else {
      this._floorSprite = null;
    }

    if (wall) {
      this._wallSprite = resources.sprite(wall);
      this.addChild(this._wallSprite);
    } else {
      this._wallSprite = null;
    }
  }
}

class RuleCheckboxCell extends PIXI.Container {
  private readonly _editor: RulesEditor;
  private readonly _first: number;
  private readonly _second: number;
  private readonly _direction: Direction;

  private readonly _bg: PIXI.Graphics;

  constructor(editor: RulesEditor, first: number, second: number, direction: Direction) {
    super();
    this._editor = editor;
    this._first = first;
    this._second = second;
    this._direction = direction;

    this._bg = new PIXI.Graphics();
    this.addChild(this._bg);
    this.refresh();

    this.interactive = true;
    this.buttonMode = true;
    this.on('click', () => this.toggle());
  }

  toggle(): void {
    const value = this._editor.getRule(this._first, this._second, this._direction);
    this._editor.setRule(this._first, this._second, this._direction, !value);
    this.refresh();
  }

  refresh(): void {
    const value = this._editor.getRule(this._first, this._second, this._direction);
    const color = value ? Colors.uiSelected : Colors.uiNotSelected;
    this._bg.clear()
      .beginFill(Colors.uiBackground)
      .drawRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
      .endFill()
      .beginFill(color)
      .drawRect(2, 2, SPRITE_SIZE - 4, SPRITE_SIZE - 4)
      .endFill();
  }
}