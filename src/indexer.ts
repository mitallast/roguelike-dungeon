export class Indexer<T> {
  readonly equality: (a: T, b: T) => boolean;
  readonly values: T[] = [];

  constructor(equality: (a: T, b: T) => boolean) {
    this.equality = equality;
  }

  index(value: T): number {
    for (let i = 0; i < this.values.length; i++) {
      if (this.equality(value, this.values[i])) {
        return i;
      }
    }
    return this.values.push(value) - 1;
  }

  get(n: number): T {
    return this.values[n];
  }

  static array<T extends I[], I>(): Indexer<T> {
    return new Indexer<T>((a: T, b: T): boolean => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    });
  }

  static identity<T>(): Indexer<T> {
    return new Indexer<T>((a, b) => a === b);
  }
}
