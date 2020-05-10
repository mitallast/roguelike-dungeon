import {Resources} from "./resources";
import {DungeonZIndexes} from "./dungeon";
import {CellType, Direction, TilesetRules} from "./wfc/even.simple.tiled";
import {Indexer} from "./indexer";
import {UILayout} from "./ui";
import {RNG} from "./rng";
import {buffer, Model} from "./wfc/model";
import {DungeonCrawler} from "./tunneler";
import {yields} from "./concurency";
import {RulesEditor} from "./wfc/rules.editor";
import * as PIXI from "pixi.js";

const scale = 1;
const BORDER = 2;
const SPRITE_SIZE = 16;

export interface EditorSample {
  readonly tiles: string[];
  readonly cells: [number, number, number][];
  readonly map: number[][];
}

export class EditorSampleBuilder {
  private readonly _tilesIndex: Indexer<string> = Indexer.identity();
  private readonly _cellsIndex: Indexer<[number, number, number]> = Indexer.array();
  private readonly _map: number[][];

  constructor(width: number, height: number) {
    this._map = [];
    for (let y = 0; y < height; y++) {
      this._map[y] = [];
      for (let x = 0; x < width; x++) {
        this._map[y][x] = 0;
      }
    }
  }

  set(x: number, y: number, floorTile: string | undefined, wallTile: string | undefined, zIndex: number | undefined): void {
    const floorId = floorTile ? this._tilesIndex.index(floorTile) : -1;
    const wallId = wallTile ? this._tilesIndex.index(wallTile) : -1;
    this._map[y][x] = this._cellsIndex.index([floorId, wallId, zIndex || 1]);
  }

  build(): EditorSample {
    return {
      tiles: this._tilesIndex.values,
      cells: this._cellsIndex.values,
      map: this._map
    }
  }
}

export class Editor {
  readonly width: number;
  readonly height: number;

  private readonly _floorTiles: string[];
  private readonly _wallTiles: string[];

  private readonly _resources: Resources;
  private readonly _rulesEditor: RulesEditor;
  private readonly _app: PIXI.Application;

  private readonly _cells: EditorMapCell[][] = [];
  private _selected: EditorPaletteCell | null = null;

  private readonly _title: PIXI.BitmapText;

  constructor(width: number, height: number, resources: Resources, rulesEditor: RulesEditor) {
    this.width = width;
    this.height = height;
    this._resources = resources;
    this._rulesEditor = rulesEditor;

    this._floorTiles = rulesEditor.floorTiles;
    this._wallTiles = rulesEditor.wallTiles;

    this._app = new PIXI.Application({
      width: width,
      height: height,
      resolution: 2,
    });
    this._app.stage.scale.set(scale, scale);

    const div = document.createElement("div");
    div.classList.add("container");
    div.appendChild(this._app.view);
    document.body.appendChild(div);

    const layout = new UILayout();
    layout.offset(BORDER, BORDER);
    layout.commit();

    this.initPalette(layout);

    layout.offset(0, BORDER);
    this._title = new PIXI.BitmapText("title", {font: {name: "alagard", size: 16}});
    this._title.zIndex = 1000;
    this._title.position.set(layout.x, layout.y);
    this._app.stage.addChild(this._title);
    layout.offset(0, this._title.height);
    layout.offset(0, BORDER);
    layout.commit();

    this.initMap(layout);

    this._app.stage.sortChildren();
    this._app.stage.calculateBounds();
    const screenWidth = this._app.stage.width + BORDER + BORDER;
    const screenHeight = this._app.stage.height + BORDER + BORDER;
    this._app.renderer.resize(screenWidth, screenHeight);
  }

  private initPalette(layout: UILayout): void {
    const mapWidth = this.width * SPRITE_SIZE + BORDER * 2;
    const paletteWidth = Math.floor((mapWidth - BORDER) / (SPRITE_SIZE + BORDER));

    let offset = 0;
    const nextRow = (): void => {
      layout.reset();
      layout.offset(0, SPRITE_SIZE + BORDER);
      layout.commit();
    };
    const addCell = (cell: EditorPaletteCell): void => {
      cell.init();
      cell.position.set(layout.x, layout.y);
      this._app.stage.addChild(cell);
      offset++;
      if (offset % paletteWidth === 0) {
        layout.reset();
        layout.offset(0, SPRITE_SIZE + BORDER);
        layout.commit();
      } else {
        layout.offset(SPRITE_SIZE + BORDER, 0);
      }
    };

    for (const name of this._floorTiles) {
      addCell(new FloorPaletteCell(name, this._resources, this));
    }

    addCell(new ClearFloorPaletteCell(this._resources, this));
    for (const name of this._wallTiles) {
      addCell(new WallPaletteCell(name, this._resources, this));
    }

    addCell(new ClearWallPaletteCell(this._resources, this));
    addCell(new DumpPaletteCell(this._resources, this));
    addCell(new LoadPaletteCell(this._resources, this));
    addCell(new ApplyTunnelerDesignPaletteCell(this._resources, this));
    addCell(new ApplyRulesPaletteCell(this._resources, this, this._rulesEditor));
    addCell(new FindRulesErrorPaletteCell(this._resources, this, this._rulesEditor));

    nextRow();
    layout.commit();
  }

  private initMap(layout: UILayout): void {
    for (let y = 0; y < this.height; y++) {
      this._cells.push([]);
      for (let x = 0; x < this.width; x++) {
        const cell = new EditorMapCell(x, y, this._resources, this);
        cell.position.set(layout.x, layout.y);
        this._cells[y][x] = cell;
        this._app.stage.addChild(cell);

        layout.offset(SPRITE_SIZE, 0);
      }
      layout.reset();
      layout.offset(0, SPRITE_SIZE);
      layout.commit();
    }
  }

  cell(x: number, y: number): EditorMapCell {
    return this._cells[y][x];
  }

  clear(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this._cells[y][x].clear();
      }
    }
  }

  action(cell: EditorMapCell): void {
    this._selected?.action(cell);
  }

  selectPalette(cell: EditorPaletteCell): void {
    this._selected = cell;
    this._title.text = cell?.title || "";
  }

  dump(minX: number, minY: number, maxX: number, maxY: number): void {
    maxX = Math.min(this.width - 1, maxX);
    maxY = Math.min(this.height - 1, maxY);

    const builder = new EditorSampleBuilder(maxX - minX + 1, maxY - minY + 1);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const cell = this._cells[y][x];
        builder.set(
          x - minX,
          y - minY,
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
          const cell = this._cells[y + dy][x + dx];
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
  private readonly _resources: Resources;
  private readonly _editor: Editor;
  readonly cellX: number;
  readonly cellY: number;
  readonly bg: PIXI.Graphics;
  floorSprite: PIXI.Sprite | null = null;
  wallSprite: PIXI.Sprite | null = null;

  constructor(x: number, y: number, resources: Resources, editor: Editor) {
    super();
    this._resources = resources;
    this._editor = editor;
    this.cellX = x;
    this.cellY = y;

    this.bg = new PIXI.Graphics();
    this.bg.zIndex = 0;
    this.bg.beginFill(0x303030)
      .drawRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
      .endFill()
      .beginFill(0x909090)
      .drawRect(1, 1, SPRITE_SIZE - 2, SPRITE_SIZE - 2)
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
      this.floorSprite = this._resources.sprite(name);
      this.floorSprite.zIndex = DungeonZIndexes.floor;
      this.addChild(this.floorSprite);
      this.sortChildren();
    }
  }

  set wall(name: string | null) {
    this.wallSprite?.destroy();
    this.wallSprite = null;
    if (name) {
      this.wallSprite = this._resources.sprite(name);
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

  private select(): void {
    this._editor.action(this);
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
      .drawRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
      .endFill()
      .beginFill(0x707070)
      .drawRect(1, 1, SPRITE_SIZE - 2, SPRITE_SIZE - 2)
      .endFill();

    const text = new PIXI.BitmapText(this.name, {font: {name: "alagard", size: 8}});
    text.scale.set(0.5, 0.5);
    text.anchor = new PIXI.Point(0.5, 0.5);
    text.position.set(SPRITE_SIZE >> 1, SPRITE_SIZE >> 1);
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
  private _state: DumpState = DumpState.START;
  private _minX: number = 0;
  private _minY: number = 0;

  constructor(resources: Resources, editor: Editor) {
    super("DUMP", "Dump", resources, editor);
  }

  action(cell: EditorMapCell): void {
    switch (this._state) {
      case DumpState.START:
        this._minX = cell.cellX;
        this._minY = cell.cellY;
        this._state = DumpState.END;
        break;
      case DumpState.END:
        this.editor.dump(this._minX, this._minY, cell.cellX, cell.cellY);
        this._state = DumpState.START;
        break;
    }
  }

  protected async onClick(): Promise<void> {
    this.editor.selectPalette(this);
  }
}

class LoadPaletteCell extends NamedPaletteCell {
  private _options: EditorSample | null = null;

  constructor(resources: Resources, editor: Editor) {
    super("LOAD", "Load", resources, editor);
  }

  action(cell: EditorMapCell): void {
    if (this._options) {
      this.editor.load(cell.cellX, cell.cellY, this._options);
    }
  }

  protected async onClick(): Promise<void> {
    const source = prompt("enter json");
    if (source) {
      this._options = JSON.parse(source);
      this.editor.selectPalette(this);
    }
  }
}

class SimpleTiledWFC {
  private readonly _rulesEditor: RulesEditor;
  private readonly _rng: RNG;
  private readonly _resources: Resources;
  private readonly _width: number;
  private readonly _height: number;

  private _tileset: TilesetRules;
  private _propagator: number[][][] = [];
  private _wave: boolean[][] = [];
  private _entropies: number[] = [];
  private _compatible: number[][][] = [];
  private _propagate: [number, number][] = [];

  private _app: PIXI.Application | null = null;

  constructor(rulesEditor: RulesEditor, rng: RNG, resources: Resources, width: number, height: number) {
    this._rulesEditor = rulesEditor;
    this._rng = rng;
    this._resources = resources;
    this._width = width;
    this._height = height;
    this._tileset = rulesEditor.buildRules();
  }

  init(): void {
    this._propagator = [];
    this._wave = [];
    this._entropies = [];
    this._compatible = [];
    this._propagate = [];

    const tileset = this._rulesEditor.buildRules();
    this._tileset = tileset;

    const T = tileset.cells.length;
    const width = this._width;
    const height = this._height;
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

    for (const [first, next] of tileset.right) {
      const opposite = Model.opposite[Direction.RIGHT];
      tmpPropagator[Direction.RIGHT][first][next] = true;
      tmpPropagator[opposite][next][first] = true;
    }

    for (const [first, next] of tileset.down) {
      const opposite = Model.opposite[Direction.DOWN];
      tmpPropagator[Direction.DOWN][first][next] = true;
      tmpPropagator[opposite][next][first] = true;
    }

    for (let direction = 0; direction < 4; direction++) {
      this._propagator[direction] = [];
      for (let cell1 = 0; cell1 < T; cell1++) {
        this._propagator[direction][cell1] = [];
        for (let cell2 = 0; cell2 < T; cell2++) {
          if (tmpPropagator[direction][cell1][cell2]) {
            this._propagator[direction][cell1].push(cell2);
          }
        }
      }
    }

    for (let i = 0; i < length; i++) {
      this._wave[i] = buffer(T, true);
      this._entropies[i] = T;
      this._compatible[i] = [];
      for (let t = 0; t < T; t++) {
        this._compatible[i][t] = [];
        for (let d = 0; d < 4; d++) {
          this._compatible[i][t][d] = this._propagator[Model.opposite[d]][t].length;
        }
      }
    }
  }

  observe(): readonly [number, number] {
    let min = 1E+3;
    let argmin = -1;

    const T = this._tileset.cells.length;
    const width = this._width;
    const height = this._height;
    const length = width * height;

    for (let i = 0; i < length; i++) {
      const entropy = this._entropies[i];
      if (entropy > 1 && entropy <= min) {
        min = entropy;
        argmin = i;
      }
    }

    if (argmin === -1) {
      // console.log("no observed");
      return [-1, -1];
    }

    const w = this._wave[argmin];

    let sum = 0;
    for (const t of w) {
      sum += t ? 1 : 0;
    }

    let rndSum = this._rng.range(0, sum);
    let rndT = 0;
    for (let t = 0; t < T; t++) {
      rndSum -= w[t] ? 1 : 0;
      if (rndSum < 0) break;
      rndT++;
    }

    // console.log(`observed ${argmin} ${rnd_t}`);

    for (let t = 0; t < T; t++) {
      if (w[t] != (t == rndT)) {
        this.ban(argmin, t);
      }
    }

    return [argmin, rndT];
  }

  ban(i: number, t: number): void {
    const T = this._tileset.cells.length;

    if (this._wave[i][t]) {
      this._wave[i][t] = false;
      const comp = this._compatible[i][t];
      for (let d = 0; d < 4; d++) {
        comp[d] -= T;
      }
      this._entropies[i] -= 1;
      if (this._entropies[i] === 0) {
        this.debug([i]);
        console.error(`empty cell, {x:${i % this._width},y:${Math.floor(i / this._width)}}`);
        throw `empty cell`;
      } else {
        this._propagate.push([i, t]);
      }
    }
  }

  propagate(): void {
    while (this._propagate.length > 0) {
      const [i, t] = this._propagate.pop()!;
      const x = i % this._width, y = Math.floor(i / this._width);
      for (let d = 0; d < 4; d++) {
        const dx = Model.DX[d], dy = Model.DY[d];
        const sx = x + dx, sy = y + dy;
        if (this.onBoundary(sx, sy)) continue;
        const s = sx + sy * this._width;
        const pattern1 = this._propagator[d][t];
        for (const st of pattern1) {
          const comp = this._compatible[s][st];
          comp[d]--;
          if (comp[d] === 0) {
            this.ban(s, st);
          }
        }
      }
    }
  }

  onBoundary(x: number, y: number): boolean {
    return x < 0 || y < 0 || x >= this._width || y >= this._height;
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
    const tileset = this._tileset;
    const T = tileset.cells.length;
    const width = this._width;
    const height = this._height;
    const length = width * height;

    for (let i = 0; i < length; i++) {
      const x = i % width, y = Math.floor(i / width);
      if (this.onBoundary(x, y)) continue;
      if (this._entropies[i] !== 1) continue;
      for (let t = 0; t < T; t++) {
        if (this._wave[i][t]) {
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
    const tileset = this._tileset;
    const T = tileset.cells.length;
    const tilesize = tileset.size;
    const width = this._width;
    const height = this._height;

    if (this._app == null) {
      this._app = new PIXI.Application({
        width: width * tilesize * scale,
        height: height * tilesize * scale,
        resolution: 1,
        antialias: false,
        autoStart: false,
        sharedTicker: false,
        sharedLoader: false
      });
      document.body.appendChild(this._app.view);
    }
    const app = this._app;
    this._app.stage.removeChildren();
    const container = new PIXI.Container();
    container.scale.set(scale, scale);
    app.stage.addChild(container);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const a = this._wave[x + y * width];
        let weightsSum = 0;
        for (let t = 0; t < T; t++) {
          if (a[t]) {
            weightsSum += 1;
          }
        }
        const alpha = 1 / weightsSum;
        for (let t = 0; t < T; t++) {
          if (a[t]) {
            const [floor, wall] = tileset.cells[t];
            const tiles = (floor >= 0 ? 1 : 0) + (wall >= 0 ? 1 : 0);
            if (floor >= 0) {
              const sprite = this._resources.sprite(tileset.tiles[floor]);
              sprite.position.set(x * tilesize, y * tilesize);
              sprite.zIndex = 1;
              sprite.alpha = alpha * (1 / tiles);
              container.addChild(sprite);
            }
            if (wall >= 0) {
              const sprite = this._resources.sprite(tileset.tiles[wall]);
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
    for (const i of markup) {
      const x = i % this._width, y = Math.floor(i / this._width);
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
    const tileset = this._tileset;
    const T = tileset.cells.length;
    const width = this._width;
    const height = this._height;
    const length = width * height;

    const isOpen = buffer(length, false);
    for (let i = 0; i < length; i++) {
      const x = i % width, y = Math.floor(i / width);
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
          const cellId = tileset.cells.findIndex(c => {
            const [f, w, z] = c;
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
    const width = this._width;
    const height = this._height;
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
    const tileset = this._tileset;
    const T = tileset.cells.length;
    const width = this._width;
    const height = this._height;
    const length = width * height;

    const onlyFloorAround = (i: number): boolean => {
      const x = i % width, y = Math.floor(i / width);
      for (let dy = 0; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx !== 0 || dy !== 0) {
            const sx = x + dx;
            const sy = y + dy;
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
      const x = i % width, y = Math.floor(i / width);
      for (let dy = -1; dy <= h; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx !== 0 || dy !== 0) {
            const sx = x + dx;
            const sy = y + dy;
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
      const x = i % width, y = Math.floor(i / width);
      const sx = x + dx;
      const sy = y + dy;
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
  private readonly _wfc: SimpleTiledWFC;

  constructor(resources: Resources, editor: Editor, rulesEditor: RulesEditor) {
    super("AP RL", "Apply rules", resources, editor);

    this._wfc = new SimpleTiledWFC(rulesEditor, RNG.create(), resources, editor.width, editor.height);
  }

  action(_cell: EditorMapCell): void {
  }

  protected async onClick(): Promise<void> {
    try {
      this._wfc.init();
      this._wfc.constraintFromEditor(this.editor);
      this._wfc.run(1000);
    } catch (e) {
      console.error(e);
    }
    this._wfc.observed(this.editor);
  }
}

class FindRulesErrorPaletteCell extends NamedPaletteCell {
  private readonly _wfc: SimpleTiledWFC;

  constructor(resources: Resources, editor: Editor, rulesEditor: RulesEditor) {
    super("FN ER", "Find rules error", resources, editor);

    this._wfc = new SimpleTiledWFC(rulesEditor, RNG.create(), resources, editor.width, editor.height);
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
        this._wfc.init();
        this._wfc.constraintFromTunneler(crawler);
        const result = this._wfc.run();
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

    this._wfc.observed(this.editor);
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
