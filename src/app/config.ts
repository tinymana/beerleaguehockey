/** Gameplay grid. Resolution is an open creative decision (DECISIONS.md #9). */
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 320;
export const VERSION = '0.9.1';

export const SCENES = {
  boot: 'Boot',
  title: 'Title',
  skating: 'Skating',
  arenaLab: 'ArenaLab',
  creator: 'Creator',
  lockerRoom: 'LockerRoomTest',
} as const;

/** UI palette taken from the supplied title art. */
export const UI = {
  white: 0xffffff,
  ice: 0xbfd8ff,
  dim: 0x6f7fb5,
  gold: 0xffc83a,
  red: 0xff4a4a,
  navy: 0x0b1030,
  navyLight: 0x1c2a66,
  blue: 0x2b5fd9,
} as const;
