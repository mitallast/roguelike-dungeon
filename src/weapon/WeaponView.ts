import {Weapon} from "./Weapon";

export interface WeaponView {
  setWeapon(weapon: Weapon | null): void;
  setPosition(x: number, y: number): void;
  setAngle(angle: number): void;
  destroy(): void;
}