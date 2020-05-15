export interface UIColorScheme {
  readonly background: number;
  readonly uiBackground: number;
  readonly uiSelected: number;
  readonly uiNotSelected: number;
  readonly uiRed: number;
  readonly uiGreen: number;
  readonly uiYellow: number;
}

export const Colors: UIColorScheme = {
  background: 0x101010,
  uiBackground: 0x202020,
  uiSelected: 0x707070,
  uiNotSelected: 0x404040,
  uiRed: 0xEC402B,
  uiGreen: 0x00AB36,
  uiYellow: 0xBF9E00,
};