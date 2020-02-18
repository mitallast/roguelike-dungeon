/**
 * https://stackoverflow.com/questions/424292/seedable-javascript-random-number-generator
 * LCG using GCC's constants
 */

const m = 0x80000000; // 2^31;
const a = 1103515245;
const c = 12345;

export class RNG {
  private state: number;

  constructor(seed: number = null) {
    this.state = seed ? seed : Math.floor(Math.random() * (m - 1));
    console.log("seed", this.state);
  }

  nextInt(): number {
    this.state = (a * this.state + c) % m;
    return this.state;
  }

  nextFloat(): number {
    return this.nextInt() / (m - 1);
  }

  nextRange(start: number, end: number): number {
    const rangeSize = end - start;
    const randomUnder1 = this.nextInt() / m;
    return start + Math.floor(randomUnder1 * rangeSize);
  }

  choice<T>(array: T[]): T {
    return array[this.nextRange(0, array.length)];
  }
}