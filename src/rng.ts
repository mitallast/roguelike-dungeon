const FRAC = 2.3283064365386963e-10; /* 2^-32 */

/**
 * This code is an implementation of Alea algorithm; (C) 2010 Johannes Baagøe.
 * Alea is licensed according to the http://en.wikipedia.org/wiki/MIT_License.
 */
export class RNG {
  private _s0: number;
  private _s1: number;
  private _s2: number;
  private _c: number;

  static create(): RNG {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    console.log(`SRG generated seed: ${seed}`);
    return new RNG(seed);
  }

  static seeded(seed: number): RNG {
    return new RNG(seed);
  }

  private constructor(seed: number) {
    if (seed <= 1) throw "Illegal seed number";
    // seed = (seed < 1 ? seed * 0x10000000000000 : seed);
    this._s0 = (seed >>> 0) * FRAC;
    seed = (seed * 69069 + 1) >>> 0;
    this._s1 = seed * FRAC;
    seed = (seed * 69069 + 1) >>> 0;
    this._s2 = seed * FRAC;
    this._c = 1;
    return this;
  }

  /**
   * @returns Pseudorandom value [0,1), uniformly distributed
   */
  float(): number {
    const t = 2091639 * this._s0 + this._c * FRAC;
    this._s0 = this._s1;
    this._s1 = this._s2;
    this._c = t | 0;
    this._s2 = t - this._c;
    return this._s2;
  }

  /**
   * @returns uniformly distributed int32
   */
  int(): number {
    return this.float() * 0x100000000; // 2^32
  }

  /**
   * @returns uniformly distributed boolean
   */
  boolean(): boolean {
    return this.float() < 0.5;
  }

  /**
   * @param lowerBound The lower end of the range to return a value from, inclusive
   * @param upperBound The upper end of the range to return a value from, exclusive
   * @returns Pseudorandom value [lowerBound, upperBound), normally distributed
   */
  range(lowerBound: number, upperBound: number): number {
    return Math.floor(this.float() * (upperBound - lowerBound)) + lowerBound;
  }

  /**
   * @param mean Mean value
   * @param stddev Standard deviation. ~95% of the absolute values will be lower than 2*stddev.
   * @returns A normally distributed pseudorandom value
   */
  normal(mean: number = 0, stddev: number = 1): number {
    let u, v, r;
    do {
      u = 2 * this.float() - 1;
      v = 2 * this.float() - 1;
      r = u * u + v * v;
    } while (r > 1 || r == 0);

    const gauss = u * Math.sqrt(-2 * Math.log(r) / r);
    return mean + gauss * stddev;
  }

  /**
   * @param min
   * @param max
   * @param skew
   * @returns Skew-Normal distributed pseudorandom value
   */
  skewNormal(min: number, max: number, skew: number): number {
    // https://spin.atomicobject.com/2019/09/30/skew-normal-prng-javascript/

    let u = 0, v = 0;
    while (u === 0) u = this.float(); //Converting [0,1) to (0,1)
    while (v === 0) v = this.float();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) num = this.skewNormal(min, max, skew); // resample between 0 and 1 if out of range
    num = Math.pow(num, skew); // Skew
    num *= max - min; // Stretch to fill range
    num += min; // offset to min
    return num;
  }

  /**
   * @returns Randomly picked item, null when length=0
   */
  select<T>(array: readonly T[]): T | null {
    if (array.length === 0) {
      return null;
    }
    return array[Math.floor(this.float() * array.length)];
  }
}
