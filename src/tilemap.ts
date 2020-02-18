// https://0x72.itch.io/dungeontileset-ii

export class TileRegistry {
  private readonly tileMap: Record<string, Tile>;

  constructor() {
    this.tileMap = {};
  }

  async loadTileSet(): Promise<HTMLImageElement> {
    return await new Promise<HTMLImageElement>((resolve => {
      const img = new Image();
      img.onload = ev => resolve(img);
      img.src = "0x72_DungeonTilesetII_v1.2.png";
    }));
  }

  async load() {
    const tileSet = await this.loadTileSet();
    const response = await fetch("tiles_list_v1.1.txt");
    const text = await response.text();
    const lines = text.split(/(\r?\n)/g);
    lines.forEach((line) => {
      let m = line.match(/([a-z0-9_]+) +([0-9]+) +([0-9]+) +([0-9]+) +([0-9]+) ?([0-9]?)/);
      if (m) {
        const x = parseInt(m[2]);
        const y = parseInt(m[3]);
        const w = parseInt(m[4]);
        const h = parseInt(m[5]);
        const numOfFrames = parseInt(m[6] || "0");
        const tile = new Tile(tileSet, m[1], x, y, w, h, numOfFrames);
        this.tileMap[tile.name] = tile;
      }
    });
  }

  get(tileName: string): Tile {
    return this.tileMap[tileName];
  }
}

export class Tile {
  readonly tileSet: HTMLImageElement;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly numOfFrames: number;
  readonly isAnim: boolean;

  constructor(tileSet: HTMLImageElement, name: string, x: number, y: number, w: number, h: number, numOfFrames: number) {
    this.tileSet = tileSet;
    this.name = name;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.numOfFrames = numOfFrames;
    this.isAnim = this.numOfFrames > 1;
  }
}