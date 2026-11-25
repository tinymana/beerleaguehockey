import { describe, expect, it } from 'vitest';
import { SKATER_MARGIN, cameraTargetY, stepCamera } from '../src/match/view/cameraModel';

const VIEW = 320;
const WORLD = 880;
const still = { skaterY: 440, skaterVy: 0, puckY: 440, puckVy: 0, hasPuck: true };

describe('camera', () => {
  it('centres on the skater at rest', () => {
    expect(cameraTargetY(still, 0.35, VIEW, WORLD)).toBe(440);
  });

  it('leads in the direction of travel', () => {
    expect(cameraTargetY({ ...still, skaterVy: -150, puckVy: -150 }, 0.35, VIEW, WORLD)).toBeLessThan(440);
    expect(cameraTargetY({ ...still, skaterVy: 150, puckVy: 150 }, 0.35, VIEW, WORLD)).toBeGreaterThan(440);
  });

  it('follows a loose puck up the ice', () => {
    expect(cameraTargetY({ ...still, hasPuck: false, puckY: 240 }, 0, VIEW, WORLD)).toBeLessThan(440);
  });

  it('always keeps the skater on screen, even when the puck is at the far end', () => {
    for (const puckY of [60, 300, 820]) {
      for (const skaterY of [60, 440, 820]) {
        const centre = cameraTargetY({ skaterY, skaterVy: 0, puckY, puckVy: -500, hasPuck: false }, 1, VIEW, WORLD);
        expect(Math.abs(skaterY - centre)).toBeLessThanOrEqual(VIEW / 2 - SKATER_MARGIN + 1e-9);
      }
    }
  });

  it('never shows beyond the ends of the world', () => {
    expect(cameraTargetY({ ...still, skaterY: 10, puckY: 10 }, 0.35, VIEW, WORLD)).toBe(VIEW / 2);
    expect(cameraTargetY({ ...still, skaterY: 870, puckY: 870 }, 0.35, VIEW, WORLD)).toBe(WORLD - VIEW / 2);
  });

  it('eases toward the target at a frame-rate independent pace', () => {
    let oneBigStep = 0;
    oneBigStep = stepCamera(oneBigStep, 100, 6, 1 / 30);
    let twoSmallSteps = 0;
    twoSmallSteps = stepCamera(twoSmallSteps, 100, 6, 1 / 60);
    twoSmallSteps = stepCamera(twoSmallSteps, 100, 6, 1 / 60);
    expect(oneBigStep).toBeCloseTo(twoSmallSteps, 6);
    expect(oneBigStep).toBeGreaterThan(0);
    expect(oneBigStep).toBeLessThan(100);
  });
});
