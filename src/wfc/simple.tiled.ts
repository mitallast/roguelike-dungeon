import {RNG} from "../rng";
import {buffer, Color, Model, Resolution} from "./model";
import * as PIXI from 'pixi.js';

// origin: https://github.com/mxgmn/WaveFunctionCollapse/

export class SimpleTiledModel extends Model {
  tiles: Color[][];
  tilesize: number;
  weights: number[];

  constructor(
    loader: PIXI.Loader,
    tileset: Tileset,
    rng: RNG,
    width: number,
    height: number,
    periodic: boolean
  ) {
    super(rng, width, height);
    this.FMX = width;
    this.FMY = height;
    this.periodic = periodic;
    const tilesize = this.tilesize = tileset.size;
    const unique = tileset.unique;

    function mapTile(f: (x: number, y: number) => Color): Color[] {
      const result: Color[] = new Array(tilesize * tilesize);
      for (let y = 0; y < tilesize; y++) {
        for (let x = 0; x < tilesize; x++) {
          result[x + y * tilesize] = f(x, y);
        }
      }
      return result;
    }

    function rotate(array: Color[]): Color[] {
      return mapTile((x, y) => array[tilesize - 1 - y + x * tilesize]);
    }

    this.tiles = [];
    this.weights = [];

    const action: number[][] = [];
    const firstOccurrence: Partial<Record<string, number>> = {};

    const app = new PIXI.Application();
    const renderTexture = PIXI.RenderTexture.create({width: tilesize, height: tilesize});

    for (const tile of tileset.tiles) {
      let a: (i: number) => number;
      let b: (i: number) => number;
      let cardinality: number;

      switch (tile.symmetry) {
        case 'L':
          cardinality = 4;
          a = (i): number => (i + 1) % 4;
          b = (i): number => i % 2 === 0 ? i + 1 : i - 1;
          break;
        case 'T':
          cardinality = 4;
          a = (i): number => (i + 1) % 4;
          b = (i): number => i % 2 === 0 ? i : 4 - i;
          break;
        case 'I':
          cardinality = 2;
          a = (i): number => 1 - i;
          b = (i): number => i;
          break;
        case '\\':
          cardinality = 2;
          a = (i): number => 1 - i;
          b = (i): number => 1 - i;
          break;
        default:
          cardinality = 1;
          a = (i): number => i;
          b = (i): number => i;
          break;
      }

      this.T = action.length;
      firstOccurrence[tile.name] = this.T;

      for (let t = 0; t < cardinality; t++) {
        action.push([
          this.T + t,
          this.T + a(t),
          this.T + a(a(t)),
          this.T + a(a(a(t))),
          this.T + b(t),
          this.T + b(a(t)),
          this.T + b(a(a(t))),
          this.T + b(a(a(a(t))))
        ]);
      }

      if (unique) {
        for (let t = 0; t < cardinality; t++) {
          const texture: PIXI.Texture = PIXI.Texture.from(`${tile.name}-${t}.png`);
          app.renderer.render(new PIXI.Sprite(texture), renderTexture);
          const bitmap = app.renderer.plugins.extract.pixels(renderTexture);
          this.tiles.push(mapTile((x, y) => Color.fromBuffer(bitmap, tilesize, x, y)));
        }
      } else {
        const texture: PIXI.Texture = loader.resources[`${tile.name}.png`].texture!;
        app.renderer.render(new PIXI.Sprite(texture), renderTexture);
        const bitmap = app.renderer.plugins.extract.pixels(renderTexture);
        this.tiles.push(mapTile((x, y) => Color.fromBuffer(bitmap, tilesize, x, y)));

        for (let t = 1; t < cardinality; t++) {
          this.tiles.push(rotate(this.tiles[this.T + t - 1]));
        }
      }

      for (let t = 0; t < cardinality; t++) {
        this.weights.push(tile.weight || 1);
      }
    }

    this.T = action.length;

    this.propagator = buffer(4, []);
    const tmpPropagator: boolean[][][] = buffer(4, []);
    for (let d = 0; d < 4; d++) {
      tmpPropagator[d] = buffer(this.T, []);
      this.propagator[d] = buffer(this.T, []);
      for (let t = 0; t < this.T; t++) {
        tmpPropagator[d][t] = buffer(this.T, false);
      }
    }

    for (const neighbor of tileset.neighbors) {
      const left = neighbor.left;
      const right = neighbor.right;

      const L = action[firstOccurrence[left[0]]!][left.length === 1 ? 0 : parseInt(left[1])];
      const D = action[L][1];
      const R = action[firstOccurrence[right[0]]!][right.length === 1 ? 0 : parseInt(right[1])];
      const U = action[R][1];

      tmpPropagator[0][R][L] = true;
      tmpPropagator[0][action[R][6]][action[L][6]] = true;
      tmpPropagator[0][action[L][4]][action[R][4]] = true;
      tmpPropagator[0][action[L][2]][action[R][2]] = true;

      tmpPropagator[1][U][D] = true;
      tmpPropagator[1][action[D][6]][action[U][6]] = true;
      tmpPropagator[1][action[U][4]][action[D][4]] = true;
      tmpPropagator[1][action[D][2]][action[U][2]] = true;
    }

    for (let t2 = 0; t2 < this.T; t2++) {
      for (let t1 = 0; t1 < this.T; t1++) {
        tmpPropagator[2][t2][t1] = tmpPropagator[0][t1][t2];
        tmpPropagator[3][t2][t1] = tmpPropagator[1][t1][t2];
      }
    }

    const sparsePropagator: number[][][] = [];
    for (let d = 0; d < 4; d++) {
      sparsePropagator[d] = [];
      for (let t = 0; t < this.T; t++) {
        sparsePropagator[d][t] = [];
      }
    }

    for (let d = 0; d < 4; d++)
      for (let t1 = 0; t1 < this.T; t1++) {
        const sp = sparsePropagator[d][t1];
        const tp = tmpPropagator[d][t1];

        for (let t2 = 0; t2 < this.T; t2++) {
          if (tp[t2]) {
            sp.push(t2);
          }
        }

        const ST = sp.length;
        this.propagator[d][t1] = buffer(ST, 0);
        for (let st = 0; st < ST; st++) {
          this.propagator[d][t1][st] = sp[st];
        }
      }
  }

  backtrackConstraint(_index: number, _pattern: number): void {
  }

  banConstraint(_index: number, _pattern: number): void {
  }

  initConstraint(): void {
  }

  stepConstraint(): void {
  }

  protected testObserved(_index: number): void {
  }

  onBoundary(x: number, y: number): boolean {
    return !this.periodic && (x < 0 || y < 0 || x >= this.FMX || y >= this.FMY);
  }

  graphics(markup: number[]): void {
    const bitmap = new Uint8Array(4 * this.FMX * this.FMY * this.tilesize * this.tilesize);

    if (this.observed != null) {
      for (let x = 0; x < this.FMX; x++) {
        for (let y = 0; y < this.FMY; y++) {
          const tile = this.tiles[this.observed[x + y * this.FMX]];
          for (let yt = 0; yt < this.tilesize; yt++) {
            for (let xt = 0; xt < this.tilesize; xt++) {
              const c = tile[xt + yt * this.tilesize];
              const offset = x * this.tilesize + xt + (y * this.tilesize + yt) * this.FMX * this.tilesize;
              bitmap[offset * 4] = c.R;
              bitmap[offset * 4 + 1] = c.G;
              bitmap[offset * 4 + 2] = c.B;
              bitmap[offset * 4 + 3] = c.A;
            }
          }
        }
      }
    } else {
      for (let x = 0; x < this.FMX; x++) {
        for (let y = 0; y < this.FMY; y++) {
          const a = this.wave![x + y * this.FMX];
          let weightsSum = 0;
          for (let t = 0; t < this.T; t++) {
            if (a[t]) {
              weightsSum += this.weights[t];
            }
          }
          const lambda = 1 / weightsSum;

          for (let yt = 0; yt < this.tilesize; yt++) {
            for (let xt = 0; xt < this.tilesize; xt++) {

              let r = 0, g = 0, b = 0, aa = 0;
              for (let t = 0; t < this.T; t++) if (a[t]) {
                const c = this.tiles[t][xt + yt * this.tilesize];
                r += c.R * this.weights[t] * lambda;
                g += c.G * this.weights[t] * lambda;
                b += c.B * this.weights[t] * lambda;
                aa += c.A * this.weights[t] * lambda;
              }
              const offset = x * this.tilesize + xt + (y * this.tilesize + yt) * this.FMX * this.tilesize;
              bitmap[offset * 4] = r;
              bitmap[offset * 4 + 1] = g;
              bitmap[offset * 4 + 2] = b;
              bitmap[offset * 4 + 3] = aa;
            }
          }
        }
      }
    }

    const scale = 5;
    const canvas = document.createElement("canvas");
    canvas.width = this.FMX * this.tilesize * scale;
    canvas.height = this.FMY * this.tilesize * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    for (let i = 0, j = 0; j < bitmap.length; i++, j += 4) {
      ctx.fillStyle = `rgb(${bitmap[j]},${bitmap[j + 1]},${bitmap[j + 2]})`;
      const x = i % (this.FMX * this.tilesize), y = Math.floor(i / (this.FMX * this.tilesize));
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
    ctx.strokeStyle = "grey";
    for (let y = 0; y < this.FMY; y++) {
      for (let x = 0; x < this.FMX; x++) {
        ctx.strokeRect(x * scale * this.tilesize, y * scale * this.tilesize, scale * this.tilesize, scale * this.tilesize);
      }
    }

    ctx.strokeStyle = "red";
    for (const i of markup) {
      const x = i % this.FMX, y = Math.floor(i / this.FMX);
      ctx.strokeRect(x * scale * this.tilesize, y * scale * this.tilesize, scale * this.tilesize, scale * this.tilesize);
    }

    console.log('%c ', `
      font-size: 1px;
      padding: ${canvas.height / 2}px ${canvas.width / 2}px;
      background: no-repeat url(${canvas.toDataURL('image/png')});
      background-size: ${canvas.width}px ${canvas.height}px;
    `);
  }
}

interface Tileset {
  readonly size: number;
  readonly unique: boolean;
  tiles: TileSettings[];
  neighbors: TileNeighbor[];
}

interface TileSettings {
  name: string;
  symmetry?: string;
  weight?: number;
}

interface TileNeighbor {
  left: string[];
  right: string[];
}

export class SimpleTiledModelTest {
  static async test(): Promise<void> {
    const loader = new PIXI.Loader();
    loader.add("bridge.png", "Castle/bridge.png");
    loader.add("ground.png", "Castle/ground.png");
    loader.add("river.png", "Castle/river.png");
    loader.add("riverturn.png", "Castle/riverturn.png");
    loader.add("road.png", "Castle/road.png");
    loader.add("roadturn.png", "Castle/roadturn.png");
    loader.add("t.png", "Castle/t.png");
    loader.add("tower.png", "Castle/tower.png");
    loader.add("wall.png", "Castle/wall.png");
    loader.add("wallriver.png", "Castle/wallriver.png");
    loader.add("wallroad.png", "Castle/wallroad.png");
    loader.add("dungeon.json", "Castle/dungeon.json");
    await new Promise((resolve) => loader.load(() => resolve()));

    const tileset: Tileset = loader.resources["dungeon.json"].data!;
    console.log(tileset);

    const model = new SimpleTiledModel(loader, tileset, RNG.create(), 20, 20, false);
    if (await model.run() !== Resolution.Decided) {
      console.log("success");
    } else {
      console.log("fail");
    }
    console.log("model", model);
    model.graphics([]);
  }
}