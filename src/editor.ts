import {Resources} from "./resources";
import {DungeonZIndexes} from "./dungeon.map";
import {TilesetRulesBuilder} from "./wfc/even.simple.tiled";
import {Indexer} from "./indexer";
import * as PIXI from "pixi.js";

const scale = 3;
const border = 2;
const skip = 1;
const sprite_size = 16;

interface EditorSample {
  readonly tiles: string[];
  readonly cells: [number, number, number][];
  readonly map: number[][];
}

class EditorSampleBuilder {
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
  private readonly width: number;
  private readonly height: number;

  private readonly floorNames: string[];
  private readonly wallNames: string[];

  private readonly resources: Resources;
  private readonly app: PIXI.Application;

  private readonly cells: EditorMapCell[][] = [];
  private selected: EditorPaletteCell | null = null;

  private readonly title: PIXI.Text;

  constructor(width: number, height: number, resources: Resources) {
    this.width = width;
    this.height = height;
    this.resources = resources;

    const textures = resources.textures
      // .filter(s => s.startsWith("floor_") || !s.match(/_\d\.png$/))
      .filter(s => s.indexOf("_banner_") < 0)
      .filter(s => s.indexOf("_column_") < 0)
      .filter(s => s.indexOf("_goo") < 0)
      .filter(s => s.indexOf("_fountain_") < 0)
    ;
    this.floorNames = textures.filter(s => s.match(/^(wood|floor|road|grass)_/));
    this.wallNames = textures.filter(s => s.match(/^(wall|window|door)_/));

    const map_width = this.width * sprite_size + border * 2;
    const map_height = this.height * sprite_size + border * 2;

    const palette_length = this.floorNames.length + this.wallNames.length + 7;
    const palette_width = Math.floor((map_width - border) / (sprite_size + border));
    const palette_rows = Math.ceil(palette_length / palette_width);
    const palette_height = ((palette_rows + skip) * (sprite_size + border) + border);

    this.app = new PIXI.Application({
      width: map_width * scale,
      height: (palette_height + map_height) * scale,
    });

    const div = document.createElement("div");
    div.classList.add("container");
    div.appendChild(this.app.view);
    document.body.appendChild(div);

    const style = new PIXI.TextStyle({
      fontFamily: "silkscreennormal",
      fontSize: 42,
      fill: "white"
    });
    this.title = new PIXI.Text("", style);

    this.initPalette();
    this.initCells();
  }

  private initPalette() {
    const map_width = this.width * sprite_size + border * 2;
    const palette_length = this.floorNames.length + this.wallNames.length + 7;
    const palette_width = Math.floor((map_width - border) / (sprite_size + border));
    const palette_rows = Math.ceil(palette_length / palette_width);

    const container = new PIXI.Container();
    container.scale.set(scale, scale);
    container.position.set(border * scale, border * scale);
    this.app.stage.addChild(container);

    let offset = 0;
    for (let i = 0; i < this.floorNames.length; i++, offset++) {
      const x = offset % palette_width, y = Math.floor(offset / palette_width);
      const cell = new FloorPaletteCell(this.floorNames[i], x, y, this.resources, this);
      cell.init();
      container.addChild(cell.container);
    }
    {// clear floor
      const x = offset % palette_width, y = Math.floor(offset / palette_width);
      const cell = new ClearFloorPaletteCell(x, y, this.resources, this);
      cell.init();
      container.addChild(cell.container);
      offset++;
    }

    for (let i = 0; i < this.wallNames.length; i++, offset++) {
      const x = offset % palette_width, y = Math.floor(offset / palette_width);
      const cell = new WallPaletteCell(this.wallNames[i], x, y, this.resources, this);
      cell.init();
      container.addChild(cell.container);
    }

    {// clear wall
      const x = offset % palette_width, y = Math.floor(offset / palette_width);
      const cell = new ClearWallPaletteCell(x, y, this.resources, this);
      cell.init();
      container.addChild(cell.container);
      offset++;
    }

    {// clear wall
      const x = offset % palette_width, y = Math.floor(offset / palette_width);
      const cell = new ToggleZIndexPaletteCell(x, y, this.resources, this);
      cell.init();
      container.addChild(cell.container);
      offset++;
    }

    {// dump
      const x = offset % palette_width, y = Math.floor(offset / palette_width);
      const cell = new DumpPaletteCell(x, y, this.resources, this);
      cell.init();
      container.addChild(cell.container);
      offset++;
    }

    {// load
      const x = offset % palette_width, y = Math.floor(offset / palette_width);
      const cell = new LoadPaletteCell(x, y, this.resources, this);
      cell.init();
      container.addChild(cell.container);
      offset++;
    }

    {// rules
      const x = offset % palette_width, y = Math.floor(offset / palette_width);
      const cell = new EmptyRulesPaletteCell(x, y, this.resources, this);
      cell.init();
      container.addChild(cell.container);
      offset++;
    }

    {// rules
      const x = offset % palette_width, y = Math.floor(offset / palette_width);
      const cell = new NotEmptyRulesPaletteCell(x, y, this.resources, this);
      cell.init();
      container.addChild(cell.container);
      offset++;
    }

    this.title.scale.set(0.5 / scale, 0.5 / scale);
    this.title.position.set(border, (palette_rows) * (sprite_size + border) + border);
    container.addChild(this.title);
  }

  private initCells() {
    const map_width = this.width * sprite_size + border * 2;
    const palette_length = this.floorNames.length + this.wallNames.length + 4;
    const palette_width = Math.floor((map_width - border) / (sprite_size + border));
    const palette_rows = Math.ceil(palette_length / palette_width);
    const palette_height = ((palette_rows + skip) * (sprite_size + border) + border * 2);

    const container = new PIXI.Container();
    container.scale.set(scale, scale);
    container.position.set(border * scale, palette_height * scale);
    this.app.stage.addChild(container);

    for (let y = 0; y < this.height; y++) {
      this.cells.push([]);
      for (let x = 0; x < this.width; x++) {
        const cell = new EditorMapCell(x, y, this.resources, this);
        this.cells[y][x] = cell;
        container.addChild(cell.container);
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
          const [floorId, wallId, zIndex] = sample.cells[cellId];
          cell.clear();
          if (floorId >= 0) cell.floor = sample.tiles[floorId];
          if (wallId >= 0) cell.wall = sample.tiles[wallId];
          if (zIndex >= 0) cell.zIndex = zIndex;
        }
      }
    }
  }

  rules(allowEmpty: boolean): void {
    const builder = new TilesetRulesBuilder();
    const RIGHT = 2;
    const DOWN = 1;

    const map: number[][] = [];
    for (let y = 0; y < this.height; y++) {
      map[y] = [];
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x];
        if (cell.floorSprite || cell.wallSprite || allowEmpty) {
          map[y][x] = builder.addCell(
            cell.floorSprite?.name,
            cell.wallSprite?.name,
            cell.wallSprite?.zIndex
          );
        } else {
          map[y][x] = -1;
        }
      }
    }
    for (let y = 0; y < this.height - 1; y++) {
      for (let x = 0; x < this.width - 1; x++) {
        const first = map[y][x];
        if (first !== -1 || allowEmpty) {
          const right = map[y][x + 1];
          if (right !== -1 || allowEmpty) {
            builder.addRule(first, right, RIGHT);
          }
          const down = map[y + 1][x];
          if (down !== -1 || allowEmpty) {
            builder.addRule(first, down, DOWN);
          }
        }
      }
    }

    console.log(JSON.stringify(builder.build()));
  }
}

class EditorMapCell {
  private readonly resources: Resources;
  private readonly editor: Editor;
  readonly x: number;
  readonly y: number;
  readonly container: PIXI.Container;
  readonly bg: PIXI.Graphics;
  floorSprite: PIXI.Sprite | null = null;
  wallSprite: PIXI.Sprite | null = null;
  private readonly zIndexText: PIXI.Text;

  constructor(x: number, y: number, resources: Resources, editor: Editor) {
    this.resources = resources;
    this.editor = editor;
    this.x = x;
    this.y = y;

    this.bg = new PIXI.Graphics();
    this.bg.zIndex = 0;
    this.bg.beginFill(0x303030)
      .drawRect(0, 0, sprite_size, sprite_size)
      .endFill()
      .beginFill(0x909090)
      .drawRect(1, 1, sprite_size - 2, sprite_size - 2)
      .endFill();

    const style = new PIXI.TextStyle({
      fontFamily: "silkscreennormal",
      fontSize: 24,
      fill: "white"
    });
    this.zIndexText = new PIXI.Text("", style);
    this.zIndexText.anchor.set(1, 0);
    this.zIndexText.position.set(sprite_size - border, border);
    this.zIndexText.zIndex = 1000;
    this.zIndexText.scale.set(0.5 / scale, 0.5 / scale);

    this.container = new PIXI.Container();
    this.container.position.set(x * sprite_size, y * sprite_size);
    this.container.addChild(this.bg);
    this.container.addChild(this.zIndexText);
    this.container.sortChildren();
    this.container.interactive = true;
    this.container.buttonMode = true;
    this.container.on('click', () => this.select());
  }

  destroy(): void {
    this.floorSprite?.destroy();
    this.wallSprite?.destroy();
    this.bg.destroy();
    this.container.destroy();
  }

  set floor(name: string | null) {
    this.floorSprite?.destroy();
    this.floorSprite = null;
    if (name) {
      this.floorSprite = this.resources.sprite(name);
      this.floorSprite.zIndex = DungeonZIndexes.floor;
      this.container.addChild(this.floorSprite);
      this.container.sortChildren();
    }
  }

  set wall(name: string | null) {
    this.wallSprite?.destroy();
    this.wallSprite = null;
    if (name) {
      this.wallSprite = this.resources.sprite(name);
      this.container.addChild(this.wallSprite);
      this.container.sortChildren();
      this.zIndex = DungeonZIndexes.wallFront;
    } else {
      this.zIndexText.text = "";
    }
  }

  set zIndex(zIndex: number) {
    if (this.wallSprite) {
      this.wallSprite.zIndex = zIndex;
      this.zIndexText.text = `${zIndex}`;
      this.container.sortChildren();
    }
  }

  toggleWallZIndex(): void {
    if (this.wallSprite) {
      if (this.wallSprite.zIndex === DungeonZIndexes.wallFront) {
        this.zIndex = DungeonZIndexes.wallBack;
      } else {
        this.zIndex = DungeonZIndexes.wallFront;
      }
    }
  }

  clear(): void {
    this.floor = null;
    this.wall = null;
  }

  private select() {
    this.editor.action(this);
  }
}

abstract class EditorPaletteCell {
  protected readonly resources: Resources;
  protected readonly editor: Editor;
  readonly title: string;
  readonly container: PIXI.Container;

  protected constructor(x: number, y: number, title: string, resources: Resources, editor: Editor) {
    this.resources = resources;
    this.editor = editor;
    this.title = title;

    this.container = new PIXI.Container();
    this.container.position.set(x * (sprite_size + border), y * (sprite_size + border));
  }

  abstract init(): void;

  abstract action(cell: EditorMapCell): void;
}

abstract class SpritePaletteCell extends EditorPaletteCell {
  protected readonly name: string;

  protected constructor(name: string, title: string, x: number, y: number, resources: Resources, editor: Editor) {
    super(x, y, title, resources, editor);
    this.name = name;
  }

  init(): void {
    const sprite = this.resources.sprite(this.name);
    sprite.interactive = true;
    sprite.buttonMode = true;
    sprite.on("click", () => this.editor.selectPalette(this));
    sprite.accessible = true;
    sprite.accessibleTitle = this.title;
    this.container.addChild(sprite);
  }
}

class FloorPaletteCell extends SpritePaletteCell {
  constructor(name: string, x: number, y: number, resources: Resources, editor: Editor) {
    super(name, `floor: ${name}`, x, y, resources, editor);
  }

  action(cell: EditorMapCell): void {
    cell.floor = this.name;
  }
}

class WallPaletteCell extends SpritePaletteCell {
  constructor(name: string, x: number, y: number, resources: Resources, editor: Editor) {
    super(name, `wall: ${name}`, x, y, resources, editor);
  }

  action(cell: EditorMapCell): void {
    cell.wall = this.name;
  }
}

abstract class NamedPaletteCell extends EditorPaletteCell {
  protected readonly name: string;

  protected constructor(name: string, title: string, x: number, y: number, resources: Resources, editor: Editor) {
    super(x, y, title, resources, editor);
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

    const style = new PIXI.TextStyle({
      fontFamily: "silkscreennormal",
      fontSize: 24,
      fill: "white"
    });

    const text = new PIXI.Text(this.name, style);
    text.anchor.set(0.5, 0.5);
    text.position.set(sprite_size >> 1, sprite_size >> 1);
    text.zIndex = 1000;
    text.scale.set(0.5 / scale, 0.5 / scale);

    this.container.addChild(graphics);
    this.container.addChild(text);
    this.container.sortChildren();
    this.container.interactive = true;
    this.container.buttonMode = true;
    this.container.on("click", () => this.click());
    this.container.accessible = true;
    this.container.accessibleTitle = this.title;
  }

  abstract click(): void;
}

class ClearFloorPaletteCell extends NamedPaletteCell {
  constructor(x: number, y: number, resources: Resources, editor: Editor) {
    super("CL FL", "Clear floor", x, y, resources, editor);
  }

  action(cell: EditorMapCell): void {
    cell.floor = null;
  }

  click(): void {
    this.editor.selectPalette(this);
  }
}

class ClearWallPaletteCell extends NamedPaletteCell {
  constructor(x: number, y: number, resources: Resources, editor: Editor) {
    super("CL WL", "Clear wall", x, y, resources, editor);
  }

  action(cell: EditorMapCell): void {
    cell.wall = null;
  }

  click(): void {
    this.editor.selectPalette(this);
  }
}

class ToggleZIndexPaletteCell extends NamedPaletteCell {
  constructor(x: number, y: number, resources: Resources, editor: Editor) {
    super("TG ZI", "ZIndex", x, y, resources, editor);
  }

  action(cell: EditorMapCell): void {
    cell.toggleWallZIndex();
  }

  click(): void {
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

  constructor(x: number, y: number, resources: Resources, editor: Editor) {
    super("DUMP", "Dump", x, y, resources, editor);
  }

  action(cell: EditorMapCell): void {
    switch (this.state) {
      case DumpState.START:
        this.min_x = cell.x;
        this.min_y = cell.y;
        this.state = DumpState.END;
        break;
      case DumpState.END:
        this.editor.dump(this.min_x, this.min_y, cell.x, cell.y);
        this.state = DumpState.START;
        break;
    }
  }

  click(): void {
    this.editor.selectPalette(this);
  }
}

class LoadPaletteCell extends NamedPaletteCell {
  private options: EditorSample | null = null;

  constructor(x: number, y: number, resources: Resources, editor: Editor) {
    super("LOAD", "Load", x, y, resources, editor);
  }

  action(cell: EditorMapCell): void {
    if (this.options) {
      this.editor.load(cell.x, cell.y, this.options);
    }
  }

  click(): void {
    const source = prompt("enter json");
    if (source) {
      this.options = JSON.parse(source);
      this.editor.selectPalette(this);
    }
  }
}

class EmptyRulesPaletteCell extends NamedPaletteCell {
  constructor(x: number, y: number, resources: Resources, editor: Editor) {
    super("RUL E", "Rules with empty cells", x, y, resources, editor);
  }

  action(_cell: EditorMapCell): void {

  }

  click(): void {
    this.editor.rules(true);
  }
}

class NotEmptyRulesPaletteCell extends NamedPaletteCell {
  constructor(x: number, y: number, resources: Resources, editor: Editor) {
    super("RUL N", "Rules without empty cells", x, y, resources, editor);
  }

  action(_cell: EditorMapCell): void {

  }

  click(): void {
    this.editor.rules(false);
  }
}