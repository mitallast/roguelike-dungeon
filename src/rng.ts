/**
 * https://stackoverflow.com/questions/424292/seedable-javascript-random-number-generator
 * LCG using GCC's constants
 */

const m = 0x80000000; // 2^31;
const a = 1103515245;
const c = 12345;

export class RNG {
  private state: number;

  constructor(seed: number | null = null) {
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

  nextNormal(min: number, max: number, skew: number): number {
    // https://spin.atomicobject.com/2019/09/30/skew-normal-prng-javascript/

    let u = 0, v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) num = this.nextNormal(min, max, skew); // resample between 0 and 1 if out of range
    num = Math.pow(num, skew); // Skew
    num *= max - min; // Stretch to fill range
    num += min; // offset to min
    return num;
  }
}