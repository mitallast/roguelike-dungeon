export interface ColorScheme {
  readonly background: number
  readonly uiBackground: number
  readonly uiSelected: number
  readonly uiNotSelected: number
  readonly healthBackground: number
  readonly healthRed: number
}

export const Colors: ColorScheme = {
  background: 0x202020,
  uiBackground: 0x505050,
  uiSelected: 0x909090,
  uiNotSelected: 0x505050,
  healthBackground: 0x505050,
  healthRed: 0xFF0000,
};