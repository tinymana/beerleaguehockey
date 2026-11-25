import { describe, expect, it } from 'vitest';
import { RINK } from '../src/match/sim/rink';
import { HEIGHTS, projectY, riseOf, worldScreenHeight } from '../src/match/view/projection';

describe('angled overhead projection', () => {
  it('is a straight-down view at tilt 1: no foreshortening, nothing stands up', () => {
    expect(projectY(440, 1)).toBe(440);
    expect(riseOf(HEIGHTS.boards, 1)).toBe(0);
    expect(worldScreenHeight(RINK.worldHeight, 1)).toBe(RINK.worldHeight);
  });

  it('foreshortens distance up the ice and raises tall things as the camera flattens', () => {
    expect(projectY(100, 0.8)).toBeCloseTo(80, 6);
    expect(riseOf(10, 0.8)).toBeCloseTo(6, 6);
    expect(riseOf(HEIGHTS.boards, 0.7)).toBeGreaterThan(riseOf(HEIGHTS.boards, 0.9));
    expect(worldScreenHeight(RINK.worldHeight, 0.78)).toBeLessThan(RINK.worldHeight);
  });

  it('keeps left-right distances and screen order unchanged', () => {
    for (const tilt of [0.6, 0.78, 1]) {
      expect(projectY(200, tilt)).toBeLessThan(projectY(600, tilt));
    }
  });

  it('never returns an invalid rise outside the supported range', () => {
    expect(riseOf(16, 1.5)).toBe(0);
    expect(riseOf(16, -1)).toBe(16);
  });
});
