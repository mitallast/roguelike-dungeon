export interface DungeonObjectOptions {
  readonly static: boolean;
  readonly interacting: boolean;
  readonly height: number;
  readonly width: number;
}

export abstract class DungeonObject {
  readonly static: boolean;
  readonly interacting: boolean;
  readonly height: number;
  readonly width: number;

  abstract readonly x: number;
  abstract readonly y: number;

  private readonly _registry: DungeonObjectRegistry;

  protected constructor(registry: DungeonObjectRegistry, options: DungeonObjectOptions) {
    this._registry = registry;
    this.static = options.static;
    this.interacting = options.interacting;
    this.height = options.height;
    this.width = options.width;

    this._registry.register(this);
  }

  destroy(): void {
    this._registry.unregister(this);
  }

  collide(_object: DungeonObject): boolean {
    return false;
  }

  interact(_object: DungeonObject): void {
  }
}

export class DungeonObjectRegistry {
  private readonly _objects: DungeonObject[] = [];

  query<T extends DungeonObject>(query: {
    type: (t: DungeonObject) => t is T;
    filter?: (t: T) => boolean;
    sort?: (a: T, b: T) => number;
  }): T[] {
    let result = this._objects.filter<T>(query.type);
    if (query.filter) {
      result = result.filter(query.filter);
    }
    if (query.sort) {
      result.sort(query.sort);
    }
    return result;
  }

  register(object: DungeonObject): void {
    if (object.interacting || !object.static) {
      this._objects.push(object);
      const stats: any = {};
      for (const object of this._objects) {
        stats[object.constructor.name] = (stats[object.constructor.name] || 0) + 1;
      }
    }
  }

  unregister(object: DungeonObject): void {
    const index = this._objects.indexOf(object);
    if (index >= 0) {
      this._objects.splice(index, 1);
    }
  }
}
