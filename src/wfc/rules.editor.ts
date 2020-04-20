import {Resources} from "../resources";
import {CellType, Direction, TilesetRules, TilesetRulesBuilder} from "./even.simple.tiled";
import {Button, Colors, Layout} from "../ui";
import * as PIXI from "pixi.js";

interface TileConfig {
  name: string
  type: CellType
}

const scale = 1;
const border = 2;
const sprite_size = 16;

export class RulesEditor {
  private readonly resources: Resources;
  private readonly app: PIXI.Application;

  private readonly tiles: TileConfig[];
  private readonly cells: [number, number, CellType][] = [];

  private readonly rulesRight: boolean[][];
  private readonly rulesDown: boolean[][];

  private readonly checkboxRight: RuleCheckboxCell[][] = [];
  private readonly checkboxDown: RuleCheckboxCell[][] = [];

  constructor(resources: Resources, tiles: TileConfig[]) {
    this.resources = resources;
    this.tiles = tiles;

    this.cells.push([-1, -1, CellType.EMPTY]);

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      switch (tile.type) {
        case CellType.FLOOR:
          this.cells.push([i, -1, CellType.FLOOR]);
          for (let t = 0; t < tiles.length; t++) {
            const t_tile = tiles[t];
            if (t_tile.type === CellType.WALL_TOP) {
              this.cells.push([i, t, CellType.FLOOR_WALL_TOP]);
            }
          }
          break;
        case CellType.WALL_MID:
          this.cells.push([-1, i, CellType.WALL_MID]);
          break;
        case CellType.WALL_TOP:
          this.cells.push([-1, i, CellType.WALL_TOP]);
          break;
        case CellType.WALL_SIDE:
          this.cells.push([-1, i, CellType.WALL_SIDE]);
          break;
      }
    }

    const size = this.cells.length;

    this.rulesRight = [];
    this.rulesDown = [];
    for (let first = 0; first < size; first++) {
      this.rulesRight[first] = [];
      this.rulesDown[first] = [];
      for (let second = 0; second < size; second++) {
        this.rulesRight[first][second] = false;
        this.rulesDown[first][second] = false;
      }
    }

    this.app = new PIXI.Application({
      width: (size + 1) * sprite_size,
      height: (size + 1) * sprite_size,
      resolution: 2,
    });
    this.app.stage.scale.set(scale, scale);

    const div = document.createElement("div");
    div.classList.add("container");
    div.appendChild(this.app.view);
    document.body.appendChild(div);

    const layout = new Layout();
    layout.offset(border, border);
    layout.commit();
    this.initButtons(layout);
    this.initMap(layout, Direction.RIGHT, false);
    this.initMap(layout, Direction.DOWN, true);

    const s_w = this.app.stage.width + border + border;
    const s_h = this.app.stage.height + border + border;
    this.app.renderer.resize(s_w, s_h);
  }

  get floorTiles(): string[] {
    return this.tiles.filter(c => c.type === CellType.FLOOR).map(c => c.name);
  }

  get wallTiles(): string[] {
    return this.tiles.filter(c =>
      c.type === CellType.WALL_MID ||
      c.type === CellType.WALL_TOP ||
      c.type === CellType.WALL_SIDE
    ).map(c => c.name);
  }

  private initButtons(layout: Layout): void {
    const dump = new Button({
      label: "Dump rules"
    });
    dump.position.set(layout.x, layout.y);
    dump.interactive = true;
    dump.buttonMode = true;
    dump.on('click', () => this.dumpRules());
    this.app.stage.addChild(dump);

    layout.offset(dump.width, 0);
    layout.offset(border, 0);

    const load = new Button({
      label: "Load rules"
    });
    load.position.set(layout.x, layout.y);
    load.interactive = true;
    load.buttonMode = true;
    load.on('click', () => this.loadRules());
    this.app.stage.addChild(load);

    layout.offset(dump.width, 0);
    layout.offset(border, 0);

    const saveState = new Button({
      label: "Save state"
    });
    saveState.position.set(layout.x, layout.y);
    saveState.interactive = true;
    saveState.buttonMode = true;
    saveState.on('click', () => this.saveState());
    this.app.stage.addChild(saveState);

    layout.offset(saveState.width, 0);
    layout.offset(border, 0);

    const loadState = new Button({
      label: "Load state"
    });
    loadState.position.set(layout.x, layout.y);
    loadState.interactive = true;
    loadState.buttonMode = true;
    loadState.on('click', () => this.loadState());
    this.app.stage.addChild(loadState);

    layout.offset(loadState.width, 0);
    layout.offset(border, 0);

    const clear = new Button({
      label: "Clear"
    });
    clear.position.set(layout.x, layout.y);
    clear.interactive = true;
    clear.buttonMode = true;
    clear.on('click', () => this.clear());
    this.app.stage.addChild(clear);

    layout.reset();
    layout.offset(0, dump.height);
    layout.offset(0, sprite_size);
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

    for (let [f, w, type] of this.cells) {
      const floor = f >= 0 ? this.tiles[f].name : undefined;
      const wall = w >= 0 ? this.tiles[w].name : undefined;
      const index = builder.addCell(floor, wall, type);
      indexes.push(index);
    }

    for (let first = 0; first < this.cells.length; first++) {
      for (let second = 0; second < this.cells.length; second++) {
        if (this.rulesRight[first][second]) {
          builder.addRuleRight(indexes[first], indexes[second]);
        }
        if (this.rulesDown[first][second]) {
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
    for (let first = 0; first < this.cells.length; first++) {
      for (let second = 0; second < this.cells.length; second++) {
        this.rulesRight[first][second] = false;
        this.rulesDown[first][second] = false;
      }
    }
    this.refresh();
  }

  private refresh(): void {
    for (let first = 0; first < this.cells.length; first++) {
      for (let second = 0; second < this.cells.length; second++) {
        this.checkboxRight[first][second].refresh();
        this.checkboxDown[first][second].refresh();
      }
    }
  }

  private setRules(rules: TilesetRules): void {
    this.clear();
    const findTile = (i: number): number => {
      const name = i >= 0 ? rules.tiles[i] : null;
      return name ? this.tiles.findIndex(v => v.name === name) : -1;
    }

    const findCell = (i: number): number => {
      const [fi, wi] = rules.cells[i];
      const f = findTile(fi);
      const w = findTile(wi);
      return this.cells.findIndex(c => c[0] === f && c[1] === w);
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

  private initMap(layout: Layout, direction: Direction, bottom: boolean): void {
    // init top line
    layout.reset();
    layout.offset(sprite_size + border, 0);
    for (let i = 0; i < this.cells.length; i++) {
      const [f, w] = this.cells[i];
      const floor = f >= 0 ? this.tiles[f].name : null;
      const wall = w >= 0 ? this.tiles[w].name : null;
      const sample = new RuleSampleCell(this.resources, floor, wall);
      sample.position.set(layout.x, layout.y);
      this.app.stage.addChild(sample);
      layout.offset(sprite_size + border, 0);
    }

    // init bottom line
    if (bottom) {
      layout.reset();
      layout.offset(sprite_size + border, 0);
      for (let i = 0; i <= this.cells.length; i++) {
        layout.offset(0, sprite_size + border);
      }
      for (let i = 0; i < this.cells.length; i++) {
        const [f, w] = this.cells[i];
        const floor = f >= 0 ? this.tiles[f].name : null;
        const wall = w >= 0 ? this.tiles[w].name : null;
        const sample = new RuleSampleCell(this.resources, floor, wall);
        sample.position.set(layout.x, layout.y);
        this.app.stage.addChild(sample);
        layout.offset(sprite_size + border, 0);
      }
    }

    // init left line
    layout.reset();
    layout.offset(0, sprite_size + border);
    for (let i = 0; i < this.cells.length; i++) {
      const [f, w] = this.cells[i];
      const floor = f >= 0 ? this.tiles[f].name : null;
      const wall = w >= 0 ? this.tiles[w].name : null;
      const sample = new RuleSampleCell(this.resources, floor, wall);
      sample.position.set(layout.x, layout.y);
      this.app.stage.addChild(sample);
      layout.offset(0, sprite_size + border);
    }

    // init right line
    layout.reset();
    layout.offset(0, sprite_size + border);
    for (let i = 0; i <= this.cells.length; i++) {
      layout.offset(sprite_size + border, 0);
    }
    for (let i = 0; i < this.cells.length; i++) {
      const [f, w] = this.cells[i];
      const floor = f >= 0 ? this.tiles[f].name : null;
      const wall = w >= 0 ? this.tiles[w].name : null;
      const sample = new RuleSampleCell(this.resources, floor, wall);
      sample.position.set(layout.x, layout.y);
      this.app.stage.addChild(sample);
      layout.offset(0, sprite_size + border);
    }

    const checkboxes = direction === Direction.RIGHT ? this.checkboxRight : this.checkboxDown;

    // init checkbox map
    for (let first = 0; first < this.cells.length; first++) {
      layout.reset();
      layout.offset(sprite_size + border, 0);
      layout.offset(0, sprite_size + border);

      for (let i = 0; i < first; i++) {
        layout.offset(0, sprite_size + border);
      }

      checkboxes[first] = [];

      for (let second = 0; second < this.cells.length; second++) {
        const checkbox = new RuleCheckboxCell(this, first, second, direction);
        checkbox.position.set(layout.x, layout.y);
        this.app.stage.addChild(checkbox);
        checkboxes[first][second] = checkbox;
        layout.offset(sprite_size + border, 0);
      }
    }

    // commit layout at bottom
    layout.reset();
    for (let i = 0; i <= this.cells.length; i++) {
      layout.offset(0, sprite_size + border);
    }

    layout.commit();
  }

  getRule(first: number, second: number, direction: Direction): boolean {
    const rules = direction === Direction.RIGHT ? this.rulesRight : this.rulesDown;
    return rules[first][second];
  }

  setRule(first: number, second: number, direction: Direction, value: boolean): void {
    const rules = direction === Direction.RIGHT ? this.rulesRight : this.rulesDown;
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
  private readonly floorSprite: PIXI.Sprite | null;
  private readonly wallSprite: PIXI.Sprite | null;

  constructor(resources: Resources, floor: string | null, wall: string | null) {
    super()

    if (floor) {
      this.floorSprite = resources.sprite(floor);
      this.addChild(this.floorSprite);
    } else {
      this.floorSprite = null;
    }

    if (wall) {
      this.wallSprite = resources.sprite(wall);
      this.addChild(this.wallSprite);
    } else {
      this.wallSprite = null;
    }
  }
}

class RuleCheckboxCell extends PIXI.Container {
  private readonly editor: RulesEditor;
  private readonly first: number;
  private readonly second: number;
  private readonly direction: Direction;

  private readonly bg: PIXI.Graphics;

  constructor(editor: RulesEditor, first: number, second: number, direction: Direction) {
    super();
    this.editor = editor;
    this.first = first;
    this.second = second;
    this.direction = direction;

    this.bg = new PIXI.Graphics();
    this.addChild(this.bg);
    this.refresh();

    this.interactive = true;
    this.buttonMode = true;
    this.on('click', () => this.toggle());
  }

  toggle() {
    const value = this.editor.getRule(this.first, this.second, this.direction);
    this.editor.setRule(this.first, this.second, this.direction, !value);
    this.refresh();
  }

  refresh() {
    const value = this.editor.getRule(this.first, this.second, this.direction);
    const color = value ? Colors.uiSelected : Colors.uiNotSelected;
    this.bg.clear()
      .beginFill(Colors.uiBackground)
      .drawRect(0, 0, sprite_size, sprite_size)
      .endFill()
      .beginFill(color)
      .drawRect(2, 2, sprite_size - 4, sprite_size - 4)
      .endFill();
  }
}