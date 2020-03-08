import {Resources} from "./resources";
import {Color} from "./wfc";

// @ts-ignore
import * as PIXI from "pixi.js";
import {TileSetOptions} from "./wfc.generator";
import {DungeonZIndexes} from "./dungeon.level";

const scale = 3;
const border = 2;
const skip = 1;
const sprite_size = 16;

export class Editor {
  private readonly width: number;
  private readonly height: number;

  private readonly floorNames: string[];
  private readonly wallNames: string[];

  private readonly resources: Resources;
  private readonly app: PIXI.Application;

  private readonly cells: EditorMapCell[][] = [];
  private selected: EditorPaletteCell = null;

  private title: PIXI.Text;

  constructor(width: number, height: number, resources: Resources) {
    this.width = width;
    this.height = height;
    this.resources = resources;

    const textures = resources.textures
      .filter(s => s.startsWith("floor_") || !s.match(/_\d\.png$/))
      .filter(s => s.indexOf("_banner_") < 0)
      .filter(s => s.indexOf("_column_") < 0)
      .filter(s => s.indexOf("_goo") < 0)
      .filter(s => s.indexOf("_fountain_") < 0)
    ;
    this.floorNames = textures.filter(s => s.startsWith("floor_"));
    this.wallNames = textures.filter(s => s.startsWith("wall_"));

    const map_width = this.width * sprite_size + border * 2;
    const map_height = this.height * sprite_size + border * 2;

    const palette_length = this.floorNames.length + this.wallNames.length + 5;
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

    this.initPalette();
    this.initCells();
  }

  private initPalette() {
    const map_width = this.width * sprite_size + border * 2;
    const palette_length = this.floorNames.length + this.wallNames.length + 4;
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

    const style = new PIXI.TextStyle({
      fontFamily: "silkscreennormal",
      fontSize: 42,
      fill: "white"
    });
    this.title = new PIXI.Text("", style);
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

    const dump: TileSetOptions[][] = [];
    for (let y = min_y; y <= max_y; y++) {
      const row: TileSetOptions[] = [];
      dump.push(row);
      for (let x = min_x; x <= max_x; x++) {
        const cell = this.cells[y][x];
        const options: TileSetOptions = {
          floor: cell.floorSprite?.name || null,
          wall: cell.wallSprite?.name || null,
          zIndex: cell.wallSprite?.zIndex || null,
          color: cell.color.rgb,
        };
        row.push(options);
      }
    }
    console.log(JSON.stringify(dump));
  }

  load(dx: number, dy: number, options: TileSetOptions[][]): void {
    for (let y = 0; y < options.length; y++) {
      for (let x = 0; x < options[y].length; x++) {
        if (y + dy < this.height && x + dx < this.width) {
          const cell = this.cells[y + dy][x + dx];
          const option = options[y][x];
          if (option) {
            cell.setOptions(option)
          } else {
            cell.clear();
          }
        }
      }
    }
  }
}

class EditorMapCell {
  private readonly resources: Resources;
  private readonly editor: Editor;
  readonly x: number;
  readonly y: number;
  readonly container: PIXI.Container;
  readonly bg: PIXI.Graphics;
  floorSprite: PIXI.Sprite = null;
  wallSprite: PIXI.Sprite = null;
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

  setFloor(name: string): void {
    this.floorSprite?.destroy();
    this.floorSprite = null;
    if (name) {
      this.floorSprite = this.resources.sprite(name);
      this.floorSprite.zIndex = DungeonZIndexes.floor;
      this.container.addChild(this.floorSprite);
      this.container.sortChildren();
    }
  }

  setWall(name: string): void {
    this.wallSprite?.destroy();
    this.wallSprite = null;
    if (name) {
      this.wallSprite = this.resources.sprite(name);
      this.container.addChild(this.wallSprite);
      this.container.sortChildren();
      this.setWallZIndex(DungeonZIndexes.wallFront);
    } else {
      this.zIndexText.text = "";
    }
  }

  setWallZIndex(zIndex: number): void {
    if (this.wallSprite) {
      this.wallSprite.zIndex = zIndex;
      this.zIndexText.text = `${zIndex}`;
      this.container.sortChildren();
    }
  }

  toggleWallZIndex(): void {
    if (this.wallSprite) {
      if (this.wallSprite.zIndex === DungeonZIndexes.wallFront) {
        this.setWallZIndex(DungeonZIndexes.wallBack);
      } else {
        this.setWallZIndex(DungeonZIndexes.wallFront);
      }
    }
  }

  setOptions(options: TileSetOptions): void {
    this.setFloor(options.floor);
    this.setWall(options.wall);
    if (options.zIndex) {
      this.setWallZIndex(options.zIndex);
    }
  }

  clear(): void {
    this.setFloor(null);
    this.setWall(null);
  }

  private select() {
    this.editor.action(this);
  }

  get color(): Color {
    const r: number = this.floorSprite ? 0 : 255;
    const g: number = this.wallSprite ? 0 : 255;
    return new Color(r, g, 255, 0);
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
    cell.setFloor(this.name);
  }
}

class WallPaletteCell extends SpritePaletteCell {
  constructor(name: string, x: number, y: number, resources: Resources, editor: Editor) {
    super(name, `wall: ${name}`, x, y, resources, editor);
  }

  action(cell: EditorMapCell): void {
    cell.setWall(this.name);
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
    cell.setFloor(null);
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
    cell.setWall(null);
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
  private min_x: number;
  private min_y: number;

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
  private options: TileSetOptions[][];

  constructor(x: number, y: number, resources: Resources, editor: Editor) {
    super("LOAD", "Load", x, y, resources, editor);
  }

  action(cell: EditorMapCell): void {
    if (this.options) {
      console.log("action", this.options);
      this.editor.load(cell.x, cell.y, this.options);
    }
  }

  click(): void {
    const source = prompt("enter json");
    if (source) {
      this.options = JSON.parse(source);
      console.log("click", this.options);
      this.editor.selectPalette(this);
    }
  }
}