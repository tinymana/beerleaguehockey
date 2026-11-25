import { describe, expect, it } from 'vitest';
import { SKATER_SHEET, choosePose, skaterFrame } from '../src/match/view/skaterSprite';

const base = { speed: 100, pushing: true, againstTravel: false, charging: false, sinceShot: 5 };

describe('skater sprite sheet mapping', () => {
  it('uses the south row unflipped when facing down the screen', () => {
    expect(skaterFrame(2, 'glide')).toEqual({ frame: 0 * SKATER_SHEET.columns + 4, flip: false });
  });

  it('mirrors east-side rows for west-side directions', () => {
    expect(skaterFrame(4, 'glide')).toEqual({ ...skaterFrame(0, 'glide'), flip: true });
    expect(skaterFrame(3, 'brake')).toEqual({ ...skaterFrame(1, 'brake'), flip: true });
    expect(skaterFrame(5, 'shoot')).toEqual({ ...skaterFrame(7, 'shoot'), flip: true });
  });

  it('cycles four skating frames and wraps', () => {
    const frames = [0, 1, 2, 3, 4, 5].map((s) => skaterFrame(0, 'skate', s).frame % SKATER_SHEET.columns);
    expect(frames).toEqual([0, 1, 2, 3, 0, 1]);
  });

  it('stays inside the sheet for every direction and pose', () => {
    for (let d = -8; d < 16; d++) {
      for (const pose of ['skate', 'glide', 'brake', 'windup', 'shoot', 'pass', 'check'] as const) {
        const { frame } = skaterFrame(d, pose, 3.7);
        expect(frame).toBeGreaterThanOrEqual(0);
        expect(frame).toBeLessThan(50);
      }
    }
  });

  it('picks poses by priority: shot, wind-up, brake, skate, glide', () => {
    expect(choosePose({ ...base, sinceShot: 0.1, charging: true })).toBe('shoot');
    expect(choosePose({ ...base, charging: true })).toBe('windup');
    expect(choosePose({ ...base, againstTravel: true })).toBe('brake');
    expect(choosePose({ ...base, againstTravel: true, speed: 10 })).toBe('skate');
    expect(choosePose(base)).toBe('skate');
    expect(choosePose({ ...base, pushing: false })).toBe('glide');
  });
});
