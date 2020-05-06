export interface AnimationEvent<Args extends any[]> {
  readonly time: number;
  readonly args: Args;
}