import {RNG} from "./rng";
// @ts-ignore
import * as PIXI from 'pixi.js';

// origin: https://github.com/mxgmn/WaveFunctionCollapse/

function array<T>(size: number, value: T = null): T[] {
  const a: T[] = [];
  for (let i = 0; i < size; i++) {
    a.push(value);
  }
  return a;
}

class Color {
  readonly R: number;
  readonly G: number;
  readonly B: number;
  readonly A: number;

  static fromImage(imageData: ImageData, x: number, y: number): Color {
    return Color.fromBuffer(imageData.data, imageData.width, x, y);
  }

  static fromBuffer(buffer: Uint8Array | Uint8ClampedArray, w: number, x: number, y: number): Color {
    let offset = 4 * (y * w + x);
    let R = buffer[offset];
    let G = buffer[offset + 1];
    let B = buffer[offset + 2];
    let A = buffer[offset + 3];
    return new Color(R, G, B, A);
  }

  constructor(R: number, G: number, B: number, A: number) {
    this.R = R;
    this.G = G;
    this.B = B;
    this.A = A;
  }

  equals(that: Color): boolean {
    return this.R === that.R &&
      this.G === that.G &&
      this.B === that.B &&
      this.A === that.A;
  }
}

abstract class Model {
  protected wave: boolean[][] = null;

  protected propagator: number[][][];
  compatible: number[][][];
  protected observed: number[];

  stack: [number, number][];
  stacksize: number;

  protected random: RNG;
  protected FMX: number;
  protected FMY: number;
  protected T: number;
  protected periodic: boolean;

  protected weights: number[];
  weightLogWeights: number[];

  sumsOfOnes: number[];
  sumOfWeights: number;
  sumOfWeightLogWeights: number;
  startingEntropy: number;

  sumsOfWeights: number[];
  sumsOfWeightLogWeights: number[];
  entropies: number[];

  constructor(width: number, height: number) {
    this.FMX = width;
    this.FMY = height;
  }

  init(): void {
    this.wave = array(this.FMX * this.FMY);
    this.compatible = array(this.wave.length);
    for (let i = 0; i < this.wave.length; i++) {
      this.wave[i] = array(this.T);
      this.compatible[i] = array(this.T);
      for (let t = 0; t < this.T; t++) {
        this.compatible[i][t] = array(4);
      }
    }

    this.weightLogWeights = array(this.T);
    this.sumOfWeights = 0;
    this.sumOfWeightLogWeights = 0;

    for (let t = 0; t < this.T; t++) {
      this.weightLogWeights[t] = this.weights[t] * Math.log(this.weights[t]);
      this.sumOfWeights += this.weights[t];
      this.sumOfWeightLogWeights += this.weightLogWeights[t];
    }

    this.startingEntropy = Math.log(this.sumOfWeights) - this.sumOfWeightLogWeights / this.sumOfWeights;

    this.sumsOfOnes = array(this.FMX * this.FMY);
    this.sumsOfWeights = array(this.FMX * this.FMY);
    this.sumsOfWeightLogWeights = array(this.FMX * this.FMY);
    this.entropies = array(this.FMX * this.FMY);

    this.stack = array(this.wave.length * this.T);
    this.stacksize = 0;
  }

  observe(): boolean | null {
    // console.log("observe", this);
    let min = 1E+3;
    let argmin = -1;

    for (let i = 0; i < this.wave.length; i++) {
      if (this.onBoundary(i % this.FMX, Math.floor(i / this.FMX))) continue;

      let amount = this.sumsOfOnes[i];
      if (amount == 0) {
        console.error(`[wave=${i}] found zero sum of ones`);
        return false;
      }

      let entropy = this.entropies[i];
      // console.log("entropy", entropy, "amount", amount);
      if (amount > 1 && entropy <= min) {
        let noise = 1E-6 * this.random.nextFloat();
        if (entropy + noise < min) {
          min = entropy + noise;
          argmin = i;
        }
      }
    }

    // console.log("min", min);
    // console.log("argmin", argmin);
    if (argmin == -1) {
      this.observed = array(this.FMX * this.FMY);
      for (let i = 0; i < this.wave.length; i++) {
        for (let t = 0; t < this.T; t++) {
          if (this.wave[i][t]) {
            this.observed[i] = t;
            break;
          }
        }
      }
      return true;
    }

    let distribution_sum: number = 0;
    let distribution: number[] = array(this.T);
    for (let t = 0; t < this.T; t++) {
      distribution[t] = this.wave[argmin][t] ? this.weights[t] : 0;
      distribution_sum += distribution[t];
    }
    // console.log("distribution", distribution, distribution_sum);

    let rnd = this.random.nextFloat() * distribution_sum;
    let r = 0;
    for (let weight of distribution) {
      rnd -= weight;
      if (rnd < 0) break;
      r++;
    }
    // console.log("choice r", r);

    let w = this.wave[argmin];
    // console.log("wave[argmin]", w);
    // console.log("this.T", this.T);
    for (let t = 0; t < this.T; t++) {
      if (w[t] != (t == r)) {
        // console.log(`ban argmin=${argmin}, t=${t}`);
        this.ban(argmin, t);
      } else {
        // console.log("collapsed argmin, t", t);
      }
    }

    return null;
  }

  protected propagate(): void {
    // console.log("propagate");
    while (this.stacksize > 0) {
      // console.log("pop stack");
      let e1 = this.stack[this.stacksize - 1];
      this.stack[this.stacksize - 1] = null;
      this.stacksize--;

      let i1 = e1[0]; // item1
      let x1 = i1 % this.FMX;
      let y1 = Math.floor(i1 / this.FMX); // @todo maybe FMY ?

      for (let d = 0; d < 4; d++) {
        let dx = Model.DX[d], dy = Model.DY[d];
        let x2 = x1 + dx, y2 = y1 + dy;
        if (this.onBoundary(x2, y2)) {
          continue;
        }

        if (x2 < 0) x2 += this.FMX;
        else if (x2 >= this.FMX) x2 -= this.FMX;
        if (y2 < 0) y2 += this.FMY;
        else if (y2 >= this.FMY) y2 -= this.FMY;

        // console.log("x2", x2, "y2", y2, this.FMX, this.FMY);
        let i2 = x2 + y2 * this.FMX;

        let p = this.propagator[d][e1[1]]; // item2
        // // console.log("p", p);
        let compat = this.compatible[i2];
        // // console.log("compat", JSON.stringify(compat));

        for (let l = 0; l < p.length; l++) {
          let t2 = p[l];
          let comp = compat[t2];
          comp[d]--;
          if (comp[d] == 0) {
            // console.log(`ban i2=${i2} t2=${t2}`);
            this.ban(i2, t2);
          }
        }
      }
    }
  }

  run(seed: number = null, limit: number = 0): boolean {
    if (this.wave === null) this.init();
    this.clear();
    this.random = new RNG(seed);
    for (let i = 0; i < limit || limit === 0; i++) {
      let result = this.observe();
      if (result !== null) return result;
      this.propagate();
    }

    return true;
  }

  protected ban(i: number, t: number): void {
    this.wave[i][t] = false;

    let comp = this.compatible[i][t];
    for (let d = 0; d < 4; d++) {
      comp[d] = 0;
    }
    this.stack[this.stacksize] = [i, t];
    this.stacksize++;

    // console.log("old this.entropies[i]", this.entropies[i],
    //   "this.sumsOfWeightLogWeights[i]", this.sumsOfWeightLogWeights[i],
    //   "this.sumsOfWeights[i]", this.sumsOfWeights[i],
    //   "this.weights[t]", this.weights[t],
    //   "Math.log(this.sumsOfWeights[i])", Math.log(this.sumsOfWeights[i]),
    //   "this.sumsOfWeightLogWeights[i] / this.sumsOfWeights[i]", this.sumsOfWeightLogWeights[i] / this.sumsOfWeights[i],
    //   "entropy", Math.log(this.sumsOfWeights[i]) - this.sumsOfWeightLogWeights[i] / this.sumsOfWeights[i]
    // );

    this.sumsOfOnes[i] -= 1;
    this.sumsOfWeights[i] -= this.weights[t];
    this.sumsOfWeightLogWeights[i] -= this.weightLogWeights[t];

    let sum = this.sumsOfWeights[i];
    this.entropies[i] = Math.log(sum) - this.sumsOfWeightLogWeights[i] / sum;

    // console.log("new this.entropies[i]", this.entropies[i],
    //   "this.sumsOfWeightLogWeights[i]", this.sumsOfWeightLogWeights[i],
    //   "this.sumsOfWeights[i]", this.sumsOfWeights[i],
    //   "this.weights[t]", this.weights[t],
    //   "Math.log(this.sumsOfWeights[i])", Math.log(this.sumsOfWeights[i]),
    //   "this.sumsOfWeightLogWeights[i] / this.sumsOfWeights[i]", this.sumsOfWeightLogWeights[i] / this.sumsOfWeights[i],
    //   "entropy", Math.log(this.sumsOfWeights[i]) - this.sumsOfWeightLogWeights[i] / this.sumsOfWeights[i]
    // );
  }

  protected clear(): void {
    for (let i = 0; i < this.wave.length; i++) {
      for (let t = 0; t < this.T; t++) {
        this.wave[i][t] = true;
        for (let d = 0; d < 4; d++) {
          this.compatible[i][t][d] = this.propagator[Model.opposite[d]][t].length;
        }
      }

      this.sumsOfOnes[i] = this.weights.length;
      this.sumsOfWeights[i] = this.sumOfWeights;
      this.sumsOfWeightLogWeights[i] = this.sumOfWeightLogWeights;
      this.entropies[i] = this.startingEntropy;
    }
  }

  protected abstract onBoundary(x: number, y: number): boolean;

  abstract graphics(): void;

  protected static DX: number[] = [-1, 0, 1, 0];
  protected static DY: number[] = [0, 1, 0, -1];
  static opposite: number[] = [2, 3, 0, 1];
}

class OverlappingModel extends Model {
  N: number;
  patterns: number[][];
  colors: Color[];
  ground: number;

  constructor(
    image: Color[][], // y >> x
    N: number,
    width: number,
    height: number,
    periodicInput: boolean,
    periodicOutput: boolean,
    symmetry: number,
    ground: number) {
    super(width, height);

    this.N = N;
    this.periodic = periodicOutput;
    let SMY = image.length;
    let SMX = image[0].length;
    this.colors = [];
    let sample: number[][] = array(SMY);

    for (let y = 0; y < SMY; y++) {
      sample[y] = array(SMX);
      for (let x = 0; x < SMX; x++) {
        let color = image[y][x];
        let i = 0;
        for (let c of this.colors) {
          if (c.equals(color)) {
            break;
          }
          i++;
        }
        if (i == this.colors.length) {
          this.colors.push(color);
        }
        sample[y][x] = i;
      }
    }

    // console.log(sample);

    const C = this.colors.length;
    const W = Math.pow(C, N * N); // @todo bigint

    function pattern(f: (x: number, y: number) => number): number[] {
      const result = [];
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          result.push(f(x, y));
        }
      }
      return result;
    }

    function patternFromSample(x: number, y: number): number[] {
      return pattern((dx, dy) => sample[(y + dy) % SMY][(x + dx) % SMX]);
    }

    function rotate(p: number[]): number[] {
      return pattern((x, y) => p[N - 1 - y + x * N]);
    }

    function reflect(p: number[]): number[] {
      return pattern((x, y) => p[N - 1 - x + y * N]);
    }

    function index(p: number[]): number {
      let result = 0, power = 1;
      for (let i = 0; i < p.length; i++) {
        result += p[p.length - 1 - i] * power;
        power *= C;
      }
      return result;
    }

    function patternFromIndex(ind: number): number[] {  // // @todo ind bigint
      let residue = ind, power = W; // @todo bigint
      let result: number[] = [];
      for (let i = 0; i < N * N; i++) {
        power /= C; // @todo bigint
        let count = 0;
        while (residue >= power) {
          residue -= power;
          count++;
        }
        result.push(count);
      }
      return result;
    }

    let weights = new Map<number, number>();

    for (let y = 0; y < (periodicInput ? SMY : SMY - N + 1); y++) {
      for (let x = 0; x < (periodicInput ? SMX : SMX - N + 1); x++) {
        let ps: number[][] = [];

        ps[0] = patternFromSample(x, y);
        ps[1] = reflect(ps[0]);
        ps[2] = rotate(ps[0]);
        ps[3] = reflect(ps[2]);
        ps[4] = rotate(ps[2]);
        ps[5] = reflect(ps[4]);
        ps[6] = rotate(ps[4]);
        ps[7] = reflect(ps[6]);

        for (let k = 0; k < symmetry; k++) {
          let ind = index(ps[k]);
          const weight = weights.get(ind) || 0;
          weights.set(ind, weight + 1);
        }
      }
    }

    // console.log("weights", weights);

    this.T = weights.size;
    this.ground = (ground + this.T) % this.T;
    this.patterns = [];
    this.weights = [];

    for (const [ind, weight] of weights) {
      this.patterns.push(patternFromIndex(ind));
      this.weights.push(weight);
    }

    function agrees(pattern1: number[], pattern2: number[], dx: number, dy: number): boolean {
      let xmin = dx < 0 ? 0 : dx;
      let xmax = dx < 0 ? dx + N : N;
      let ymin = dy < 0 ? 0 : dy;
      let ymax = dy < 0 ? dy + N : N;
      for (let y = ymin; y < ymax; y++) {
        for (let x = xmin; x < xmax; x++) {
          if (pattern1[x + N * y] != pattern2[x - dx + N * (y - dy)]) {
            return false;
          }
        }
      }
      return true;
    }

    this.propagator = array(4);
    for (let d = 0; d < 4; d++) {
      this.propagator[d] = array(this.T);
      for (let t = 0; t < this.T; t++) {
        let list: number[] = [];
        for (let t2 = 0; t2 < this.T; t2++) {
          if (agrees(this.patterns[t], this.patterns[t2], Model.DX[d], Model.DY[d])) {
            list.push(t2);
          }
        }
        this.propagator[d][t] = list;
      }
    }
  }

  protected onBoundary(x: number, y: number): boolean {
    return !this.periodic && (x + this.N > this.FMX || y + this.N > this.FMY || x < 0 || y < 0);
  }

  protected clear(): void {
    super.clear();
    if (this.ground != 0) {
      for (let x = 0; x < this.FMX; x++) {
        for (let t = 0; t < this.T; t++) {
          if (t != this.ground) {
            this.ban(x + (this.FMY - 1) * this.FMX, t);
          }
        }
        for (let y = 0; y < this.FMY - 1; y++) {
          this.ban(x + y * this.FMX, this.ground);
        }
      }
      this.propagate();
    }
  }

  graphics(): void {
    const bitmap = new Uint8Array(4 * this.FMX * this.FMY);
    if (this.observed != null) {
      for (let y = 0; y < this.FMY; y++) {
        let dy = y < this.FMY - this.N + 1 ? 0 : this.N - 1;

        for (let x = 0; x < this.FMX; x++) {
          let dx = x < this.FMX - this.N - 1 ? 0 : this.N - 1;

          let c = this.colors[this.patterns[this.observed[x - dx + (y - dy) * this.FMX]][dx + dy * this.N]];
          let offset = 4 * (x + y * this.FMX);
          bitmap[offset] = c.R;
          bitmap[offset + 1] = c.G;
          bitmap[offset + 2] = c.B;
          bitmap[offset + 3] = c.A;
        }
      }
    } else {
      for (let i = 0; i < this.wave.length; i++) {
        let contributors = 0, r = 0, g = 0, b = 0, a = 0;
        let x = i % this.FMX, y = i / this.FMX;

        for (let dy = 0; dy < this.N; dy++) {
          for (let dx = 0; dx < this.N; dx++) {
            let sx = x - dx;
            if (sx < 0) sx += this.FMX;

            let sy = y - dy;
            if (sy < 0) sy += this.FMY;

            let s = sx + sy * this.FMX;
            if (this.onBoundary(sx, sy)) {
              continue;
            }
            for (let t = 0; t < this.T; t++) {
              // console.log("this.wave", s, t);
              if (this.wave[s][t]) {
                contributors++;
                // console.log("this.patterns[t][dx + dy * this.N]", this.patterns[t][dx + dy * this.N],
                //   "this.patterns[t]", this.patterns[t],
                //   "dx + dy * this.N", dx + dy * this.N,
                //   "this.colors", this.colors,
                // );
                let color = this.colors[this.patterns[t][dx + dy * this.N]];
                r += color.R;
                g += color.G;
                b += color.B;
                a += color.A;
              }
            }
          }
        }

        bitmap[i * 4] = Math.floor(r / contributors);
        bitmap[i * 4 + 1] = Math.floor(g / contributors);
        bitmap[i * 4 + 2] = Math.floor(b / contributors);
        bitmap[i * 4 + 3] = Math.floor(a / contributors);
      }
    }

    let canvas = document.createElement("canvas");
    canvas.width = this.FMX;
    canvas.height = this.FMY;
    canvas.style.margin = "10px";
    let ctx = canvas.getContext("2d");
    let img = ctx.createImageData(this.FMX, this.FMY);
    img.data.set(bitmap);
    ctx.putImageData(img, 0, 0);
    document.body.appendChild(canvas);
  }
}

class SimpleTiledModel extends Model {
  tiles: Color[][];
  tilenames: string[];
  tilesize: number;
  black: boolean;

  constructor(
    tileset: ITileSet,
    subsetName: string,
    width: number,
    height: number,
    periodic: boolean,
    black: boolean
  ) {
    super(width, height);
    this.periodic = periodic;
    this.black = black;

    let tilesize: number = tileset.size || 16;
    let unique: boolean = tileset.unique || false;

    let subset: string[] = null;
    if (subsetName != null) {
      let xsubset = tileset.subsets.find(s => s.name === subsetName);
      if (xsubset == null) {
        console.error("subset not found");
      } else {
        subset = xsubset.tiles.map(t => t.name);
      }
    }

    function tile(f: (x: number, y: number) => Color): Color[] {
      let result: Color[] = array(tilesize * tilesize);
      for (let y = 0; y < tilesize; y++) {
        for (let x = 0; x < tilesize; x++) {
          result[x + y * tilesize] = f(x, y);
        }
      }
      return result;
    }

    function rotate(array: Color[]): Color[] {
      return tile((x, y) => array[tilesize - 1 - y + x * tilesize]);
    }

    this.tiles = [];
    this.tilenames = [];
    let tempStationary: number[] = [];

    let action: number[][] = [];
    let firstOccurrence = new Map<string, number>();

    const app = new PIXI.Application();
    let sheet: PIXI.Spritesheet = PIXI.Loader.shared.resources["tiles.json"].spritesheet;
    let renderTexture = PIXI.RenderTexture.create({width: tilesize, height: tilesize});

    for (let xtile of tileset.tiles) {
      let tilename = xtile.name;
      if (subset != null && subset.indexOf(tilename) < 0) continue;

      let a: (i: number) => number;
      let b: (i: number) => number;
      let cardinality: number;

      let sym = xtile.symmetry || 'X';
      if (sym == 'L') {
        cardinality = 4;
        a = (i) => (i + 1) % 4;
        b = (i) => i % 2 == 0 ? i + 1 : i - 1;
      } else if (sym == 'T') {
        cardinality = 4;
        a = (i) => (i + 1) % 4;
        b = (i) => i % 2 == 0 ? i : 4 - i;
      } else if (sym == 'I') {
        cardinality = 2;
        a = (i) => 1 - i;
        b = (i) => i;
      } else if (sym == '\\') {
        cardinality = 2;
        a = (i) => 1 - i;
        b = (i) => 1 - i;
      } else {
        cardinality = 1;
        a = (i) => i;
        b = (i) => i;
      }

      this.T = action.length;
      firstOccurrence.set(tilename, this.T);

      let map: number[][] = array(cardinality);
      for (let t = 0; t < cardinality; t++) {
        map[t] = array(8);
        map[t][0] = t;
        map[t][1] = a(t);
        map[t][2] = a(a(t));
        map[t][3] = a(a(a(t)));
        map[t][4] = b(t);
        map[t][5] = b(a(t));
        map[t][6] = b(a(a(t)));
        map[t][7] = b(a(a(a(t))));

        for (let s = 0; s < 8; s++) map[t][s] += this.T;

        action.push(map[t]);
      }

      if (unique) {
        for (let t = 0; t < cardinality; t++) {
          let texture: PIXI.Texture = sheet.textures[`${tilename}-${t}.png`];
          app.renderer.render(new PIXI.Sprite(texture), renderTexture);
          let bitmap = app.renderer.plugins.extract.pixels(renderTexture);
          this.tiles.push(tile((x, y) => Color.fromBuffer(bitmap, tilesize, x, y)));
          this.tilenames.push(`${tilename} ${t}`);
        }
      } else {
        let texture: PIXI.Texture = sheet.textures[`${tilename}.png`];
        app.renderer.render(new PIXI.Sprite(texture), renderTexture);
        let bitmap = app.renderer.plugins.extract.pixels(renderTexture);
        this.tiles.push(tile((x, y) => Color.fromBuffer(bitmap, tilesize, x, y)));
        this.tilenames.push(`${tilename} 0`);

        for (let t = 1; t < cardinality; t++) {
          this.tiles.push(rotate(this.tiles[this.T + t - 1]));
          this.tilenames.push(`${tilename} ${t}`);
        }
      }

      for (let t = 0; t < cardinality; t++) {
        tempStationary.push(xtile.weight || 1);
      }
    }

    this.T = action.length;
    this.weights = tempStationary;

    this.propagator = array(4);
    let tempPropagator: boolean[][][] = array(4);
    for (let d = 0; d < 4; d++) {
      tempPropagator[d] = array(this.T);
      this.propagator[d] = array(this.T);
      for (let t = 0; t < this.T; t++) {
        tempPropagator[d][t] = array(this.T);
      }
    }

    for (let xneighbor of tileset.neighbors) {
      let left = xneighbor.left;
      let right = xneighbor.right;

      if (subset != null && (subset.indexOf(left[0]) < 0 || subset.indexOf(right[0]) < 0)) {
        continue;
      }

      let L = action[firstOccurrence.get(left[0])][left.length == 1 ? 0 : parseInt(left[1])];
      let D = action[L][1];
      let R = action[firstOccurrence.get(right[0])][right.length == 1 ? 0 : parseInt(right[1])];
      let U = action[R][1];

      tempPropagator[0][R][L] = true;
      tempPropagator[0][action[R][6]][action[L][6]] = true;
      tempPropagator[0][action[L][4]][action[R][4]] = true;
      tempPropagator[0][action[L][2]][action[R][2]] = true;

      tempPropagator[1][U][D] = true;
      tempPropagator[1][action[D][6]][action[U][6]] = true;
      tempPropagator[1][action[U][4]][action[D][4]] = true;
      tempPropagator[1][action[D][2]][action[U][2]] = true;
    }

    for (let t2 = 0; t2 < this.T; t2++) {
      for (let t1 = 0; t1 < this.T; t1++) {
        tempPropagator[2][t2][t1] = tempPropagator[0][t1][t2];
        tempPropagator[3][t2][t1] = tempPropagator[1][t1][t2];
      }
    }

    let sparsePropagator: number[][][] = array(4);
    for (let d = 0; d < 4; d++) {
      sparsePropagator[d] = array(this.T);
      for (let t = 0; t < this.T; t++) {
        sparsePropagator[d][t] = [];
      }
    }

    for (let d = 0; d < 4; d++)
      for (let t1 = 0; t1 < this.T; t1++) {
        let sp = sparsePropagator[d][t1];
        let tp = tempPropagator[d][t1];

        for (let t2 = 0; t2 < this.T; t2++) {
          if (tp[t2]) {
            sp.push(t2);
          }
        }

        let ST = sp.length;
        this.propagator[d][t1] = array(ST);
        for (let st = 0; st < ST; st++) {
          this.propagator[d][t1][st] = sp[st];
        }
      }
  }

  protected onBoundary(x: number, y: number): boolean {
    return !this.periodic && (x < 0 || y < 0 || x >= this.FMX || y >= this.FMY);
  }

  text(): void {
    let result = [];
    for (let y = 0; y < this.FMY; y++) {
      for (let x = 0; x < this.FMX; x++) {
        result.push(`${this.tilenames[this.observed[x + y * this.FMX]]}, `);
      }
      result.push("\n");
    }
    // console.log(result.join());
  }

  graphics(): void {
    const bitmap = new Uint8Array(4 * this.FMX * this.FMY);

    if (this.observed != null) {
      for (let x = 0; x < this.FMX; x++) {
        for (let y = 0; y < this.FMY; y++) {
          let tile = this.tiles[this.observed[x + y * this.FMX]];
          for (let yt = 0; yt < this.tilesize; yt++) {
            for (let xt = 0; xt < this.tilesize; xt++) {
              let c = tile[xt + yt * this.tilesize];
              let offset = x * this.tilesize + xt + (y * this.tilesize + yt) * this.FMX * this.tilesize;
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
          let a = this.wave[x + y * this.FMX];
          let amount = a.filter(v => v).length;

          let weights_sum = 0;
          for (let t = 0; t < this.T; t++) {
            if (a[t]) {
              weights_sum += this.weights[t];
            }
          }
          let lambda = 1 / weights_sum;

          for (let yt = 0; yt < this.tilesize; yt++) {
            for (let xt = 0; xt < this.tilesize; xt++) {
              if (this.black && amount === this.T) {
                let offset = x * this.tilesize + xt + (y * this.tilesize + yt) * this.FMX * this.tilesize;
                bitmap[offset * 4] = 0;
                bitmap[offset * 4 + 1] = 0;
                bitmap[offset * 4 + 2] = 0;
                bitmap[offset * 4 + 3] = 0xFF;
              } else {
                let r = 0, g = 0, b = 0, aa = 0;
                for (let t = 0; t < this.T; t++) if (a[t]) {
                  let c = this.tiles[t][xt + yt * this.tilesize];
                  r += c.R * this.weights[t] * lambda;
                  g += c.G * this.weights[t] * lambda;
                  b += c.B * this.weights[t] * lambda;
                  aa += c.A * this.weights[t] * lambda;
                }
                let offset = x * this.tilesize + xt + (y * this.tilesize + yt) * this.FMX * this.tilesize;
                bitmap[offset * 4] = r;
                bitmap[offset * 4 + 1] = g;
                bitmap[offset * 4 + 2] = b;
                bitmap[offset * 4 + 3] = aa;
              }
            }
          }
        }
      }
    }

    let canvas = document.createElement("canvas");
    canvas.width = this.FMX;
    canvas.height = this.FMY;
    let ctx = canvas.getContext("2d");
    let img = ctx.createImageData(this.FMX, this.FMY);
    img.data.set(bitmap);
    ctx.putImageData(img, 0, 0);
    document.body.appendChild(canvas);
  }
}

interface ITileSet {
  readonly size?: number;
  readonly unique?: boolean;
  tiles: ITile[];
  neighbors: INeighbor[];
  subsets: ISubset[];
}

interface ITile {
  name: string
  symmetry?: string;
  weight?: number;
}

interface INeighbor {
  left: string[];
  right: string[];
}

interface ISubset {
  name: string
  tiles: ITile[]
}

export class TestOverlappingModel {
  static test() {
    let image: Color[][] = []; // y >> x
    let N: number = 3,
      width: number = 100,
      height: number = 100,
      periodicInput = true,
      periodicOutput = false,
      symmetry: number = 8,
      ground: number = 0;

    let size = 1 + 7 + 5 + 7 + 1;
    let canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    document.body.appendChild(canvas);
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, size, size);


    ctx.fillStyle = "black";
    // room
    ctx.fillRect(1, 1, 7, 7);
    ctx.fillRect(1 + 7 + 5, 1, 7, 7);
    ctx.fillRect(1, 1 + 7 + 5, 7, 7);
    ctx.fillRect(1 + 7 + 5, 1 + 7 + 5, 7, 7);
    // corridor
    ctx.fillRect(1 + 7, 1 + 2, 5, 3);
    ctx.fillRect(1 + 7, 1 + 7 + 5 + 2, 5, 3);
    ctx.fillRect(1 + 2, 1 + 7, 3, 5);
    ctx.fillRect(1 + 7 + 5 + 2, 1 + 7, 3, 5);

    ctx.fillStyle = "red";
    // room
    ctx.fillRect(2, 2, 5, 5);
    ctx.fillRect(1 + 7 + 5 + 1, 2, 5, 5);
    ctx.fillRect(2, 1 + 7 + 5 + 1, 5, 5);
    ctx.fillRect(1 + 7 + 5 + 1, 1 + 7 + 5 + 1, 5, 5);
    // corridor
    ctx.fillRect(1 + 6, 1 + 3, 7, 1);
    ctx.fillRect(1 + 6, 1 + 7 + 5 + 3, 7, 1);
    ctx.fillRect(1 + 3, 1 + 6, 1, 7);
    ctx.fillRect(1 + 7 + 5 + 3, 1 + 6, 1, 7);

    let img = ctx.getImageData(0, 0, size, size);

    for (let y = 0; y < size; y++) {
      let row: Color[] = [];
      image.push(row);
      for (let x = 0; x < size; x++) {
        row.push(Color.fromImage(img, x, y));
      }
    }

    console.log("input image", image);
    let model = new OverlappingModel(image, N, width, height, periodicInput, periodicOutput, symmetry, ground);
    if (!model.run()) {
      console.log("fail");
    } else {
      console.log("success");
      console.log("model", model);
      model.graphics();
    }
  }
}