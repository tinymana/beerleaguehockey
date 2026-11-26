import { describe, expect, it } from 'vitest';
import { profileFit } from '../src/app/stage';
import { TOUCH, gameArea, stickVector } from '../src/app/touchModel';

describe('touch controls (creative director, Nov 26: mobile, landscape and portrait)', () => {
  it('reads the stick: nothing inside the dead zone, full tilt at the edge and beyond, direction kept', () => {
    expect(stickVector(0, 0)).toEqual({ x: 0, y: 0 });
    expect(stickVector(TOUCH.stickRadius * TOUCH.deadZone * 0.9, 0)).toEqual({ x: 0, y: 0 });
    expect(stickVector(TOUCH.stickRadius, 0).x).toBeCloseTo(1, 6);
    expect(stickVector(TOUCH.stickRadius * 3, 0).x).toBeCloseTo(1, 6);
    const diag = stickVector(-200, 200);
    expect(diag.x).toBeCloseTo(-Math.SQRT1_2, 6);
    expect(diag.y).toBeCloseTo(Math.SQRT1_2, 6);
    const half = stickVector(0, -TOUCH.stickRadius / 2);
    expect(half.y).toBeCloseTo(-0.5, 6);
  });

  it('held sideways the game keeps the whole screen; held upright it gets the top and the controls the rest', () => {
    expect(gameArea(844, 390, true)).toEqual({ width: 844, height: 390, portrait: false });
    const upright = gameArea(390, 844, true);
    expect(upright.portrait).toBe(true);
    expect(upright.width).toBe(390);
    expect(844 - upright.height).toBeGreaterThanOrEqual(TOUCH.portraitMin);
    // The ice still fits in what is left, whole.
    const fit = profileFit('ice', upright.width, upright.height);
    expect(320 * fit.shrink).toBeLessThanOrEqual(upright.height);
    expect(480 * fit.shrink).toBeLessThanOrEqual(390);
    // No touch, or not playing: nothing is taken away, whichever way up.
    expect(gameArea(390, 844, false)).toEqual({ width: 390, height: 844, portrait: false });
  });

  it('keeps room for the controls on a short upright screen', () => {
    const small = gameArea(320, 480, true);
    expect(480 - small.height).toBeGreaterThanOrEqual(TOUCH.portraitMin);
    expect(small.height).toBeGreaterThanOrEqual(120);
  });
});
