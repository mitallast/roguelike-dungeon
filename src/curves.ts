/**
 * Compute n! - factorial of n
 * @param {number} n
 */
function factorial(n: number): number {
  let result = 1;
  for (let k = 2; k <= n; k++) {
    result = result * k;
  }
  return result;
}

/**
 * Compute curve point
 * @param {number} t - положение кривой (от 0 до 1)
 */
export type Curve<Point> = (t: number) => Point;

export class LinearCurve {
  static line(start: number, end: number): Curve<number> {
    return (t: number): number => start * (1 - t) + end * t;
  }

  static matrix<Point extends number[]>(start: Point, end: Point): Curve<Point> {
    return (t: number): Point => {
      const m = [] as number[] as Point;
      for (let i = 0; i < start.length; i++) {
        m[i] = start[i] * (1 - t) + end[i] * t;
      }
      return m;
    };
  }
}

export class BezierCurve {
  /**
   * Compute i-th element of Bernstein basis polynomial
   *
   * @param {number} i - номер вершины,
   * @param {number} n - количество вершин
   * @param {number} t - положение кривой (от 0 до 1)
   */
  static basis(i: number, n: number, t: number): number {
    return (factorial(n) / (factorial(i) * factorial(n - i))) * Math.pow(t, i) * Math.pow(1 - t, n - i);
  }

  static line(...controlPoints: readonly number[]): Curve<number> {
    const n = controlPoints.length - 1;
    return (t): number => {
      if (t > 1) {
        t = 1;
      }
      let point: number = 0;
      for (let i = 0; i < controlPoints.length; i++) {
        point += controlPoints[i] * BezierCurve.basis(i, n, t);
      }
      return point;
    };
  }

  static matrix<Point extends number[]>(...controlPoints: readonly Point[]): Curve<Point> {
    const n = controlPoints.length - 1;
    const D = controlPoints[0].length;
    return (t: number): Point => {
      if (t > 1) {
        t = 1;
      }
      const point = [] as number[] as Point;
      for (let d = 0; d < D; d++) {
        point[d] = 0;
      }
      for (let i = 0; i < controlPoints.length; i++) {
        const b = BezierCurve.basis(i, n, t);
        for (let d = 0; d < D; d++) {
          point[d] += controlPoints[i][d] * b;
        }
      }
      return point;
    };
  }
}