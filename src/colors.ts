export interface ColorScheme {
  readonly background: number
  readonly uiBackground: number
  readonly uiSelected: number
  readonly uiNotSelected: number
  readonly uiRed: number
  readonly uiYellow: number
}

export const Colors: ColorScheme = {
  background: 0x202020,
  uiBackground: 0x505050,
  uiSelected: 0x909090,
  uiNotSelected: 0x505050,
  uiRed: 0xFF0000,
  uiYellow: 0xFFD300,
};