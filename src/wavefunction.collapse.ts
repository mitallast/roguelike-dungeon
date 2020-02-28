// origin: https://github.com/robert/wavefunction-collapse/blob/master/main.py

interface Direction {
  readonly x: number;
  readonly y: number;
}

const UP: Direction = {x: 0, y: 1};
const DOWN: Direction = {x: 0, y: -1};
const LEFT: Direction = {x: -1, y: 0};
const RIGHT: Direction = {x: 1, y: 0};

export class Size {
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}

export class Coordinate {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

/**
 * The CompatibilityOracle class is responsible for telling us
 * which combinations of tiles and directions are compatible. It's
 * so simple that it perhaps doesn't need to be a class, but I think
 * it helps keep things clear.
 */
export class CompatibilityOracle<Tile> {
  private readonly up = new Set<string>();
  private readonly down = new Set<string>();
  private readonly left = new Set<string>();
  private readonly right = new Set<string>();

  add(tile1: Tile, tile2: Tile, direction: Direction): void {
    const hash = CompatibilityOracle.hash(tile1, tile2);
    switch (direction) {
      case UP:
        this.up.add(hash);
        break;
      case DOWN:
        this.down.add(hash);
        break;
      case LEFT:
        this.left.add(hash);
        break;
      case RIGHT:
        this.right.add(hash);
        break;
    }
  }

  check(tile1: Tile, tile2: Tile, direction: Direction): boolean {
    const hash = CompatibilityOracle.hash(tile1, tile2);
    switch (direction) {
      case UP:
        return this.up.has(hash);
      case DOWN:
        return this.down.has(hash);
      case LEFT:
        return this.left.has(hash);
      case RIGHT:
        return this.right.has(hash);
    }
  }

  private static hash<Tile>(tile1: Tile, tile2: Tile): string {
    return `${tile1};${tile2}`;
  }
}

/**
 * The WaveFunction class is responsible for storing which tiles
 * are permitted and forbidden in each location of an output image.
 */
export class WaveFunction<Tile> {

  /**
   * Initialize a new WaveFunction for a grid of `size`,
   * where the different tiles have overall weights `weights`.
   * Arguments:
   * size -- a 2-tuple of (width, height)
   * weights -- a dict of tile -> weight of tile
   * @param size
   * @param weights
   */
  static mk<Tile>(size: Size, weights: Map<Tile, number>): WaveFunction<Tile> {
    const coefficients = WaveFunction.init_coefficients(size, Array.from(weights.keys()));
    return new WaveFunction(size, coefficients, weights);
  }

  /**
   * Initializes a 2-D wavefunction matrix of coefficients.
   * The matrix has size `size`, and each element of the matrix
   * starts with all tiles as possible. No tile is forbidden yet.
   * NOTE: coefficients is a slight misnomer, since they are a
   * set of possible tiles instead of a tile -> number/bool dict. This
   * makes the code a little simpler. We keep the name `coefficients`
   * for consistency with other descriptions of WaveFunction Collapse.
   * Arguments:
   * size -- a 2-tuple of (width, height)
   * tiles -- a set of all the possible tiles
   * Returns:
   * A 2-D matrix in which each element is a set
   * @param size
   * @param tiles
   */
  static init_coefficients<Tile>(size: Size, tiles: Tile[]): Set<Tile>[][] {
    const coefficients: Set<Tile>[][] = [];
    for (let x = 0; x < size.width; x++) {
      const row: Set<Tile>[] = [];
      coefficients.push(row);
      for (let y = 0; y < size.height; y++) {
        row.push(new Set(tiles))
      }
    }
    return coefficients;
  }

  readonly size: Size;
  private readonly coefficients: Set<Tile>[][];
  readonly weights: Map<Tile, number>;

  constructor(size: Size, coefficients: Set<Tile>[][], weights: Map<Tile, number>) {
    this.size = size;
    this.coefficients = coefficients;
    this.weights = weights;
  }

  /**
   * Returns the set of possible tiles at coords
   */
  get(x: number, y: number): Set<Tile> {
    return this.coefficients[x][y];
  }

  /**
   * Returns the only remaining possible tile at `coords`.
   * If there is not exactly 1 remaining possible tile then
   * this method raises an exception.
   */
  get_collapsed(x: number, y: number): Tile {
    const opts = this.get(x, y);
    console.assert(opts.size === 1);
    return opts.values().next().value;
  }

  /**
   * Returns a 2-D matrix of the only remaining possible
   * tiles at each location in the wavefunction. If any location
   * does not have exactly 1 remaining possible tile then
   * this method raises an exception.
   */
  get_all_collapsed(): Tile[][] {
    const collapsed: Tile[][] = [];
    for (let x = 0; x < this.size.width; x++) {
      const row: Tile[] = [];
      collapsed.push(row);
      for (let y = 0; y < this.size.height; y++) {
        row.push(this.get_collapsed(x, y));
      }
    }
    return collapsed;
  }

  /**
   * Calculates the Shannon Entropy of the wavefunction at coords.
   * @param x
   * @param y
   */
  shannon_entropy(x: number, y: number) {
    let sum_of_weights = 0;
    let sum_of_weight_log_weights = 0;
    let tiles = this.coefficients[x][y];
    for (let opt of tiles) {
      const weight = this.weights.get(opt);
      sum_of_weights += weight;
      sum_of_weight_log_weights += weight * Math.log(weight);
    }
    return Math.log(sum_of_weights) - (sum_of_weight_log_weights / sum_of_weights)
  }

  /**
   * Returns true if every element in WaveFunction is fully collapsed, and false otherwise.
   */
  is_fully_collapsed(): boolean {
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        if (this.coefficients[x][y].size > 1) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Collapses the wavefunction at `coords` to a single, definite
   * tile. The tile is chosen randomly from the remaining possible tiles
   * at `coords`, weighted according to the WaveFunction's global
   * `weights`.
   * This method mutates the WaveFunction, and does not return anything.
   */
  collapse(x: number, y: number): void {
    const opts = this.coefficients[x][y];

    const valid_weights = new Map<Tile, number>();
    let total_weights = 0;
    for (let tile of opts) {
      const weight = this.weights.get(tile);
      valid_weights.set(tile, weight);
      total_weights += weight;
    }

    let rnd = Math.random() * total_weights;
    let chosen: Tile = null;
    for (let [tile, weight] of valid_weights) {
      rnd -= weight;
      if (rnd < 0) {
        chosen = tile;
        break;
      }
    }
    this.coefficients[x][y] = new Set([chosen]);
  }

  /**
   * Removes `forbidden_tile` from the list of possible tiles
   * at `coords`.
   * This method mutates the WaveFunction, and does not return anything.
   * @param x
   * @param y
   * @param forbidden_tile
   */
  constrain(x: number, y: number, forbidden_tile: Tile): void {
    this.coefficients[x][y].delete(forbidden_tile);
  }

  constrainOnly(x: number, y: number, allowed_tile: Tile): void {
    this.coefficients[x][y].clear();
    this.coefficients[x][y].add(allowed_tile);
  }
}

/**
 * The Model class is responsible for orchestrating the
 * WaveFunction Collapse algorithm.
 */
export class Model<Tile> {
  readonly output_size: Size;
  readonly compatibility_oracle: CompatibilityOracle<Tile>;
  readonly wavefunction: WaveFunction<Tile>;

  private canvas: HTMLCanvasElement;

  constructor(output_size: Size, weights: Map<Tile, number>, compatibility_oracle: CompatibilityOracle<Tile>) {
    this.output_size = output_size;
    this.compatibility_oracle = compatibility_oracle;
    this.wavefunction = WaveFunction.mk(output_size, weights);
  }

  /**
   * Collapses the WaveFunction until it is fully collapsed,
   * then returns a 2-D matrix of the final, collapsed state.
   */
  async run(): Promise<Tile[][]> {
    while (!this.wavefunction.is_fully_collapsed()) {
      await new Promise((resolve => {
        setTimeout(async () => {
          await this.iterate();
          resolve(null);
        }, 0);
      }));
    }

    return this.wavefunction.get_all_collapsed();
  }

  /**
   * Performs a single iteration of the WaveFunction Collapse Algorithm.
   */
  async iterate(): Promise<void> {
    // 1. Find the co-ordinates of minimum entropy
    let coords = this.min_entropy_coords();
    // 2. Collapse the wavefunction at these co-ordinates
    this.wavefunction.collapse(coords.x, coords.y);
    // 3. Propagate the consequences of this collapse
    this.propagate(coords);
    this.debug();
  }

  debug(): void {
    const width = this.output_size.width;
    const height = this.output_size.height;

    if (!this.canvas) {
      const scale = 8;
      this.canvas = document.createElement("canvas");
      this.canvas.width = width * scale;
      this.canvas.height = height * scale;
      this.canvas.style.margin = "10px";
      document.body.prepend(this.canvas);
      this.canvas.getContext("2d").scale(scale, scale);
    }

    const ctx = this.canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    let max_entropy = this.wavefunction.weights.size;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let entropy = this.wavefunction.get(x, y).size;
        if (entropy === 0) {
          ctx.fillStyle = `black`;
        } else if (entropy === 1) {
          let id = this.wavefunction.get(x, y).values().next().value;
          ctx.fillStyle = `rgb(${id * 31 % 256}, ${id * 7 % 256}, ${id * 11 % 256})`;
        } else {
          let ratio = 2 * entropy / max_entropy;
          let b = Math.floor(Math.max(0, 255 * (1 - ratio)));
          let r = Math.floor(Math.max(0, 255 * (ratio - 1)));
          let g = 255 - b - r;
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  /**
   * Returns the coords of the location whose wavefunction has the lowest entropy.
   */
  min_entropy_coords(): Coordinate {
    let min_entropy: number = null;
    let min_entropy_coords: Coordinate = null;
    for (let x = 0; x < this.output_size.width; x++) {
      for (let y = 0; y < this.output_size.height; y++) {
        if (this.wavefunction.get(x, y).size == 1) {
          continue;
        }
        let entropy = this.wavefunction.shannon_entropy(x, y);
        //  Add some noise to mix things up a little
        let entropy_plus_noise = entropy - (Math.random() / 1000);
        if (min_entropy === null || entropy_plus_noise < min_entropy) {
          min_entropy = entropy_plus_noise;
          min_entropy_coords = new Coordinate(x, y);
        }
      }
    }
    return min_entropy_coords
  }

  /**
   * Propagates the consequences of the wavefunction at `coords`
   * collapsing. If the wavefunction at (x,y) collapses to a fixed tile,
   * then some tiles may not longer be theoretically possible at
   * surrounding locations.
   * This method keeps propagating the consequences of the consequences,
   * and so on until no consequences remain.
   */
  propagate(coords: Coordinate): void {
    let stack: Coordinate[] = [coords];

    while (stack.length > 0) {
      const cur_coords = stack.pop();
      // Get the set of all possible tiles at the current location
      const cur_possible_tiles = this.wavefunction.get(cur_coords.x, cur_coords.y);

      // Iterate through each location immediately adjacent to the current location.
      for (let d of Model.valid_dirs(cur_coords, this.output_size)) {
        const other_coords = new Coordinate(cur_coords.x + d.x, cur_coords.y + d.y);

        // Iterate through each possible tile in the adjacent location's wavefunction.
        for (let other_tile of this.wavefunction.get(other_coords.x, other_coords.y)) {
          // Check whether the tile is compatible with any tile in
          // the current location's wavefunction.
          let other_tile_is_possible = false;
          for (let cur_tile of cur_possible_tiles) {
            if (this.compatibility_oracle.check(cur_tile, other_tile, d)) {
              other_tile_is_possible = true;
              break;
            }
          }

          // If the tile is not compatible with any of the tiles in
          // the current location's wavefunction then it is impossible
          // for it to ever get chosen. We therefore remove it from
          // the other location's wavefunction.
          if (!other_tile_is_possible) {
            this.wavefunction.constrain(other_coords.x, other_coords.y, other_tile);
            stack.push(other_coords);
          }
        }
      }
    }
  }

  /**
   * Returns the valid directions from `cur_coord` in a matrix
   * of `matrix_size`. Ensures that we don't try to take step to the
   * left when we are already on the left edge of the matrix.
   * @param coord
   * @param size
   */
  static valid_dirs(coord: Coordinate, size: Size): Direction[] {
    const dirs: Direction[] = [];
    if (coord.x > 0) dirs.push(LEFT);
    if (coord.x < size.width - 1) dirs.push(RIGHT);
    if (coord.y > 0) dirs.push(DOWN);
    if (coord.y < size.height - 1) dirs.push(UP);
    return dirs;
  }

  /**
   * Parses an example `matrix`. Extracts:
   * 1. Tile compatibilities - which pairs of tiles can be placed next
   *    to each other and in which directions
   * 2. Tile weights - how common different tiles are
   * Arguments:
   *  matrix -- a 2-D matrix of tiles
   * Returns:
   * A tuple of:
   *  * A set of compatibile tile combinations, where each combination is of
   *    the form (tile1, tile2, direction)
   *  * A dict of weights of the form tile -> weight
   */
  static parse_example_matrix<T>(matrix: T[][]): [CompatibilityOracle<T>, Map<T, number>] {
    const compatibility_oracle = new CompatibilityOracle<T>();
    const weights = new Map<T, number>();
    const width = matrix.length;
    const height = matrix[0].length;
    const size = new Size(width, height);

    for (let x = 0; x < width; x++) {
      const row = matrix[x];
      for (let y = 0; y < height; y++) {
        const cur_tile = row[y];
        const w = (weights.get(cur_tile) || 0) + 1;
        weights.set(cur_tile, w);

        for (let d of Model.valid_dirs(new Coordinate(x, y), size)) {
          const other_tile = matrix[x + d.x][y + d.y];
          compatibility_oracle.add(cur_tile, other_tile, d);
        }
      }
    }

    return [compatibility_oracle, weights];
  }
}

export class WFCTest {
  static async test() {
    const input_matrix = [
      ['L', 'L', 'L', 'L'],
      ['L', 'L', 'L', 'L'],
      ['L', 'L', 'L', 'L'],
      ['L', 'C', 'C', 'L'],
      ['C', 'S', 'S', 'C'],
      ['S', 'S', 'S', 'S'],
      ['S', 'S', 'S', 'S'],
    ];

    let [compatibility_oracle, weights] = Model.parse_example_matrix(input_matrix);
    console.log(compatibility_oracle);
    let model = new Model(new Size(50, 100), weights, compatibility_oracle);
    let output = await model.run();
    console.log(model);
    console.log(output);
    WFCTest.render_colors(output);
  }

  /**
   * Render the fully collapsed `matrix` using the given `colors.
   */
  static render_colors(output: string[][]): void {
    let colors: any = {
      'L': 'green',
      'S': 'blue',
      'C': 'yellow',
      'A': 'cyan',
      'B': 'magenta',
    };

    const container = document.createElement("pre");
    for (let row of output) {
      const r = document.createElement("div");
      container.appendChild(r);
      for (let val of row) {
        let color: string = colors[val];
        let span = document.createElement("span");
        span.innerText = val;
        span.style.color = color;
        r.appendChild(span);
      }
    }

    document.body.appendChild(container);
  }
}