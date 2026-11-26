import { describe, expect, it } from 'vitest';
import { GOAL_CONFIG, RINK, goalDimensions, goalLineY, makeRink, netBox } from '../src/match/sim/rink';
import { SkatingSim } from '../src/match/sim/skatingSim';
import { cloneTuning } from '../src/match/sim/tuning';
import { netLayout, netScreenAnchor } from '../src/match/view/textures';

describe('the goal (Decision 76)', () => {
  it('has a 48 px mouth as the baseline, with 40 kept as a test value, all derived from one number', () => {
    expect(GOAL_CONFIG.mouthWidth).toBe(48);
    expect([...GOAL_CONFIG.testWidths]).toEqual([40, 48]);
    expect(goalDimensions(48)).toEqual({ mouthWidth: 48, outsideWidth: 52, postWidth: 2, depth: 28, frontHeight: 32, backHeight: 20, goalLineInset: 58 });
    expect(goalDimensions(40)).toEqual({ mouthWidth: 40, outsideWidth: 44, postWidth: 2, depth: 23, frontHeight: 27, backHeight: 17, goalLineInset: 53 });
    expect(RINK.mouthHalfWidth * 2).toBe(48);
    expect(RINK.netHalfWidth * 2).toBe(52);
  });

  it('keeps the same ice behind the net as before, and mirrors north and south exactly', () => {
    for (const width of GOAL_CONFIG.testWidths) {
      const rink = makeRink(width);
      const north = netBox(rink, 'top');
      const south = netBox(rink, 'bottom');
      expect(north.top - rink.top).toBe(GOAL_CONFIG.clearanceBehind);
      expect(rink.bottom - south.bottom).toBe(GOAL_CONFIG.clearanceBehind);
      expect(north.bottom).toBe(goalLineY(rink, 'top'));
      expect(south.top).toBe(goalLineY(rink, 'bottom'));
      expect([north.left, north.right]).toEqual([south.left, south.right]);
      expect(north.right - north.left).toBe(width + 4);
      expect(north.bottom - north.top).toBe(south.bottom - south.top);
      expect((north.left + north.right) / 2).toBe(rink.centerX);
    }
  });

  it('draws the stand-in net exactly as wide as the collision box, at the same place', () => {
    for (const width of GOAL_CONFIG.testWidths) {
      const rink = makeRink(width);
      for (const end of ['top', 'bottom'] as const) {
        expect(netLayout(rink, end, 0.74).width).toBe(netBox(rink, end).right - netBox(rink, end).left);
        expect(netScreenAnchor(rink, end, 0.74).x).toBe(netBox(rink, end).left);
      }
    }
  });

  const shoot = (width: number, end: 'top' | 'bottom', offset: number): { goals: number; state: string } => {
    const rink = makeRink(width);
    const sim = new SkatingSim(cloneTuning(), rink);
    const line = goalLineY(rink, end);
    const dir = end === 'top' ? -1 : 1;
    const p = sim.puck as unknown as { x: number; y: number; vx: number; vy: number; state: string; carrier?: unknown };
    p.state = 'free';
    p.x = rink.centerX + offset;
    p.y = line - dir * 30;
    p.vx = 0;
    p.vy = dir * 300;
    const idle = { x: 0, y: 0, shoot: false, turbo: false } as never;
    for (let i = 0; i < 40 && sim.goals === 0; i++) sim.step(idle);
    return { goals: sim.goals, state: p.state };
  };

  it('scores through the mouth and not through a post, the same at both ends and both widths', () => {
    for (const width of GOAL_CONFIG.testWidths) {
      for (const end of ['top', 'bottom'] as const) {
        expect(shoot(width, end, 0).goals, `${width} ${end} centre`).toBe(1);
        expect(shoot(width, end, width / 2 - 3).goals, `${width} ${end} inside right post`).toBe(1);
        expect(shoot(width, end, -(width / 2 - 3)).goals, `${width} ${end} inside left post`).toBe(1);
        expect(shoot(width, end, width / 2 + 1).goals, `${width} ${end} on the post`).toBe(0);
        expect(shoot(width, end, width / 2 + 12).goals, `${width} ${end} wide`).toBe(0);
      }
    }
  });
});
