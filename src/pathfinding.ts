import * as PIXI from 'pixi.js';

export enum Heuristic {Manhattan = 0, Euclidean = 1, Chebyshev = 2, Octile = 3}

class Node {
  parent: Node | null;
  position: PIXI.Point;

  g: number = 0;
  h: number = 0;
  f: number = 0;

  constructor(parent: Node | null, position: PIXI.Point) {
    this.parent = parent;
    this.position = position;
  }

  equal(other: Node): boolean {
    return this.position.equals(other.position);
  }
}

// classic A* path finding
export class PathFinding {
  private readonly _width: number;
  private readonly _height: number;
  private readonly _map: number[][] = []; // x => y

  private readonly _heuristic: Heuristic;
  private readonly _weight: number = 1;

  private readonly _includeStart: boolean;
  private readonly _includeEnd: boolean;
  private readonly _diagonalAllowed: boolean;

  constructor(width: number,
              height: number,
              diagonalAllowed: boolean = true,
              includeStart: boolean = false,
              includeEnd: boolean = false,
              heuristic: Heuristic = Heuristic.Chebyshev,
              weight: number = 1) {
    this._width = width;
    this._height = height;
    this._diagonalAllowed = diagonalAllowed;
    this._includeStart = includeStart;
    this._includeEnd = includeEnd;
    this._heuristic = heuristic;
    this._weight = weight;
    for (let x = 0; x < width; x++) {
      const row: number[] = [];
      this._map.push(row);
      for (let y = 0; y < height; y++) {
        row.push(1);
      }
    }
  }

  clear(x: number, y: number): void {
    this._map[x][y] = 0;
  }

  mark(x: number, y: number): void {
    this._map[x][y] = 1;
  }

  find(start: PIXI.Point, end: PIXI.Point): PIXI.Point[] {

    // Create start and end node
    const startNode = new Node(null, start);
    const endNode = new Node(null, end);

    // Initialize both open and closed list
    const openList: Node[] = [];
    const closedList: Node[] = [];

    // Add the start node
    openList.push(startNode);

    // Loop until you find the end
    while (openList.length > 0) {
      // Get the current node
      let currentNode = openList[0];
      let currentIndex = 0;
      for (let i = 1; i < openList.length; i++) {
        const item = openList[i];
        if (item.f < currentNode.f) {
          currentNode = item;
          currentIndex = i;
        }
      }

      // Pop current off open list, add to closed list
      openList.splice(currentIndex, 1);
      closedList.push(currentNode);

      // Found the goal
      if (currentNode.equal(endNode)) {
        const path: PIXI.Point[] = [];
        let current: Node;
        if (this._includeEnd) {
          current = currentNode;
        } else {
          current = currentNode.parent!;
        }
        while (current.parent !== null) {
          path.push(current.position);
          current = current.parent;
        }
        if (this._includeStart) {
          path.push(current.position);
        }
        return path.reverse();
      }

      // Generate children
      const children: Node[] = [];
      const squares = this._diagonalAllowed ? PathFinding.adjacentSquaresDiagonal : PathFinding.adjacentSquares;

      for (let i = 0; i < squares.length; i++) {
        const newPosition = squares[i];
        // Get node position
        const nodePosition = new PIXI.Point(currentNode.position.x + newPosition.x, currentNode.position.y + newPosition.y);

        // Make sure within range
        if (nodePosition.x >= this._width || nodePosition.x < 0 ||
          nodePosition.y >= this._height || nodePosition.y < 0) {
          continue;
        }

        // Make sure walkable terrain
        if (this._map[nodePosition.x][nodePosition.y] != 0) {
          continue;
        }

        // Create new node
        const newNode = new Node(currentNode, nodePosition);

        // Append
        children.push(newNode);
      }

      // Loop through children
      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        // Child is on the closed list
        if (closedList.find(c => c.equal(child)) != null) {
          continue;
        }

        // Create the f, g, and h values
        child.g = currentNode.g + 1;
        child.h = this.heuristicFunction(child.position, endNode.position);
        child.f = child.g + child.h;

        // Child is already in the open list
        if (openList.find(c => c.equal(child)) != null) {
          continue;
        }

        openList.push(child);
      }
    }

    return [];
  }

  private heuristicFunction(
    pos0: PIXI.Point,
    pos1: PIXI.Point,
  ): number {
    const deltaX = Math.abs(pos1.x - pos0.x);
    const deltaY = Math.abs(pos1.y - pos0.y);

    switch (this._heuristic) {
      case Heuristic.Manhattan:
        /**
         * Calculate the Manhatten distance.
         * Generally: Overestimates distances because diagonal movement not taken into accout.
         * Good for a 4-connected grid (diagonal movement not allowed)
         */
        return (deltaX + deltaY) * this._weight;
      case Heuristic.Euclidean:
        /**
         * Calculate the Euclidean distance.
         * Generally: Underestimates distances, assuming paths can have any angle.
         * Can be used f.e. when units can move at any angle.
         */
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY) * this._weight;
      case Heuristic.Chebyshev:
        /**
         * Calculate the Chebyshev distance.
         * Should be used when diagonal movement is allowed.
         * D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy)
         * D = 1 and D2 = 1
         * => (dx + dy) - Math.min(dx, dy)
         * This is equivalent to Math.max(dx, dy)
         */
        return Math.max(deltaX, deltaY) * this._weight;
      case Heuristic.Octile:
        /**
         * Calculate the Octile distance.
         * Should be used on an 8-connected grid (diagonal movement allowed).
         * D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy)
         * D = 1 and D2 = sqrt(2)
         * => (dx + dy) - 0.58 * Math.min(dx, dy)
         */
        return (deltaX + deltaY - 0.58 * Math.min(deltaX, deltaY)) * this._weight;
    }
  }

  private static adjacentSquares: PIXI.Point[] = [
    new PIXI.Point(0, -1),
    new PIXI.Point(0, 1),
    new PIXI.Point(-1, 0),
    new PIXI.Point(1, 0),
  ];

  private static adjacentSquaresDiagonal: PIXI.Point[] = [
    new PIXI.Point(0, -1),
    new PIXI.Point(0, 1),
    new PIXI.Point(-1, 0),
    new PIXI.Point(1, 0),
    new PIXI.Point(-1, -1),
    new PIXI.Point(-1, 1),
    new PIXI.Point(1, -1),
    new PIXI.Point(1, 1)
  ];
}