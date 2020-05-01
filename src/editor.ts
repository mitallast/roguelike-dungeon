import {Resources} from "./resources";
import {DungeonZIndexes} from "./dungeon.map";
import {CellType, Direction, TilesetRules} from "./wfc/even.simple.tiled";
import {Indexer} from "./indexer";
import {Layout} from "./ui";
import {RNG} from "./rng";
import {buffer, Model} from "./wfc/model";
import {DungeonCrawler} from "./tunneler/dungeon.crawler";
import {yields} from "./concurency";
import {RulesEditor} from "./wfc/rules.editor";
import * as PIXI from "pixi.js";

const scale = 1;
const border = 2;
const sprite_size = 16;

export interface EditorSample {
  readonly tiles: string[];
  readonly cells: [number, number, number][];
  readonly map: number[][];
}

export class EditorSampleBuilder {
  private readonly tilesIndex: Indexer<string> = Indexer.identity();
  private readonly cellsIndex: Indexer<[number, number, number]> = Indexer.array();
  private readonly map: number[][];

  constructor(width: number, height: number) {
    this.map = [];
    for (let y = 0; y < height; y++) {
      this.map[y] = [];
      for (let x = 0; x < width; x++) {
        this.map[y][x] = 0;
      }
    }
  }

  set(x: number, y: number, floorTile: string | undefined, wallTile: string | undefined, zIndex: number | undefined): void {
    const floorId = floorTile ? this.tilesIndex.index(floorTile) : -1;
    const wallId = wallTile ? this.tilesIndex.index(wallTile) : -1;
    this.map[y][x] = this.cellsIndex.index([floorId, wallId, zIndex || 1]);
  }

  build(): EditorSample {
    return {
      tiles: this.tilesIndex.values,
      cells: this.cellsIndex.values,
      map: this.map
    }
  }
}

export class Editor {
  readonly width: number;
  readonly height: number;

  private readonly floorTiles: string[];
  private readonly wallTiles: string[];

  private readonly resources: Resources;
  private readonly rulesEditor: RulesEditor;
  private readonly app: PIXI.Application;

  private readonly cells: EditorMapCell[][] = [];
  private selected: EditorPaletteCell | null = null;

  private readonly title: PIXI.BitmapText;

  constructor(width: number, height: number, resources: Resources, rulesEditor: RulesEditor) {
    this.width = width;
    this.height = height;
    this.resources = resources;
    this.rulesEditor = rulesEditor;

    this.floorTiles = rulesEditor.floorTiles;
    this.wallTiles = rulesEditor.wallTiles;

    this.app = new PIXI.Application({
      width: width,
      height: height,
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

    this.initPalette(layout);

    layout.offset(0, border);
    this.title = new PIXI.BitmapText("title", {font: {name: "alagard", size: 16}});
    this.title.zIndex = 1000;
    this.title.position.set(layout.x, layout.y);
    this.app.stage.addChild(this.title);
    layout.offset(0, this.title.height);
    layout.offset(0, border);
    layout.commit();

    this.initMap(layout);

    this.app.stage.sortChildren();
    this.app.stage.calculateBounds();
    const s_w = this.app.stage.width + border + border;
    const s_h = this.app.stage.height + border + border;
    this.app.renderer.resize(s_w, s_h);
  }

  private initPalette(layout: Layout): void {
    const map_width = this.width * sprite_size + border * 2;
    const palette_width = Math.floor((map_width - border) / (sprite_size + border));

    let offset = 0;
    const nextRow = () => {
      layout.reset();
      layout.offset(0, sprite_size + border);
      layout.commit();
    };
    const addCell = (cell: EditorPaletteCell) => {
      cell.init();
      cell.position.set(layout.x, layout.y);
      this.app.stage.addChild(cell);
      offset++;
      if (offset % palette_width === 0) {
        layout.reset();
        layout.offset(0, sprite_size + border);
        layout.commit();
      } else {
        layout.offset(sprite_size + border, 0);
      }
    };

    for (let name of this.floorTiles) {
      addCell(new FloorPaletteCell(name, this.resources, this));
    }

    addCell(new ClearFloorPaletteCell(this.resources, this));
    for (let name of this.wallTiles) {
      addCell(new WallPaletteCell(name, this.resources, this));
    }

    addCell(new ClearWallPaletteCell(this.resources, this));
    addCell(new DumpPaletteCell(this.resources, this));
    addCell(new LoadPaletteCell(this.resources, this));
    addCell(new ApplyTunnelerDesignPaletteCell(this.resources, this));
    addCell(new ApplyRulesPaletteCell(this.resources, this, this.rulesEditor));
    addCell(new FindRulesErrorPaletteCell(this.resources, this, this.rulesEditor));

    nextRow();
    layout.commit();
  }

  private initMap(layout: Layout): void {
    for (let y = 0; y < this.height; y++) {
      this.cells.push([]);
      for (let x = 0; x < this.width; x++) {
        const cell = new EditorMapCell(x, y, this.resources, this);
        cell.position.set(layout.x, layout.y);
        this.cells[y][x] = cell;
        this.app.stage.addChild(cell);

        layout.offset(sprite_size, 0);
      }
      layout.reset();
      layout.offset(0, sprite_size);
      layout.commit();
    }
  }

  cell(x: number, y: number): EditorMapCell {
    return this.cells[y][x];
  }

  clear(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cells[y][x].clear();
      }
    }
  }

  action(cell: EditorMapCell): void {
    this.selected?.action(cell);
  }

  selectPalette(cell: EditorPaletteCell): void {
    this.selected = cell;
    this.title.text = cell?.title || "";
  }

  dump(min_x: number, min_y: number, max_x: number, max_y: number): void {
    max_x = Math.min(this.width - 1, max_x);
    max_y = Math.min(this.height - 1, max_y);

    const builder = new EditorSampleBuilder(max_x - min_x + 1, max_y - min_y + 1);

    for (let y = min_y; y <= max_y; y++) {
      for (let x = min_x; x <= max_x; x++) {
        const cell = this.cells[y][x];
        builder.set(
          x - min_x,
          y - min_y,
          cell.floorSprite?.name,
          cell.wallSprite?.name,
          cell.wallSprite?.zIndex
        );
      }
    }
    console.log(JSON.stringify(builder.build()));
  }

  load(dx: number, dy: number, sample: EditorSample): void {
    for (let y = 0; y < sample.map.length; y++) {
      for (let x = 0; x < sample.map[y].length; x++) {
        if (y + dy < this.height && x + dx < this.width) {
          const cell = this.cells[y + dy][x + dx];
          const cellId = sample.map[y][x];
          const [floorId, wallId] = sample.cells[cellId];
          cell.clear();
          if (floorId >= 0) cell.floor = sample.tiles[floorId];
          if (wallId >= 0) cell.wall = sample.tiles[wallId];
        }
      }
    }
  }
}

class EditorMapCell extends PIXI.Container {
  private readonly resources: Resources;
  private readonly editor: Editor;
  readonly cell_x: number;
  readonly cell_y: number;
  readonly bg: PIXI.Graphics;
  floorSprite: PIXI.Sprite | null = null;
  wallSprite: PIXI.Sprite | null = null;

  constructor(x: number, y: number, resources: Resources, editor: Editor) {
    super();
    this.resources = resources;
    this.editor = editor;
    this.cell_x = x;
    this.cell_y = y;

    this.bg = new PIXI.Graphics();
    this.bg.zIndex = 0;
    this.bg.beginFill(0x303030)
      .drawRect(0, 0, sprite_size, sprite_size)
      .endFill()
      .beginFill(0x909090)
      .drawRect(1, 1, sprite_size - 2, sprite_size - 2)
      .endFill();

    this.addChild(this.bg);
    this.sortChildren();
    this.interactive = true;
    this.buttonMode = true;
    this.on('click', () => this.select());
  }

  destroy(): void {
    super.destroy();
    this.floorSprite?.destroy();
    this.wallSprite?.destroy();
    this.bg.destroy();
  }

  set floor(name: string | null) {
    this.floorSprite?.destroy();
    this.floorSprite = null;
    if (name) {
      this.floorSprite = this.resources.sprite(name);
      this.floorSprite.zIndex = DungeonZIndexes.floor;
      this.addChild(this.floorSprite);
      this.sortChildren();
    }
  }

  set wall(name: string | null) {
    this.wallSprite?.destroy();
    this.wallSprite = null;
    if (name) {
      this.wallSprite = this.resources.sprite(name);
      this.wallSprite.zIndex = DungeonZIndexes.wall;
      this.addChild(this.wallSprite);
      this.sortChildren();
    }
  }

  clear(): void {
    this.floor = null;
    this.wall = null;
  }

  get isEmpty(): boolean {
    return !(this.floorSprite || this.wallSprite);
  }

  private select() {
    this.editor.action(this);
  }
}

abstract class EditorPaletteCell extends PIXI.Container {
  protected readonly resources: Resources;
  protected readonly editor: Editor;
  readonly title: string;

  protected constructor(title: string, resources: Resources, editor: Editor) {
    super();
    this.resources = resources;
    this.editor = editor;
    this.title = title;
    this.interactive = true;
    this.buttonMode = true;
    this.on("click", () => this.onClick());
  }

  abstract init(): void;

  protected abstract async onClick(): Promise<void>;

  abstract action(cell: EditorMapCell): void;
}

abstract class SpritePaletteCell extends EditorPaletteCell {
  readonly name: string;

  protected constructor(name: string, title: string, resources: Resources, editor: Editor) {
    super(title, resources, editor);
    this.name = name;
  }

  init(): void {
    const sprite = this.resources.sprite(this.name);
    this.addChild(sprite);
  }


  protected async onClick(): Promise<void> {
    this.editor.selectPalette(this);
  }
}

class FloorPaletteCell extends SpritePaletteCell {
  constructor(name: string, resources: Resources, editor: Editor) {
    super(name, `floor: ${name}`, resources, editor);
  }

  action(cell: EditorMapCell): void {
    cell.floor = this.name;
  }
}

class WallPaletteCell extends SpritePaletteCell {
  constructor(name: string, resources: Resources, editor: Editor) {
    super(name, `wall: ${name}`, resources, editor);
  }

  action(cell: EditorMapCell): void {
    cell.wall = this.name;
  }
}

abstract class NamedPaletteCell extends EditorPaletteCell {
  readonly name: string;

  protected constructor(name: string, title: string, resources: Resources, editor: Editor) {
    super(title, resources, editor);
    this.name = name;
  }

  init(): void {
    const graphics = new PIXI.Graphics()
      .beginFill(0x303030)
      .drawRect(0, 0, sprite_size, sprite_size)
      .endFill()
      .beginFill(0x707070)
      .drawRect(1, 1, sprite_size - 2, sprite_size - 2)
      .endFill();

    const text = new PIXI.BitmapText(this.name, {font: {name: "alagard", size: 8}});
    text.scale.set(0.5, 0.5);
    text.anchor = new PIXI.Point(0.5, 0.5);
    text.position.set(sprite_size >> 1, sprite_size >> 1);
    text.zIndex = 1000;

    this.addChild(graphics);
    this.addChild(text);
    this.sortChildren();
  }
}

class ClearFloorPaletteCell extends NamedPaletteCell {
  constructor(resources: Resources, editor: Editor) {
    super("CL FL", "Clear floor", resources, editor);
  }

  action(cell: EditorMapCell): void {
    cell.floor = null;
  }

  protected async onClick(): Promise<void> {
    this.editor.selectPalette(this);
  }
}

class ClearWallPaletteCell extends NamedPaletteCell {
  constructor(resources: Resources, editor: Editor) {
    super("CL WL", "Clear wall", resources, editor);
  }

  action(cell: EditorMapCell): void {
    cell.wall = null;
  }

  protected async onClick(): Promise<void> {
    this.editor.selectPalette(this);
  }
}

enum DumpState {
  START = 0, END = 1
}

class DumpPaletteCell extends NamedPaletteCell {
  private state: DumpState = DumpState.START;
  private min_x: number = 0;
  private min_y: number = 0;

  constructor(resources: Resources, editor: Editor) {
    super("DUMP", "Dump", resources, editor);
  }

  action(cell: EditorMapCell): void {
    switch (this.state) {
      case DumpState.START:
        this.min_x = cell.cell_x;
        this.min_y = cell.cell_y;
        this.state = DumpState.END;
        break;
      case DumpState.END:
        this.editor.dump(this.min_x, this.min_y, cell.cell_x, cell.cell_y);
        this.state = DumpState.START;
        break;
    }
  }

  protected async onClick(): Promise<void> {
    this.editor.selectPalette(this);
  }
}

class LoadPaletteCell extends NamedPaletteCell {
  private options: EditorSample | null = null;

  constructor(resources: Resources, editor: Editor) {
    super("LOAD", "Load", resources, editor);
  }

  action(cell: EditorMapCell): void {
    if (this.options) {
      this.editor.load(cell.cell_x, cell.cell_y, this.options);
    }
  }

  protected async onClick(): Promise<void> {
    const source = prompt("enter json");
    if (source) {
      this.options = JSON.parse(source);
      this.editor.selectPalette(this);
    }
  }
}

class SimpleTiledWFC {
  private readonly rulesEditor: RulesEditor;
  private readonly rng: RNG;
  private readonly resources: Resources;
  private readonly width: number;
  private readonly height: number;

  private tileset: TilesetRules;
  private propagator: number[][][] = [];
  private wave: boolean[][] = [];
  private entropies: number[] = [];
  private compatible: number[][][] = [];
  private toPropagate: [number, number][] = [];

  private app: PIXI.Application | null = null;

  constructor(rulesEditor: RulesEditor, rng: RNG, resources: Resources, width: number, height: number) {
    this.rulesEditor = rulesEditor;
    this.rng = rng;
    this.resources = resources;
    this.width = width;
    this.height = height;
    this.tileset = rulesEditor.buildRules();
  }

  init(): void {
    this.propagator = [];
    this.wave = [];
    this.entropies = [];
    this.compatible = [];
    this.toPropagate = [];

    const tileset = this.rulesEditor.buildRules();
    this.tileset = tileset;

    const T = tileset.cells.length;
    const width = this.width;
    const height = this.height;
    const length = width * height;

    const tmpPropagator: boolean[][][] = [];
    for (let direction = 0; direction < 4; direction++) {
      tmpPropagator[direction] = [];
      for (let cell1 = 0; cell1 < T; cell1++) {
        tmpPropagator[direction][cell1] = [];
        for (let cell2 = 0; cell2 < T; cell2++) {
          tmpPropagator[direction][cell1][cell2] = false;
        }
      }
    }

    for (let [first, next] of tileset.right) {
      const opposite = Model.opposite[Direction.RIGHT];
      tmpPropagator[Direction.RIGHT][first][next] = true;
      tmpPropagator[opposite][next][first] = true;
    }

    for (let [first, next] of tileset.down) {
      const opposite = Model.opposite[Direction.DOWN];
      tmpPropagator[Direction.DOWN][first][next] = true;
      tmpPropagator[opposite][next][first] = true;
    }

    for (let direction = 0; direction < 4; direction++) {
      this.propagator[direction] = [];
      for (let cell1 = 0; cell1 < T; cell1++) {
        this.propagator[direction][cell1] = [];
        for (let cell2 = 0; cell2 < T; cell2++) {
          if (tmpPropagator[direction][cell1][cell2]) {
            this.propagator[direction][cell1].push(cell2);
          }
        }
      }
    }

    for (let i = 0; i < length; i++) {
      this.wave[i] = buffer(T, true);
      this.entropies[i] = T;
      this.compatible[i] = [];
      for (let t = 0; t < T; t++) {
        this.compatible[i][t] = [];
        for (let d = 0; d < 4; d++) {
          this.compatible[i][t][d] = this.propagator[Model.opposite[d]][t].length;
        }
      }
    }
  }

  observe(): readonly [number, number] {
    let min = 1E+3;
    let argmin = -1;

    const T = this.tileset.cells.length;
    const width = this.width;
    const height = this.height;
    const length = width * height;

    for (let i = 0; i < length; i++) {
      let entropy = this.entropies[i];
      if (entropy > 1 && entropy <= min) {
        min = entropy;
        argmin = i;
      }
    }

    if (argmin === -1) {
      // console.log("no observed");
      return [-1, -1];
    }

    const w = this.wave[argmin];

    let sum = 0;
    for (let t of w) {
      sum += t ? 1 : 0;
    }

    let rnd_sum = this.rng.range(0, sum);
    let rnd_t = 0;
    for (let t = 0; t < T; t++) {
      rnd_sum -= w[t] ? 1 : 0;
      if (rnd_sum < 0) break;
      rnd_t++;
    }

    // console.log(`observed ${argmin} ${rnd_t}`);

    for (let t = 0; t < T; t++) {
      if (w[t] != (t == rnd_t)) {
        this.ban(argmin, t);
      }
    }

    return [argmin, rnd_t];
  }

  ban(i: number, t: number): void {
    const T = this.tileset.cells.length;

    if (this.wave[i][t]) {
      this.wave[i][t] = false;
      const comp = this.compatible[i][t];
      for (let d = 0; d < 4; d++) {
        comp[d] -= T;
      }
      this.entropies[i] -= 1;
      if (this.entropies[i] === 0) {
        this.debug([i]);
        console.error(`empty cell, {x:${i % this.width},y:${Math.floor(i / this.width)}}`);
        throw `empty cell`;
      } else {
        this.toPropagate.push([i, t]);
      }
    }
  }

  propagate(): void {
    while (this.toPropagate.length > 0) {
      const [i, t] = this.toPropagate.pop()!;
      const x = i % this.width, y = Math.floor(i / this.width);
      for (let d = 0; d < 4; d++) {
        const dx = Model.DX[d], dy = Model.DY[d];
        const sx = x + dx, sy = y + dy;
        if (this.onBoundary(sx, sy)) continue;
        const s = sx + sy * this.width;
        let pattern1 = this.propagator[d][t];
        for (let st of pattern1) {
          let comp = this.compatible[s][st];
          comp[d]--;
          if (comp[d] === 0) {
            this.ban(s, st);
          }
        }
      }
    }
  }

  onBoundary(x: number, y: number): boolean {
    return x < 0 || y < 0 || x >= this.width || y >= this.height;
  }

  step(): boolean {
    const [i] = this.observe();
    if (i === -1) return true;
    this.propagate();
    return false;
  }

  run(limit: number = 0): boolean {
    let i = 0;
    for (; i < limit || limit === 0; i++) {
      if (this.step()) {
        console.log(`completed with ${i} steps`);
        return true;
      }
    }
    return false;
  }

  observed(editor: Editor): void {
    const tileset = this.tileset;
    const T = tileset.cells.length;
    const width = this.width;
    const height = this.height;
    const length = width * height;

    for (let i = 0; i < length; i++) {
      let x = i % width, y = Math.floor(i / width);
      if (this.onBoundary(x, y)) continue;
      if (this.entropies[i] !== 1) continue;
      for (let t = 0; t < T; t++) {
        if (this.wave[i][t]) {
          const [, w] = tileset.cells[t];
          // if (f >= 0) {
          //   cell.floor = tileset.tiles[f];
          // }
          if (w >= 0) {
            const cell = editor.cell(x, y);
            cell.wall = tileset.tiles[w];
          }
          break;
        }
      }
    }
  }

  debug(markup: number[] = []): void {
    const scale = 1;
    const tileset = this.tileset;
    const T = tileset.cells.length;
    const tilesize = tileset.size;
    const width = this.width;
    const height = this.height;

    if (this.app == null) {
      this.app = new PIXI.Application({
        width: width * tilesize * scale,
        height: height * tilesize * scale,
        resolution: 1,
        antialias: false,
        autoStart: false,
        sharedTicker: false,
        sharedLoader: false
      });
      document.body.appendChild(this.app.view);
    }
    const app = this.app;
    this.app.stage.removeChildren();
    const container = new PIXI.Container();
    container.scale.set(scale, scale);
    app.stage.addChild(container);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let a = this.wave[x + y * width];
        let weights_sum = 0;
        for (let t = 0; t < T; t++) {
          if (a[t]) {
            weights_sum += 1;
          }
        }
        const alpha = 1 / weights_sum;
        for (let t = 0; t < T; t++) {
          if (a[t]) {
            const [floor, wall] = tileset.cells[t];
            const tiles = (floor >= 0 ? 1 : 0) + (wall >= 0 ? 1 : 0);
            if (floor >= 0) {
              const sprite = this.resources.sprite(tileset.tiles[floor]);
              sprite.position.set(x * tilesize, y * tilesize);
              sprite.zIndex = 1;
              sprite.alpha = alpha * (1 / tiles);
              container.addChild(sprite);
            }
            if (wall >= 0) {
              const sprite = this.resources.sprite(tileset.tiles[wall]);
              sprite.position.set(x * tilesize, y * tilesize);
              sprite.zIndex = 2;
              sprite.alpha = alpha * (1 / tiles);
              container.addChild(sprite);
            }
          }
        }
      }
    }

    const graphics = new PIXI.Graphics();
    container.addChild(graphics);
    graphics.lineStyle(1, 0xFF0000);
    for (let i of markup) {
      let x = i % this.width, y = Math.floor(i / this.width);
      graphics.drawRect(x * tilesize, y * tilesize, tilesize, tilesize);
    }

    app.render();

    const canvas = app.view;

    console.log('%c ', `
      font-size: 1px;
      padding: ${canvas.height / 2}px ${canvas.width / 2}px;
      background: no-repeat url(${canvas.toDataURL('image/png')});
      background-size: ${canvas.width}px ${canvas.height}px;
    `);
  }

  constraintFromEditor(editor: Editor): void {
    const tileset = this.tileset;
    const T = tileset.cells.length;
    const width = this.width;
    const height = this.height;
    const length = width * height;

    const isOpen = buffer(length, false);
    for (let i = 0; i < length; i++) {
      let x = i % width, y = Math.floor(i / width);
      if (this.onBoundary(x, y)) continue;
      const cell = editor.cell(x, y);
      if (!cell.isEmpty) {
        if (cell.floorSprite) {
          isOpen[i] = true;
        }
        // fill static
        let floorId = -1;
        let wallId = -1;
        let wallZIndex = 0;
        if (cell.floorSprite) {
          const name = cell.floorSprite.name;
          floorId = tileset.tiles.findIndex(t => t === name);
        }
        if (cell.wallSprite) {
          wallZIndex = cell.wallSprite.zIndex;
          const name = cell.wallSprite.name;
          wallId = tileset.tiles.findIndex(t => t === name);
        }
        if (wallId >= 0) {
          let cellId = tileset.cells.findIndex(c => {
            let [f, w, z] = c;
            return f === floorId && w === wallId && z === wallZIndex;
          });
          // console.log(`found static cellId=${cellId}, {x:${i % width},y:${Math.floor(i / width)}}`);
          for (let t = 0; t < T; t++) {
            if (t !== cellId) {
              // console.log(`ban static t=${t}, {x:${i % width},y:${Math.floor(i / width)}}`);
              this.ban(i, t);
            }
          }
        }
      }
    }
    this.propagate();
    // this.debug();

    this.constraint(isOpen);
  }

  constraintFromTunneler(crawler: DungeonCrawler): void {
    const width = this.width;
    const height = this.height;
    const length = width * height;

    const isOpen = buffer(length, false);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const i = x + y * width;
        isOpen[i] = crawler.isMapOpen({x: x, y: y});
      }
    }

    this.constraint(isOpen);
  }

  private constraint(isOpen: boolean[]): void {
    const tileset = this.tileset;
    const T = tileset.cells.length;
    const width = this.width;
    const height = this.height;
    const length = width * height;

    const onlyFloorAround = (i: number): boolean => {
      let x = i % width, y = Math.floor(i / width);
      for (let dy = 0; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx !== 0 || dy !== 0) {
            let sx = x + dx;
            let sy = y + dy;
            if (this.onBoundary(sx, sy)) continue;
            if (!isOpen[sx + sy * width]) {
              return false;
            }
          }
        }
      }
      return true;
    }

    const hasFloorAround = (i: number, h: number = 2): boolean => {
      let x = i % width, y = Math.floor(i / width);
      for (let dy = -1; dy <= h; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx !== 0 || dy !== 0) {
            let sx = x + dx;
            let sy = y + dy;
            if (this.onBoundary(sx, sy)) continue;
            if (isOpen[sx + sy * width]) {
              return true;
            }
          }
        }
      }
      return false;
    }

    const checkOpen = (i: number, dx: number, dy: number): boolean | null => {
      let x = i % width, y = Math.floor(i / width);
      let sx = x + dx;
      let sy = y + dy;
      if (this.onBoundary(sx, sy)) return null;
      return isOpen[sx + sy * width];
    }

    for (let i = 0; i < length; i++) {
      const possibleTypes = buffer(6, false);

      const bottom = checkOpen(i, 0, 1);

      if (isOpen[i]) {
        possibleTypes[CellType.EMPTY] = false;
        possibleTypes[CellType.FLOOR] = true;
        if (!onlyFloorAround(i)) {
          possibleTypes[CellType.FLOOR_WALL_TOP] = true
        }
      } else {
        if (hasFloorAround(i)) {
          const top = checkOpen(i, 0, -1);

          possibleTypes[CellType.EMPTY] = !(top === true || bottom === true);
          possibleTypes[CellType.WALL_MID] = top === true || bottom === true;
          possibleTypes[CellType.WALL_TOP] = true;
          possibleTypes[CellType.WALL_SIDE] = true
        } else {
          possibleTypes[CellType.EMPTY] = true;
        }
      }

      // console.log(`possibleTypes, {x:${i % width},y:${Math.floor(i / width)}}`, possibleTypes);

      for (let t = 0; t < T; t++) {
        const type = tileset.cells[t][2];
        if (!possibleTypes[type]) {
          this.ban(i, t);
          this.propagate();
        }
      }
    }
  }
}

class ApplyRulesPaletteCell extends NamedPaletteCell {
  private readonly wfc: SimpleTiledWFC;

  constructor(resources: Resources, editor: Editor, rulesEditor: RulesEditor) {
    super("AP RL", "Apply rules", resources, editor);

    this.wfc = new SimpleTiledWFC(rulesEditor, RNG.create(), resources, editor.width, editor.height);
  }

  action(_cell: EditorMapCell): void {
  }

  protected async onClick(): Promise<void> {
    try {
      this.wfc.init();
      this.wfc.constraintFromEditor(this.editor);
      this.wfc.run(1000);
    } catch (e) {
      console.error(e);
    }
    this.wfc.observed(this.editor);
  }
}

class FindRulesErrorPaletteCell extends NamedPaletteCell {
  private readonly wfc: SimpleTiledWFC;

  constructor(resources: Resources, editor: Editor, rulesEditor: RulesEditor) {
    super("FN ER", "Find rules error", resources, editor);

    this.wfc = new SimpleTiledWFC(rulesEditor, RNG.create(), resources, editor.width, editor.height);
  }

  action(_cell: EditorMapCell): void {
  }

  protected async onClick(): Promise<void> {
    const config: any = this.resources.loader.resources['dungeon.design.json'].data;
    config.width = this.editor.width;
    config.height = this.editor.height;

    const rng = RNG.create();
    let crawler: DungeonCrawler | null = null;

    for (let i = 0; i < 1000; i++) {
      crawler = new DungeonCrawler(config, rng);
      crawler.generate();

      try {
        this.wfc.init();
        this.wfc.constraintFromTunneler(crawler);
        const result = this.wfc.run();
        if (result) {
          console.info(`[${i}] success`);
        } else {
          console.warn(`[${i}] not completed`);
        }
      } catch (e) {
        console.error(`[${i}] error found`, e);
        break;
      }
      await yields();
    }
    console.log("complete");

    for (let x = 0; x < this.editor.width; x++) {
      for (let y = 0; y < this.editor.height; y++) {
        const cell = this.editor.cell(x, y);
        if (crawler!.isMapOpen({x: x, y: y})) {
          cell.clear();
          cell.floor = "floor_1.png";
        } else {
          cell.clear();
        }
      }
    }

    this.wfc.observed(this.editor);
  }
}

class ApplyTunnelerDesignPaletteCell extends NamedPaletteCell {
  constructor(resources: Resources, editor: Editor) {
    super("CRAWL", "Run dungeon crawler", resources, editor);
  }

  action(_cell: EditorMapCell): void {
  }

  protected async onClick(): Promise<void> {
    const config: any = this.resources.loader.resources['dungeon.design.json'].data;
    config.width = this.editor.width;
    config.height = this.editor.height;
    const crawler = new DungeonCrawler(config, RNG.create());
    crawler.generate();
    for (let x = 0; x < this.editor.width; x++) {
      for (let y = 0; y < this.editor.height; y++) {
        const cell = this.editor.cell(x, y);
        if (crawler.isMapOpen({x: x, y: y})) {
          cell.clear();
          cell.floor = "floor_1.png";
        } else {
          cell.clear();
        }
      }
    }
  }
}
