export interface Serializer<T> {
  serialize(value: T): string;
  deserialize(value: string): T;
}

export class OptionalSerializer<T> implements Serializer<T | null> {
  private readonly _serializer: Serializer<T>;

  constructor(serializer: Serializer<T>) {
    this._serializer = serializer;
  }

  deserialize(value: string): T | null {
    if (value) {
      return this._serializer.deserialize(value);
    } else {
      return null;
    }
  }

  serialize(value: T | null): string {
    if (value !== null) {
      return this._serializer.serialize(value);
    } else {
      return "";
    }
  }
}

export class StringSerializer implements Serializer<string> {
  static readonly instance: Serializer<string> = new StringSerializer();

  deserialize(value: string): string {
    return value;
  }

  serialize(value: string): string {
    return value;
  }
}

export class FloatSerializer implements Serializer<number> {
  static readonly instance: Serializer<number> = new FloatSerializer();

  deserialize(data: string): number {
    if (!data) throw "empty";
    const value = Number.parseFloat(data);
    if (isNaN(value)) throw "NaN";
    return value;
  }

  serialize(value: number): string {
    if (isNaN(value)) throw "NaN";
    return value.toString();
  }
}

export class IntegerSerializer implements Serializer<number> {
  static readonly instance: Serializer<number> = new IntegerSerializer();

  deserialize(data: string): number {
    if (!data) throw "empty";
    const value = Number.parseInt(data);
    if (isNaN(value)) throw "NaN";
    return value;
  }

  serialize(value: number): string {
    if (isNaN(value)) throw "NaN";
    return value.toString();
  }
}

export class JsonSerializer<T> implements Serializer<T> {
  deserialize(value: string): T {
    return JSON.parse(value);
  }

  serialize(value: T): string {
    return JSON.stringify(value);
  }
}