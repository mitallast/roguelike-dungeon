import {RNG} from "./rng";
import {yields} from "./concurency";

// origin: https://github.com/mxgmn/WaveFunctionCollapse/

function array<T>(size: number, value: T = null): T[] {
  const a: T[] = [];
  for (let i = 0; i < size; i++) {
    a.push(value);
  }
  return a;
}

export class Color {
  readonly R: number;
  readonly G: number;
  readonly B: number;
  readonly A: number;

  static fromRgb(rgb: number): Color {
    const r = (rgb >> 16) & 0xFF;
    const g = (rgb >> 8) & 0xFF;
    const b = rgb & 0xFF;
    return new Color(r, g, b);
  }

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

  constructor(R: number, G: number, B: number, A: number = 255) {
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

  get rgb(): number {
    return 0xFFFFFF & (
      ((this.R & 0xFF) << 16) |
      ((this.G & 0xFF) << 8) |
      (this.B & 0xFF)
    );
  }
}

export class Tile<T> {
  readonly value: T;
  readonly color: Color;
  private readonly equal: (a: T, b: T) => boolean;

  constructor(value: T, color: Color, equal: (a: T, b: T) => boolean = (a, b) => a === b) {
    this.value = value;
    this.color = color;
    this.equal = equal;
  }

  equals(that: Tile<T>): boolean {
    return that.equal(this.value, that.value);
  }
}

// Indicates whether something has been fully resolved or not.
// This is the return code for many functions, but can also
// describe the state of individual locations in a generated output.
export enum Resolution {
  // The operation has successfully completed and a value is known.
  Decided = 0,
  // The operation has not yet found a value
  Undecided = -1,
  // It was not possible to find a successful value.
  Contradiction = -2,
}

export abstract class Model {
  wave: boolean[][] = null; // wave => pattern map

  propagator: number[][][]; // direction => pattern1 => pattern2[]
  compatible: number[][][];
  observed: number[];

  toPropagate: [number, number][];

  backtrackItems: [number, number][]; // wave, pattern
  private backtrackItemsLengths: number[];
  private prevChoices: [number, number][];
  private droppedBacktrackItemsCount: number;
  private backtrackCount: number; // Purely informational

  random: RNG;
  FMX: number;
  FMY: number;
  T: number;
  periodic: boolean;

  weights: number[];
  weightLogWeights: number[];

  sumsOfOnes: number[]; // by wave index
  sumOfWeights: number;
  sumOfWeightLogWeights: number;
  startingEntropy: number;

  sumsOfWeights: number[];
  sumsOfWeightLogWeights: number[];
  entropies: number[];

  // The overall status of the propagator, always kept up to date
  status: Resolution;
  protected deferredConstraintsStep: boolean;

  protected constructor(width: number, height: number) {
    this.FMX = width;
    this.FMY = height;
  }

  get percent(): number {
    let count = 0;
    for (let i = 0; i < this.wave.length; i++) {
      if (this.sumsOfOnes[i] === 1) {
        count++;
      }
    }

    return count * 100.0 / this.wave.length;
  }

  init(): void {
    this.wave = array(this.FMX * this.FMY);
    this.compatible = array(this.wave.length);
    for (let i = 0; i < this.wave.length; i++) {
      this.wave[i] = array(this.T, true);
      this.compatible[i] = array(this.T);
      for (let t = 0; t < this.T; t++) {
        this.compatible[i][t] = array(4, 0);
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

    this.status = Resolution.Undecided;

    this.initConstraint();
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

    this.toPropagate = [];

    this.backtrackItems = [];
    this.backtrackItemsLengths = [0];
    this.droppedBacktrackItemsCount = 0;
    this.backtrackCount = 0;
    this.prevChoices = [];

    this.status = Resolution.Undecided;
  }

  debug: boolean = false;

  async run(seed: number = null, limit: number = 0): Promise<Resolution> {
    if (this.wave === null) this.init();
    this.clear();
    this.random = new RNG(seed);
    this.debug = false;
    for (let i = 0; i < limit || limit === 0; i++) {
      if (i % 50 === 0) {
        await yields();
      }

      // this.debug = this.debug || i >= 57;
      if (this.debug) {
        console.log("step", i);
      }
      this.step();
      // if (this.debug || i % 100 === 0) {
      //   console.log("after step", i);
      //   this.graphics([]);
      // }
      if (this.status !== Resolution.Undecided) {
        break;
      }
    }
    return this.status;
  }

  step(): Resolution {
    let index: number;
    let pattern: number;
    let restart: boolean = false;

    // This will true if the user has called Ban, etc, since the last step.
    if (this.deferredConstraintsStep) {
      if (this.debug) console.log("step constraint");
      this.stepConstraint();
    }

    // If we're already in a final state. skip making an observation,
    // and jump to backtrack handling / return.
    if (this.status != Resolution.Undecided) {
      index = 0;
      restart = true;
      if (this.debug) console.log("restart = true");
    }

    if (!restart) {
      // Record state before making a choice
      console.assert(this.toPropagate.length == 0);
      this.backtrackItemsLengths.push(this.droppedBacktrackItemsCount + this.backtrackItems.length);

      // Pick a tile and Select a pattern from it.
      [index, pattern] = this.observe();
      if (this.debug) console.log("observed", index, pattern);

      // Record what was selected for backtracking purposes
      if (index !== -1) {
        if (this.debug) console.log("push to prev choices");
        this.prevChoices.push([index, pattern]);
      }
    }

    do {
      if (this.debug) console.log("do loop");

      restart = false;

      if (this.debug) console.log("status", this.status);

      if (this.status === Resolution.Undecided) this.propagate();
      if (this.status === Resolution.Undecided) this.stepConstraint();

      // Are all things are fully chosen?
      if (index === -1 && this.status === Resolution.Undecided) {
        if (this.debug) console.log("decided");
        this.status = Resolution.Decided;
        return this.status;
      }

      if (this.status === Resolution.Contradiction) {
        if (this.debug) console.log("contradiction");

        // After back tracking, it's no longer the case things are fully chosen
        index = 0;

        // Actually backtrack
        while (true) {
          if (this.debug) console.log("while backtrack");

          if (this.backtrackItemsLengths.length == 1) {
            if (this.debug) console.log("We've backtracked as much as we can, but, it's still not possible. That means it is impossible");
            // We've backtracked as much as we can, but
            // it's still not possible. That means it is impossible
            return Resolution.Contradiction;
          }
          this.backtrack();
          let item = this.prevChoices.pop();
          this.backtrackCount++;
          this.toPropagate = [];
          this.status = Resolution.Undecided;
          // Mark the given choice as impossible
          if (this.debug) {
            console.log("Mark the given choice as impossible", item[0], item[1]);
            this.graphics([item[0]]);
          }

          if (this.internalBan(item[0], item[1])) {
            this.status = Resolution.Contradiction;
          }
          if (this.status === Resolution.Undecided) this.propagate();

          if (this.status === Resolution.Contradiction) {
            if (this.debug) console.log("If still in contradiction, repeat backtracking");
            // If still in contradiction, repeat backtracking
            continue;
          } else {
            if (this.debug) console.log("// Include the last ban as part of the previous backtrack");
            // Include the last ban as part of the previous backtrack
            console.assert(this.toPropagate.length === 0);
            this.backtrackItemsLengths.pop();
            this.backtrackItemsLengths.push(this.droppedBacktrackItemsCount + this.backtrackItems.length);
          }
          if (this.debug) console.log("restart = true and break");
          restart = true;
          break;
        }
      }
    } while (restart);
    return this.status;
  }

  protected observe(): [number, number] {
    if (this.debug) console.log("observe");
    let min = 1E+3;
    let argmin = -1;

    for (let i = 0; i < this.wave.length; i++) {
      if (this.onBoundary(i % this.FMX, Math.floor(i / this.FMX))) continue;

      let amount = this.sumsOfOnes[i];
      if (amount == 0) {
        if (this.debug) console.error(`[wave=${i}] found zero sum of ones`);
        if (this.debug) this.graphics([i]);
        this.status = Resolution.Contradiction;
        return [-1, -1]
      }

      let entropy = this.entropies[i];
      if (amount > 1 && entropy <= min) {
        let noise = 1E-6 * this.random.nextFloat();
        if (entropy + noise < min) {
          min = entropy + noise;
          argmin = i;
        }
      }
    }

    if (argmin == -1) {
      if (this.debug) console.log("complete observed");
      this.observed = array(this.FMX * this.FMY);
      for (let i = 0; i < this.wave.length; i++) {
        let x = i % this.FMX, y = Math.floor(i / this.FMX);
        if (this.onBoundary(x, y)) {
          continue;
        }

        this.testObserved(i);

        for (let t = 0; t < this.T; t++) {
          if (this.wave[i][t]) {
            this.observed[i] = t;
            break;
          }
        }
      }
      return [-1, -1]
    }

    let distribution_sum: number = 0;
    let distribution: number[] = array(this.T);
    for (let t = 0; t < this.T; t++) {
      distribution[t] = this.wave[argmin][t] ? this.weights[t] : 0;
      distribution_sum += distribution[t];
    }

    let rnd = this.random.nextFloat() * distribution_sum;
    let r = 0;
    for (let weight of distribution) {
      rnd -= weight;
      if (rnd < 0) break;
      r++;
    }

    let w = this.wave[argmin];
    for (let t = 0; t < this.T; t++) {
      if (w[t] != (t == r)) {
        if (this.debug) console.log("observe select");
        if (this.internalBan(argmin, t)) {
          this.status = Resolution.Contradiction;
        }
      }
    }

    return [argmin, r];
  }

  protected abstract testObserved(index: number): void;

  protected propagate(): void {
    if (this.toPropagate.length === 0) return;

    if (this.debug) console.log("propagate", this.toPropagate.length);
    const markup: number[] = [];
    while (this.toPropagate.length > 0) {
      let [i, t] = this.toPropagate.pop();

      markup.push(i);

      let x = i % this.FMX, y = Math.floor(i / this.FMX);
      for (let direction = 0; direction < 4; direction++) {
        let dx = Model.DX[direction], dy = Model.DY[direction];
        let sx = x + dx, sy = y + dy;
        if (this.onBoundary(sx, sy)) {
          continue;
        }

        if (sx < 0) sx += this.FMX;
        else if (sx >= this.FMX) sx -= this.FMX;
        if (sy < 0) sy += this.FMY;
        else if (sy >= this.FMY) sy -= this.FMY;

        let s = sx + sy * this.FMX;

        markup.push(s);

        let pattern1 = this.propagator[direction][t]; // item2
        let compat = this.compatible[s];

        for (let st of pattern1) {
          let comp = compat[st];
          comp[direction]--;
          if (comp[direction] == 0) {
            if (this.internalBan(s, st)) {
              this.status = Resolution.Contradiction;
            }
          }
        }
      }

      if (this.status == Resolution.Contradiction) {
        break;
      }
    }

    if (this.debug) {
      console.log("propagated");
      this.graphics(markup);
    }
  }

  ban(index: number, pattern: number): Resolution {
    if (this.debug) console.log("ban", index, pattern);
    if (this.wave[index][pattern]) {
      this.deferredConstraintsStep = true;
      if (this.internalBan(index, pattern)) {
        return this.status = Resolution.Contradiction;
      }
    }
    this.propagate();
    return this.status;
  }

  internalBan(index: number, pattern: number): boolean {
    this.wave[index][pattern] = false;

    let comp = this.compatible[index][pattern];
    for (let d = 0; d < 4; d++) {
      comp[d] -= this.T;
    }
    this.toPropagate.push([index, pattern]);

    this.sumsOfOnes[index] -= 1;
    this.sumsOfWeights[index] -= this.weights[pattern];
    this.sumsOfWeightLogWeights[index] -= this.weightLogWeights[pattern];

    let sum = this.sumsOfWeights[index];
    this.entropies[index] = Math.log(sum) - this.sumsOfWeightLogWeights[index] / sum;

    this.backtrackItems.push([index, pattern]);
    this.banConstraint(index, pattern);

    if (this.sumsOfOnes[index] === 0) {
      if (this.debug) console.error("sum is zero", index);
      if (this.debug) this.graphics([index]);
      return true; // result is contradiction
    } else {
      return false; // result is not contradiction
    }
  }

  protected backtrack(): void {
    const targetLength = this.backtrackItemsLengths.pop() - this.droppedBacktrackItemsCount;
    if (this.debug) console.warn("backtrack", targetLength);

    const markup: number[] = [];

    const toPropagateSet = new Set<string>(this.toPropagate.map((i) => i.join(",")));
    while (this.backtrackItems.length > targetLength) {
      let [index, patternIndex] = this.backtrackItems.pop();

      markup.push(index);

      // First restore compatible for this cell
      // As it is set to zero in InternalBan
      let comp = this.compatible[index][patternIndex];
      for (let d = 0; d < 4; d++) {
        comp[d] += this.T;
      }

      // Also add the possibility back
      // as it is removed in InternalBan
      this.wave[index][patternIndex] = true;
      this.sumsOfOnes[index] += 1;
      this.sumsOfWeights[index] += this.weights[patternIndex];
      this.sumsOfWeightLogWeights[index] += this.weightLogWeights[patternIndex];

      let sum = this.sumsOfWeights[index];
      this.entropies[index] = Math.log(sum) - this.sumsOfWeightLogWeights[index] / sum;

      // Next, undo the decrements done in propagate

      // We skip this if the item is still in toPropagate, as that means Propagate hasn't run
      if (!toPropagateSet.has([index, patternIndex].join(","))) {
        let x = index % this.FMX, y = Math.floor(index / this.FMX);
        for (let direction = 0; direction < 4; direction++) {
          let dx = Model.DX[direction], dy = Model.DY[direction];
          let sx = x + dx, sy = y + dy;
          if (this.onBoundary(sx, sy)) {
            continue;
          }

          if (sx < 0) sx += this.FMX;
          else if (sx >= this.FMX) sx -= this.FMX;
          if (sy < 0) sy += this.FMY;
          else if (sy >= this.FMY) sy -= this.FMY;

          let s = sx + sy * this.FMX;

          markup.push(s);

          const pattern = this.propagator[direction][patternIndex];
          for (let st of pattern) {
            this.compatible[s][st][direction]++;
          }
        }
      }
      this.backtrackConstraint(index, patternIndex);
    }

    if (this.debug) {
      console.log("backtracked");
      this.graphics(markup);
    }
  }

  abstract initConstraint(): void;

  abstract stepConstraint(): void;

  abstract banConstraint(index: number, pattern: number): void;

  abstract backtrackConstraint(index: number, pattern: number): void;

  abstract onBoundary(x: number, y: number): boolean;

  abstract graphics(markup: number[]): void;

  static DX: number[] = [-1, 0, 1, 0];
  static DY: number[] = [0, 1, 0, -1];
  static opposite: number[] = [2, 3, 0, 1];
}

export class OverlappingModel<T> extends Model {
  N: number;
  patterns: number[][]; // array of patterns
  tiles: Tile<T>[];
  ground: number;
  private readonly constraints: Constraint<T>[];

  constructor(
    input: Tile<T>[][], // y >> x
    N: number,
    width: number,
    height: number,
    periodicInput: boolean,
    periodicOutput: boolean,
    symmetry: number,
    ground: number,
    constraints: Constraint<T>[]
  ) {
    super(width, height);

    this.N = N;
    this.periodic = periodicOutput;
    this.constraints = constraints;
    let SMY = input.length;
    let SMX = input[0].length;
    this.tiles = [];
    let sample: number[][] = array(SMY);

    for (let y = 0; y < SMY; y++) {
      sample[y] = array(SMX);
      for (let x = 0; x < SMX; x++) {
        let tile = input[y][x];
        let i = 0;
        for (let t of this.tiles) {
          if (t.equals(tile)) {
            break;
          }
          i++;
        }
        if (i == this.tiles.length) {
          this.tiles.push(tile);
        }
        sample[y][x] = i;
      }
    }

    const C = this.tiles.length;
    const W = Math.pow(C, N * N);

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

    function patternFromIndex(ind: number): number[] {
      let residue = ind, power = W;
      let result: number[] = [];
      for (let i = 0; i < N * N; i++) {
        power /= C;
        let count = 0;
        while (residue >= power) {
          residue -= power;
          count++;
        }
        result.push(count);
      }
      return result;
    }

    let weights = new Map<number, number>(); // pattern index => weight

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

    this.T = weights.size; // patterns count
    this.ground = (ground + this.T) % this.T;
    this.patterns = [];
    this.weights = [];

    for (const [index, weight] of weights) {
      this.patterns.push(patternFromIndex(index));
      this.weights.push(weight);
    }

    // console.log("weights", this.weights);
    // console.log("patterns", this.patterns);

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
    for (let direction = 0; direction < 4; direction++) {
      this.propagator[direction] = array(this.T);
      for (let pattern1 = 0; pattern1 < this.T; pattern1++) {
        this.propagator[direction][pattern1] = [];
        for (let pattern2 = 0; pattern2 < this.T; pattern2++) {
          if (agrees(this.patterns[pattern1], this.patterns[pattern2], Model.DX[direction], Model.DY[direction])) {
            this.propagator[direction][pattern1].push(pattern2);
          }
        }
      }
    }
  }

  protected testObserved(i: number): void {
    let x = i % this.FMX, y = Math.floor(i / this.FMX);

    // test 1
    if (!this.onBoundary(x, y)) {
      const patterns = this.wave[i].filter(v => v).length;
      console.assert(patterns === 1, `wave ${i} pattern count ${patterns}`);
    }

    // test 2
    let contributors = 0;
    let tileSet = new Set<number>();
    for (let dy = 0; dy < this.N; dy++) {
      for (let dx = 0; dx < this.N; dx++) {
        let sx = x - dx, sy = y - dy;
        if (this.onBoundary(sx, sy)) {
          continue;
        }

        if (sx < 0) sx += this.FMX;
        else if (sx >= this.FMX) sx -= this.FMX;
        if (sy < 0) sy += this.FMY;
        else if (sy >= this.FMY) sy -= this.FMY;

        let s = sx + sy * this.FMX;

        for (let t = 0; t < this.T; t++) {
          if (this.wave[s][t]) {
            contributors++;
            const tileId = this.patterns[t][dx + dy * this.N];
            tileSet.add(tileId);
          }
        }
      }
    }
    console.assert(tileSet.size === 1,
      "wave", i,
      "contributors", contributors,
      "tiles", tileSet.size,
      "sumsOfOnes", this.sumsOfOnes[i],
      "sumsOfWeights", this.sumsOfWeights[i],
      "sumsOfWeightLogWeights", this.sumsOfWeightLogWeights[i],
      "entropies", this.entropies[i],
    );
  }

  initConstraint(): void {
    for (let constraint of this.constraints) {
      constraint.init(this);
      if (this.status != Resolution.Undecided) {
        // console.warn("failed init constraint", this.status);
        return;
      }
    }
  }

  stepConstraint(): void {
    for (let constraint of this.constraints) {
      constraint.check();
      if (this.status != Resolution.Undecided) {
        if (this.debug) console.warn("failed step constraint check");
        return;
      }
      this.propagate();
      if (this.status != Resolution.Undecided) {
        if (this.debug) console.warn("failed step constraint propagate");
        return;
      }
    }
    this.deferredConstraintsStep = false;
  }

  backtrackConstraint(index: number, pattern: number): void {
    for (let constraint of this.constraints) {
      constraint.onBacktrack(index, pattern);
    }
  }

  banConstraint(index: number, pattern: number): void {
    for (let constraint of this.constraints) {
      constraint.onBan(index, pattern);
    }
  }

  onBoundary(x: number, y: number): boolean {
    return !this.periodic && (x + this.N > this.FMX || y + this.N > this.FMY || x < 0 || y < 0);
  }

  protected clear(): void {
    super.clear();
    if (this.ground != 0) {
      for (let x = 0; x < this.FMX; x++) {
        for (let t = 0; t < this.T; t++) {
          if (t != this.ground) {
            if (this.internalBan(x + (this.FMY - 1) * this.FMX, t)) {
              this.status = Resolution.Contradiction;
              return;
            }
          }
        }
        for (let y = 0; y < this.FMY - 1; y++) {
          if (this.internalBan(x + y * this.FMX, this.ground)) {
            this.status = Resolution.Contradiction;
            return;
          }
        }
      }
      this.propagate();
    }
    for (let constraint of this.constraints) {
      constraint.onClear();
      this.propagate();
    }
  }

  graphics(markup: number[]): void {
    const bitmap = new Uint8Array(4 * this.FMX * this.FMY);
    if (this.observed != null) {
      for (let y = 0; y < this.FMY; y++) {
        let dy = y < this.FMY - this.N + 1 ? 0 : this.N - 1;

        for (let x = 0; x < this.FMX; x++) {
          let dx = x < this.FMX - this.N + 1 ? 0 : this.N - 1;

          const index = x - dx + (y - dy) * this.FMX;
          const patternIndex = this.observed[index];
          const pattern = this.patterns[patternIndex];
          const tileIndex = pattern[dx + dy * this.N];
          const tile = this.tiles[tileIndex];
          let c = tile.color;
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
        let x = i % this.FMX, y = Math.floor(i / this.FMX);

        for (let dy = 0; dy < this.N; dy++) {
          for (let dx = 0; dx < this.N; dx++) {
            let sx = x - dx, sy = y - dy;
            if (this.onBoundary(sx, sy)) {
              continue;
            }

            if (sx < 0) sx += this.FMX;
            else if (sx >= this.FMX) sx -= this.FMX;
            if (sy < 0) sy += this.FMY;
            else if (sy >= this.FMY) sy -= this.FMY;

            let s = sx + sy * this.FMX;

            for (let t = 0; t < this.T; t++) {
              if (this.wave[s][t]) {
                contributors++;
                let color = this.tiles[this.patterns[t][dx + dy * this.N]].color;
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

    const scale = 10;
    const canvas = document.createElement("canvas");
    canvas.width = this.FMX * scale;
    canvas.height = this.FMY * scale;
    canvas.style.margin = "10px";
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const img = ctx.createImageData(this.FMX, this.FMY);
    img.data.set(bitmap);
    ctx.strokeStyle = "grey";
    for (let i = 0, j = 0; j < bitmap.length; i++, j += 4) {
      ctx.fillStyle = `rgb(${bitmap[j]},${bitmap[j + 1]},${bitmap[j + 2]})`;
      let x = i % this.FMX, y = Math.floor(i / this.FMX);
      ctx.fillRect(x * scale, y * scale, scale, scale);
      ctx.strokeRect(x * scale, y * scale, scale, scale);
    }

    ctx.strokeStyle = "red";
    for (let i of markup) {
      let x = i % this.FMX, y = Math.floor(i / this.FMX);
      ctx.strokeRect(x * scale, y * scale, scale, scale);
    }
    console.log('%c ', `
      font-size: 1px;
      padding: ${canvas.height / 2}px ${canvas.width / 2}px;
      background: no-repeat url(${canvas.toDataURL('image/png')});
      background-size: ${canvas.width}px ${canvas.height}px;
    `);
  }
}

// origin https://github.com/BorisTheBrave/DeBroglie/

export interface Constraint<T> {
  init(model: OverlappingModel<T>): void;
  onClear(): void;
  onBan(index: number, pattern: number): void
  onBacktrack(index: number, pattern: number): void
  check(): void;
}

export class PathConstraint<T> implements Constraint<T> {
  private readonly pathTiles: Tile<T>[];
  private isPathTile: boolean[];

  private model: OverlappingModel<T>;
  private graph: SimpleGraph;
  private couldBePath: boolean[];
  private mustBePath: boolean[];

  private refresh: boolean[];
  private refreshQueue: number[];

  constructor(pathTiles: Tile<T>[]) {
    this.pathTiles = pathTiles;
  }

  init(model: OverlappingModel<T>): void {
    this.model = model;
    const indices = model.FMX * model.FMY;
    this.isPathTile = array(indices, false);
    for (const pathTile of this.pathTiles) {
      const index = model.tiles.findIndex(m => m.equals(pathTile));
      this.isPathTile[index] = true;
    }

    this.couldBePath = array(indices, false);
    this.mustBePath = array(indices, false);
    this.refresh = array(indices, true);
    this.refreshQueue = [];
  }

  onClear(): void {
    let indices = this.model.FMX * this.model.FMY;
    this.couldBePath = array(indices, false);
    this.mustBePath = array(indices, false);
    this.refresh = array(indices, true);
    this.refreshQueue = [];
    for (let i = 0; i < indices; i++) {
      this.refreshQueue.push(i);
    }
    this.refreshAll();

    this.graph = this.createGraph();
  }

  onBan(index: number, patternIndex: number): void {
    this.addRefresh(index);
  }

  onBacktrack(index: number, patternIndex: number): void {
    this.addRefresh(index);
  }

  private addRefresh(index: number): void {
    if (!this.refresh[index]) {

      const FMX = this.model.FMX;
      const FMY = this.model.FMY;
      let x = index % FMX, y = Math.floor(index / FMX);

      this.refresh[index] = true;
      this.refreshQueue.push(index);

      for (let direction = 0; direction < 4; direction++) {
        let dx = Model.DX[direction], dy = Model.DY[direction];
        let sx = x + dx, sy = y + dy;
        if (this.model.onBoundary(sx, sy)) {
          continue;
        }

        if (sx < 0) sx += FMX;
        else if (sx >= FMX) sx -= FMX;
        if (sy < 0) sy += FMY;
        else if (sy >= FMY) sy -= FMY;

        let s = sx + sy * FMX;

        if (!this.refresh[s]) {
          this.refresh[s] = true;
          this.refreshQueue.push(s);
        }
      }
    }
  }

  private refreshAll(): void {
    const model = this.model;
    const FMX = model.FMX;
    const FMY = model.FMY;
    const N = model.N;
    const T = model.T;

    while (this.refreshQueue.length > 0) {
      const i = this.refreshQueue.pop();
      this.refresh[i] = false;

      const x = i % FMX, y = Math.floor(i / FMX);

      let pathCount = 0;
      let totalCount = 0;

      for (let dy = 0; dy < N; dy++) {
        for (let dx = 0; dx < N; dx++) {
          let sx = x - dx, sy = y - dy;
          if (model.onBoundary(sx, sy)) {
            continue;
          }

          if (sx < 0) sx += FMX;
          else if (sx >= FMX) sx -= FMX;
          if (sy < 0) sy += FMY;
          else if (sy >= FMY) sy -= FMY;

          let s = sx + sy * FMX;

          for (let t = 0; t < T; t++) {
            if (model.wave[s][t]) {
              totalCount++;
              const index = model.patterns[t][dx + dy * N];
              if (this.isPathTile[index]) {
                pathCount++;
              }
            }
          }
        }
      }

      this.couldBePath[i] = pathCount > 0;
      this.mustBePath[i] = pathCount > 0 && totalCount === pathCount;
    }
  }

  check(): void {
    while (true) {
      this.refreshAll();

      let isArticulation = this.getArticulationPoints();
      if (isArticulation == null) {
        if (this.model.debug) console.error("no articulation");
        this.model.status = Resolution.Contradiction;
        return;
      }

      if (this.applyArticulationPoints(isArticulation)) {
        if (this.model.debug) {
          console.log("articulation");
          let markup: number[] = isArticulation
            .map<[boolean, number]>((v, i) => [v, i])
            .filter(a => a[0])
            .map(a => a[1]);
          this.model.graphics(markup);
          console.log("continue articulation loop");
        }
      } else {
        break;
      }
    }
  }

  private applyArticulationPoints(isArticulation: boolean[]): boolean {
    const FMX = this.model.FMX;
    const FMY = this.model.FMY;
    let indices = FMX * FMY;
    // All articulation points must be paths,
    // So ban any other possibilities
    let changed = false;
    for (let i = 0; i < indices; i++) {
      if (isArticulation[i] && !this.mustBePath[i]) {
        if (this.model.debug) console.log("articulation", i);
        let x = i % this.model.FMX, y = Math.floor(i / this.model.FMX);
        if (this.model.debug) console.log("x, y, i", x, y, i);
        for (let dy = 0; dy < this.model.N; dy++) {
          for (let dx = 0; dx < this.model.N; dx++) {
            let sx = x - dx;
            if (sx < 0) sx += this.model.FMX;

            let sy = y - dy;
            if (sy < 0) sy += this.model.FMY;

            let s = sx + sy * this.model.FMX;
            if (this.model.onBoundary(sx, sy)) {
              continue;
            }
            for (let t = 0; t < this.model.T; t++) {
              if (this.model.wave[s][t]) {
                let index = this.model.patterns[t][dx + dy * this.model.N];
                if (this.isPathTile[index]) {
                  if (this.model.debug) console.log("ban not path", index, t, this.model.patterns[t]);
                  this.model.ban(s, t);
                  changed = true;
                }
              }
            }
          }
        }
      }
    }
    return changed;
  }

  private getArticulationPoints(): boolean[] {
    const walkable = this.couldBePath;
    const relevant = this.mustBePath;

    const graph = this.graph;
    const indices = walkable.length;

    const low: number[] = array(indices, 0);
    let num = 1;
    const dfsNum: number[] = array(indices, 0);
    const markup: number[] = [];
    const isArticulation: boolean[] = array(indices, false);

    // This hideous function is a iterative version
    // of the much more elegant recursive version below.
    // Unfortunately, the recursive version tends to blow the stack for large graphs
    function cutVertex(initialU: number): number {
      const stack: CutVertexFrame[] = [];
      stack.push(new CutVertexFrame(initialU));

      // This is the "returned" value from recursion
      let childRelevantSubtree: boolean = false;
      let childCount = 0;

      while (true) {
        const frameIndex = stack.length - 1;
        const frame = stack[frameIndex];
        const u = frame.u;

        let switchState = frame.state;
        let loop: boolean;
        do {
          loop = false;
          // console.log("switchState", switchState);
          switch (switchState) {
            // Initialization
            case 0: {
              // console.log("switch 0");
              let isRelevant = relevant != null && relevant[u];
              if (isRelevant) {
                isArticulation[u] = true;
              }
              frame.isRelevantSubtree = isRelevant;
              low[u] = dfsNum[u] = num++;
              markup.push(u);
              // Enter loop
              switchState = 1;
              loop = true;
              break;
            }
            // Loop over neighbours
            case 1: {
              // console.log("switch 1");
              // Check loop condition
              let neighbours = graph.neighbours[u];
              let neighbourIndex = frame.neighbourIndex;
              if (neighbourIndex >= neighbours.length) {
                // Exit loop
                switchState = 3;
                loop = true;
                break;
              }
              let v = neighbours[neighbourIndex];
              if (!walkable[v]) {
                // continue to next iteration of loop
                frame.neighbourIndex = neighbourIndex + 1;
                switchState = 1;
                loop = true;
                break;
              }

              // v is a neighbour of u
              let unvisited = dfsNum[v] === 0;
              if (unvisited) {
                // Recurse into v
                stack.push(new CutVertexFrame(v));
                frame.state = 2;
                switchState = 2;
                stack[frameIndex] = frame;
                break;
              } else {
                low[u] = Math.min(low[u], dfsNum[v]);
              }

              // continue to next iteration of loop
              frame.neighbourIndex = neighbourIndex + 1;
              switchState = 1;
              loop = true;
              break;
            }
            // Return from recursion (still in loop)
            case 2: {
              // console.log("switch 2");
              // At this point, childRelevantSubtree
              // has been set to the by the recursion call we've just returned from
              let neighbours = graph.neighbours[u];
              let neighbourIndex = frame.neighbourIndex;
              let v = neighbours[neighbourIndex];

              if (frameIndex == 0) {
                // Root frame
                childCount++;
              }

              if (childRelevantSubtree) {
                frame.isRelevantSubtree = true;
              }
              if (low[v] >= dfsNum[u]) {
                if (relevant == null || childRelevantSubtree) {
                  isArticulation[u] = true;
                }
              }
              low[u] = Math.min(low[u], low[v]);

              // continue to next iteration of loop
              frame.neighbourIndex = neighbourIndex + 1;
              switchState = 1;
              loop = true;
              break;
            }
            // Cleanup
            case 3: {
              // console.log("switch 3");
              if (frameIndex == 0) {
                // Root frame
                return childCount;
              } else {
                // Set childRelevantSubtree with the return value from this recursion call
                childRelevantSubtree = frame.isRelevantSubtree;
                // Pop the frame
                stack.splice(frameIndex, 1);
                // Resume the caller (which will be in state 2)
                break;
              }
            }
          }
        } while (loop);
      }
    }

    // Check we've visited every relevant point.
    // If not, there's no way to satisfy the constraint.
    // UPD relevant always not null
    // Find starting point
    for (let i = 0; i < indices; i++) {
      if (!walkable[i]) continue;
      if (!relevant[i]) continue;
      // Already visited
      if (dfsNum[i] != 0) continue;

      cutVertex(i);
      // Relevant points are always articulation points
      // UPD: relevant == must be path, already articulated
      // isArticulation[i] = true;
      break;
    }

    // Check connectivity
    for (let i = 0; i < indices; i++) {
      if (relevant[i] && dfsNum[i] == 0) {
        if (this.model.debug) {
          console.warn("walkable:");
          let markupW: number[] = walkable
            .map<[boolean, number]>((v, i) => [v, i])
            .filter(a => a[0])
            .map(a => a[1]);
          this.model.graphics(markupW);
          console.warn("visited");
          this.model.graphics(markup);

          const w = this.model.FMX;
          let x = i % w, y = Math.floor(i / w);
          console.error(`not visited relevant point i=${i} x=${x} y=${y}`);
          console.warn('graph neighbours', graph.neighbours[i]);
          this.model.graphics([i]);
        }
        return null;
      }
    }

    // compute articulation points
    for (let i = 0; i < indices; i++) {
      if (!walkable[i]) continue;
      if (relevant[i]) continue; // graph is already connected with all relevant points
      if (dfsNum[i] != 0) continue; // Already visited
      if (isArticulation[i]) continue; // if point is already articulation point, it visited

      // console.warn("compute articulation point for ", i);

      let childCount = cutVertex(i);
      // The root of the tree is an exception to CutVertex's calculations
      // It's an articulation point if it has multiple children
      // as removing it would give multiple subtrees.
      isArticulation[i] = childCount > 1;
    }

    return isArticulation;
  }

  private createGraph(): SimpleGraph {
    let nodeCount = this.model.FMX * this.model.FMY;
    let neighbours: number[][] = [];
    for (let i = 0; i < nodeCount; i++) {
      neighbours[i] = [];

      let x = i % this.model.FMX, y = Math.floor(i / this.model.FMX);

      for (let direction = 0; direction < 4; direction++) {
        let dx = Model.DX[direction], dy = Model.DY[direction];
        let sx = x + dx, sy = y + dy;
        if (!this.model.periodic && (sx >= this.model.FMX || sy >= this.model.FMY || sx < 0 || sy < 0)) {
          continue;
        }

        if (sx < 0) sx += this.model.FMX;
        else if (sx >= this.model.FMX) sx -= this.model.FMX;
        if (sy < 0) sy += this.model.FMY;
        else if (sy >= this.model.FMY) sy -= this.model.FMY;

        let s = sx + sy * this.model.FMX;

        neighbours[i].push(s);
      }
    }

    return {
      nodeCount: nodeCount,
      neighbours: neighbours,
    };
  }
}

export class BorderConstraint<T> implements Constraint<T> {
  private readonly borderTile: Tile<T>;
  private model: OverlappingModel<T>;

  constructor(borderTile: Tile<T>) {
    this.borderTile = borderTile;
  }

  init(model: OverlappingModel<T>): void {
    this.model = model;
  }

  onClear(): void {
    const model = this.model;
    const indices = model.FMX * model.FMY;
    const borderTileIndex = model.tiles.findIndex(c => this.borderTile.equals(c));

    for (let i = 0; i < indices; i++) {
      let x = i % model.FMX, y = Math.floor(i / model.FMX);
      if (x === 0 || x === model.FMX - 1 || y === 0 || y === model.FMY - 1) {
        for (let dy = 0; dy < model.N; dy++) {
          for (let dx = 0; dx < model.N; dx++) {
            let sx = x - dx;
            if (sx < 0) sx += model.FMX;

            let sy = y - dy;
            if (sy < 0) sy += model.FMY;

            let s = sx + sy * model.FMX;
            if (model.onBoundary(sx, sy)) {
              continue;
            }
            for (let t = 0; t < model.T; t++) {
              if (model.wave[s][t]) {
                let colorIndex = model.patterns[t][dx + dy * model.N];
                if (colorIndex !== borderTileIndex) {
                  model.ban(s, t);
                }
              }
            }
          }
        }
      }
    }
  }

  onBan(index: number, pattern: number): void {
  }

  onBacktrack(index: number, pattern: number): void {
  }

  check(): boolean {
    return true;
  }
}

class CutVertexFrame {
  u: number;
  state: number = 0;
  neighbourIndex: number = 0;
  isRelevantSubtree: boolean = false;

  constructor(u: number) {
    this.u = u;
  }
}

interface SimpleGraph {
  readonly nodeCount: number;
  readonly neighbours: number[][];
}

export class TestOverlappingModel {
  static async test() {
    await this.test1();
  }

  static async test1() {
    let N: number = 3,
      width: number = 10,
      height: number = 10,
      periodicInput = false,
      periodicOutput = false,
      symmetry: number = 8,
      ground: number = 0;

    const w_c = new Color(255, 255, 255, 255);
    const r_c = new Color(255, 0, 0, 255);
    const b_c = new Color(0, 0, 0, 255);

    const w = new Tile(w_c, w_c, (a, b) => a.equals(b));
    const r = new Tile(r_c, r_c, (a, b) => a.equals(b));
    const b = new Tile(b_c, b_c, (a, b) => a.equals(b));

    const sample: Tile<Color>[][] = [
      [w, w, r, w, w],
      [w, w, r, w, w],
      [r, r, r, r, r],
      [w, w, r, w, w],
      [w, w, r, w, w],
    ];

    let model = new OverlappingModel(sample, N, width, height, periodicInput, periodicOutput, symmetry, ground, []);
    if (await model.run() !== Resolution.Decided) {
      console.log("fail");
    } else {
      console.log("success");
    }
    console.log("model", model);
    model.graphics([]);
  }

  static async test2() {
    let N: number = 3,
      width: number = 30,
      height: number = 30,
      periodicInput = false,
      periodicOutput = false,
      symmetry: number = 1,
      ground: number = 0;

    const w_c = new Color(255, 255, 255, 255);
    const r_c = new Color(255, 0, 0, 255);
    const b_c = new Color(0, 0, 0, 255);

    const w = new Tile(w_c, w_c, (a, b) => a.equals(b));
    const r = new Tile(r_c, r_c, (a, b) => a.equals(b));
    const b = new Tile(b_c, b_c, (a, b) => a.equals(b));

    const sample: Tile<Color>[][] = [
      [w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w],
      [w, b, b, b, b, b, b, b, w, w, w, w, w, w, w, w, w, b, b, b, b, b, b, b, w],
      [w, b, r, r, r, r, r, b, w, w, w, w, w, w, w, w, w, b, r, r, r, r, r, b, w],
      [w, b, r, r, r, r, r, b, b, b, b, b, b, b, b, b, b, b, r, r, r, r, r, b, w],
      [w, b, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, b, w],
      [w, b, r, r, r, r, r, b, b, b, b, r, r, b, b, b, b, b, r, r, r, r, r, b, w],
      [w, b, r, r, r, r, r, b, w, w, b, r, r, b, w, w, w, b, r, r, r, r, r, b, w],
      [w, b, r, r, r, r, r, b, w, w, b, r, r, b, w, w, w, b, r, r, r, r, r, b, w],
      [w, b, b, b, r, b, b, b, w, w, b, r, r, b, w, w, w, b, b, b, r, b, b, b, w],
      [w, w, w, b, r, b, w, w, w, w, b, r, r, b, w, w, w, w, w, b, r, b, w, w, w],
      [w, w, w, b, r, b, w, w, w, w, b, r, r, b, w, w, w, w, w, b, r, b, w, w, w],
      [w, w, w, b, r, b, b, b, b, b, b, r, r, b, b, b, b, b, b, b, r, b, w, w, w],
      [w, w, w, b, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, b, w, w, w],
      [w, w, w, b, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, b, w, w, w],
      [w, w, w, b, b, b, b, b, b, b, b, r, b, b, b, b, b, b, b, b, r, b, w, w, w],
      [w, w, w, w, w, w, w, w, w, w, b, r, b, w, w, w, w, w, w, b, r, b, w, w, w],
      [w, w, w, w, w, w, w, w, w, w, b, r, b, w, w, w, w, b, b, b, r, b, w, w, w],
      [w, w, w, w, w, w, w, w, w, w, b, r, b, w, w, w, w, b, r, r, r, b, w, w, w],
      [w, w, w, w, w, w, w, w, w, w, b, r, b, w, w, w, w, b, r, b, b, b, w, w, w],
      [w, b, b, b, b, b, b, b, w, w, b, r, b, w, w, w, w, b, r, b, w, w, w, w, w],
      [w, b, r, r, r, r, r, b, w, w, b, r, b, w, w, w, w, b, r, b, w, w, w, w, w],
      [w, b, r, r, r, r, r, b, b, b, b, r, b, b, b, b, b, b, r, b, w, w, w, w, w],
      [w, b, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, b, w, w, w, w, w],
      [w, b, r, r, r, r, r, b, b, b, b, b, b, b, b, b, b, b, b, b, w, w, w, w, w],
      [w, b, r, r, r, r, r, b, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w],
      [w, b, b, b, b, b, b, b, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w],
      [w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w],
    ];

    let border = new BorderConstraint(w);
    let path = new PathConstraint([r]);
    let model = new OverlappingModel(sample, N, width, height, periodicInput, periodicOutput, symmetry, ground, [border, path]);
    if (await model.run() !== Resolution.Decided) {
      console.log("fail");
    } else {
      console.log("success");
    }
    console.log("model", model);
    model.graphics([]);
  }
}