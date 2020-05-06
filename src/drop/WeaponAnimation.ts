/* eslint-disable @typescript-eslint/camelcase */

import {AnimationEvent} from "../animation";

export interface WeaponAnimation {
  readonly smoothly: boolean;
  readonly angle: AnimationEvent<[number]>[];
  readonly pos: AnimationEvent<[number, number]>[];
}

export interface WeaponAnimationSet {
  readonly idle: WeaponAnimation;
  readonly run: WeaponAnimation;
  readonly hit: WeaponAnimation;
  readonly combo?: readonly WeaponAnimation[];
}

export interface WeaponAnimations {
  readonly knife: WeaponAnimationSet;
  readonly rusty_sword: WeaponAnimationSet;
  readonly regular_sword: WeaponAnimationSet;
  readonly red_gem_sword: WeaponAnimationSet;
  readonly hammer: WeaponAnimationSet;
  readonly big_hammer: WeaponAnimationSet;
  readonly baton_with_spikes: WeaponAnimationSet;
  readonly mace: WeaponAnimationSet;
  readonly katana: WeaponAnimationSet;
  readonly saw_sword: WeaponAnimationSet;
  readonly anime_sword: WeaponAnimationSet;
  readonly axe: WeaponAnimationSet;
  readonly machete: WeaponAnimationSet;
  readonly cleaver: WeaponAnimationSet;
  readonly duel_sword: WeaponAnimationSet;
  readonly knight_sword: WeaponAnimationSet;
  readonly golden_sword: WeaponAnimationSet;
  readonly lavish_sword: WeaponAnimationSet;
}

export const basic: WeaponAnimationSet = {
  idle: {
    smoothly: false,
    angle: [
      {time: 0, args: [0]},
    ],
    pos: [
      {time: 0, args: [-1, 0]},
      {time: 1, args: [-1, 1]},
      {time: 2, args: [-1, 2]},
      {time: 3, args: [-1, 1]},
    ]
  },
  run: {
    smoothly: false,
    angle: [
      {time: 0, args: [0]}
    ],
    pos: [
      {time: 0, args: [-1, -1]},
      {time: 1, args: [-1, -2]},
      {time: 2, args: [-1, -1]},
      {time: 3, args: [-1, 0]},
    ]
  },
  hit: {
    smoothly: false,
    angle: [
      {time: 0, args: [0]},
      {time: 1.5, args: [-30]},
      {time: 2, args: [120]},
      {time: 3, args: [90]},
      {time: 4, args: [0]},
    ],
    pos: [
      {time: 0, args: [-1, 0]},
    ]
  },
};
export const basicSword: WeaponAnimationSet = {
  idle: basic.idle,
  run: basic.run,
  hit: basic.hit,
  combo: [
    {
      smoothly: false,
      angle: [
        {time: 0, args: [0]},
        {time: 1.5, args: [-30]},
        {time: 2, args: [120]},
        {time: 4, args: [120]},
      ],
      pos: [
        {time: 0, args: [-1, 0]},
      ],
    },
    {
      smoothly: false,
      angle: [
        {time: 0, args: [120]},
        {time: 1.5, args: [150]},
        {time: 2, args: [-15]},
        {time: 4, args: [-15]},
      ],
      pos: [
        {time: 0, args: [-1, 0]},
      ],
    },
    {
      smoothly: true,
      angle: [
        {time: 0, args: [-15]},
        {time: 1.5, args: [90]},
        {time: 4, args: [90]}
      ],
      pos: [
        {
          time: 0,
          args: [-1, 0]
        },
        {
          time: 0.5,
          args: [-14, -4]
        },
        {
          time: 3,
          args: [-14, -4]
        },
        {
          time: 3.5,
          args: [0, -4]
        },
        {
          time: 6,
          args: [0, -4]
        }
      ]
    }
  ]
};

export const weaponAnimations: WeaponAnimations = {
  knife: {
    idle: basic.idle,
    run: basic.run,
    hit: {
      smoothly: true,
      angle: [
        {time: 0, args: [90]},
      ],
      pos: [
        {time: 0, args: [-8, -4]},
        {time: 1, args: [-4, -4]},
        {time: 2, args: [4, -4]},
        {time: 3, args: [-2, -4]},
      ]
    },
  },
  rusty_sword: basicSword,
  regular_sword: basicSword,
  red_gem_sword: basicSword,
  hammer: basic,
  big_hammer: basic,
  baton_with_spikes: basic,
  mace: basic,
  katana: basicSword,
  saw_sword: basicSword,
  anime_sword: basicSword,
  axe: basic,
  machete: basic,
  cleaver: basic,
  duel_sword: basicSword,
  knight_sword: basicSword,
  golden_sword: basicSword,
  lavish_sword: basicSword,
};