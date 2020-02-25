export interface View {
  update(delta: number): void;
  destroy(): void;
}