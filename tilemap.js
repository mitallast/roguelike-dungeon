// https://0x72.itch.io/dungeontileset-ii

export class TileRegistry {
  constructor() {
    this.tileMap = {};
  }

  async loadTileSet() {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = ev => resolve(img);
      img.src = "0x72_DungeonTilesetII_v1.2.png";
    });
  }

  async load() {
    const tileSet = await this.loadTileSet();
    const response = await fetch("tiles_list_v1.1");
    const text = await response.text();
    const lines = text.split(/(\r?\n)/g);
    this.tileMap = {};
    lines.forEach((line) => {
      let m = line.match(/([a-z0-9_]+) +([0-9]+) +([0-9]+) +([0-9]+) +([0-9]+) ?([0-9]?)/);
      if (m) {
        const x = parseInt(m[2]);
        const y = parseInt(m[3]);
        const w = parseInt(m[4]);
        const h = parseInt(m[5]);
        const numOfFrames = parseInt(m[6] || 0);
        const tile = new Tile(tileSet, m[1], x, y, w, h, numOfFrames);
        this.tileMap[tile.name] = tile;
      }
    });
  }

  get(tileName) {
    return this.tileMap[tileName];
  }
}

export class Tile {
  constructor(tileSet, name, x, y, w, h, numOfFrames) {
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