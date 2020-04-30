import {RNG} from "../rng";
import {yields} from "../concurency";

// origin: https://github.com/mxgmn/WaveFunctionCollapse/

export function buffer<T>(size: number, value: T): T[] {
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
  wave: boolean[][] = []; // wave => pattern map

  propagator: number[][][] = []; // direction => pattern1 => pattern2[]
  compatible: number[][][] = [];
  observed: number[] | null = null;

  toPropagate: [number, number][] = [];

  backtrackItems: [number, number][] = []; // wave, pattern
  private backtrackItemsLengths: number[] = [];
  private prevChoices: [number, number][] = [];
  private droppedBacktrackItemsCount: number = 0;

  readonly rng: RNG;
  FMX: number;
  FMY: number;
  T: number = 0;
  periodic: boolean = false;

  weights: number[] = [];
  weightLogWeights: number[] = [];

  sumsOfOnes: number[] = []; // by wave index
  sumOfWeights: number = 0;
  sumOfWeightLogWeights: number = 0;
  startingEntropy: number = 0;

  sumsOfWeights: number[] = [];
  sumsOfWeightLogWeights: number[] = [];
  entropies: number[] = [];

  // The overall status of the propagator, always kept up to date
  status: Resolution = Resolution.Undecided;
  protected deferredConstraintsStep: boolean = false;

  protected constructor(rng: RNG, width: number, height: number) {
    this.rng = rng;
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
    this.wave = buffer(this.FMX * this.FMY, []);
    this.compatible = [];
    for (let i = 0; i < this.wave.length; i++) {
      this.wave[i] = buffer(this.T, true);
      this.compatible[i] = [];
      for (let t = 0; t < this.T; t++) {
        this.compatible[i][t] = buffer(4, 0);
      }
    }

    this.weightLogWeights = [];
    this.sumOfWeights = 0;
    this.sumOfWeightLogWeights = 0;

    for (let t = 0; t < this.T; t++) {
      this.weightLogWeights[t] = this.weights[t] * Math.log(this.weights[t]);
      this.sumOfWeights += this.weights[t];
      this.sumOfWeightLogWeights += this.weightLogWeights[t];
    }

    this.startingEntropy = Math.log(this.sumOfWeights) - this.sumOfWeightLogWeights / this.sumOfWeights;

    this.status = Resolution.Undecided;

    this.initConstraint();
  }

  clear(): void {
    this.sumsOfOnes = [];
    this.sumsOfWeights = [];
    this.sumsOfWeightLogWeights = [];
    this.entropies = [];

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
    this.prevChoices = [];

    this.status = Resolution.Undecided;
  }

  debug: boolean = false;

  async run(limit: number = 0, debug: boolean = false): Promise<Resolution> {
    if (this.wave.length === 0) {
      console.time("model.init");
      this.init();
      console.timeEnd("model.init");
    }

    console.time("model.clear");
    this.clear();
    console.timeEnd("model.clear");

    console.time("model.run");
    this.debug = debug;
    let i = 0
    for (; i < limit || limit === 0; i++) {
      if (i % 50 === 0) {
        await yields();
      }
      if (this.debug) {
        console.log("step", i);
      }
      this.step();
      if (this.debug) {
        console.log("after step", i);
        this.graphics([]);
      }
      if (this.status !== Resolution.Undecided) {
        break;
      }
    }

    console.timeEnd("model.run");

    console.log(`complete, steps: ${i}`);
    return this.status;
  }

  step(): Resolution {
    let index: number = -1;
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
          let item = this.prevChoices.pop()!;
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
      if (amount === 0) {
        if (this.debug) console.error(`[wave=${i}] found zero sum of ones`);
        if (this.debug) this.graphics([i]);
        this.status = Resolution.Contradiction;
        return [-1, -1]
      }

      let entropy = this.entropies[i];
      if (amount > 1 && entropy <= min) {
        let noise = 1E-6 * this.rng.float();
        if (entropy + noise < min) {
          min = entropy + noise;
          argmin = i;
        }
      }
    }

    if (argmin == -1) {
      if (this.debug) console.log("complete observed");
      this.observed = buffer(this.FMX * this.FMY, 0);
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
    let distribution: number[] = [];
    for (let t = 0; t < this.T; t++) {
      distribution[t] = this.wave[argmin][t] ? this.weights[t] : 0;
      distribution_sum += distribution[t];
    }

    let rnd = this.rng.float() * distribution_sum;
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

    if (this.debug) {
      console.log("observed", [argmin, r]);
      this.graphics([argmin]);
    }

    return [argmin, r];
  }

  protected abstract testObserved(index: number): void;

  protected propagate(): void {
    while (this.toPropagate.length > 0) {
      let [i, t] = this.toPropagate.pop()!;

      let x = i % this.FMX, y = Math.floor(i / this.FMX);
      for (let direction = 0; direction < 4; direction++) {
        const dx = Model.DX[direction], dy = Model.DY[direction];
        let sx = x + dx, sy = y + dy;
        if (this.onBoundary(sx, sy)) {
          continue;
        }

        if (sx < 0) sx += this.FMX;
        else if (sx >= this.FMX) sx -= this.FMX;
        if (sy < 0) sy += this.FMY;
        else if (sy >= this.FMY) sy -= this.FMY;

        let s = sx + sy * this.FMX;

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
    if (this.debug) console.log("internal ban", index, pattern);
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
      if (this.debug) {
        console.error("sum is zero", index);
        this.graphics([index]);
      }
      return true; // result is contradiction
    } else {
      return false; // result is not contradiction
    }
  }

  protected backtrack(): void {
    const targetLength = this.backtrackItemsLengths.pop()! - this.droppedBacktrackItemsCount;
    if (this.debug) console.warn("backtrack", targetLength);

    const markup: number[] = [];

    const toPropagateSet = new Set<string>(this.toPropagate.map((i) => i.join(",")));
    while (this.backtrackItems.length > targetLength) {
      let [index, patternIndex] = this.backtrackItems.pop()!;

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