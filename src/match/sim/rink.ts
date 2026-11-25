/**
 * Rink geometry and collision. Pure functions, no rendering.
 *
 * The rink is vertical: goals at the top and bottom of the world.
 * Scale is 4 logical pixels per foot (NHL-proportioned 200 x 85 ft sheet).
 */

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type RinkEnd = 'top' | 'bottom';

export interface RinkGeometry {
  worldWidth: number;
  worldHeight: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  cornerRadius: number;
  centerX: number;
  centerY: number;
  /** Distance from end boards to the goal line. */
  goalLineInset: number;
  netHalfWidth: number;
  netDepth: number;
  /** Distance from centre line to each blue line. */
  blueLineOffset: number;
}

export function makeRink(): RinkGeometry {
  const worldWidth = 480;
  const worldHeight = 880;
  const width = 340;
  const height = 800;
  const left = (worldWidth - width) / 2;
  const top = (worldHeight - height) / 2;
  return {
    worldWidth,
    worldHeight,
    left,
    top,
    right: left + width,
    bottom: top + height,
    cornerRadius: 112,
    centerX: worldWidth / 2,
    centerY: worldHeight / 2,
    goalLineInset: 44,
    netHalfWidth: 12,
    netDepth: 14,
    blueLineOffset: 100,
  };
}

export const RINK: Readonly<RinkGeometry> = Object.freeze(makeRink());

export function goalLineY(rink: RinkGeometry, end: RinkEnd): number {
  return end === 'top' ? rink.top + rink.goalLineInset : rink.bottom - rink.goalLineInset;
}

export function netBox(rink: RinkGeometry, end: RinkEnd): Box {
  const line = goalLineY(rink, end);
  return {
    left: rink.centerX - rink.netHalfWidth,
    right: rink.centerX + rink.netHalfWidth,
    top: end === 'top' ? line - rink.netDepth : line,
    bottom: end === 'top' ? line : line + rink.netDepth,
  };
}

/**
 * Keep a circular body inside the rounded-rectangle boards.
 * Returns the speed into the boards at impact (0 when there was no contact).
 */
export function collideWithBoards(body: Body, radius: number, restitution: number, rink: RinkGeometry): number {
  const cr = rink.cornerRadius;
  const inCornerX = body.x < rink.left + cr || body.x > rink.right - cr;
  const inCornerY = body.y < rink.top + cr || body.y > rink.bottom - cr;

  if (inCornerX && inCornerY) {
    const cx = body.x < rink.left + cr ? rink.left + cr : rink.right - cr;
    const cy = body.y < rink.top + cr ? rink.top + cr : rink.bottom - cr;
    const dx = body.x - cx;
    const dy = body.y - cy;
    const dist = Math.hypot(dx, dy);
    const maxDist = cr - radius;
    if (dist <= maxDist || dist === 0) return 0;
    const nx = dx / dist;
    const ny = dy / dist;
    body.x = cx + nx * maxDist;
    body.y = cy + ny * maxDist;
    const vn = body.vx * nx + body.vy * ny;
    if (vn <= 0) return 0;
    body.vx -= (1 + restitution) * vn * nx;
    body.vy -= (1 + restitution) * vn * ny;
    return vn;
  }

  let impact = 0;
  if (body.x < rink.left + radius) {
    body.x = rink.left + radius;
    if (body.vx < 0) {
      impact = Math.max(impact, -body.vx);
      body.vx = -body.vx * restitution;
    }
  } else if (body.x > rink.right - radius) {
    body.x = rink.right - radius;
    if (body.vx > 0) {
      impact = Math.max(impact, body.vx);
      body.vx = -body.vx * restitution;
    }
  }
  if (body.y < rink.top + radius) {
    body.y = rink.top + radius;
    if (body.vy < 0) {
      impact = Math.max(impact, -body.vy);
      body.vy = -body.vy * restitution;
    }
  } else if (body.y > rink.bottom - radius) {
    body.y = rink.bottom - radius;
    if (body.vy > 0) {
      impact = Math.max(impact, body.vy);
      body.vy = -body.vy * restitution;
    }
  }
  return impact;
}

/**
 * Push a circular body out of a solid box, using where it was last step to
 * decide which face it hit. Returns true on contact.
 */
export function collideWithBox(
  body: Body,
  prevX: number,
  prevY: number,
  radius: number,
  restitution: number,
  box: Box,
): boolean {
  const left = box.left - radius;
  const right = box.right + radius;
  const top = box.top - radius;
  const bottom = box.bottom + radius;
  if (body.x <= left || body.x >= right || body.y <= top || body.y >= bottom) return false;

  type Face = 'left' | 'right' | 'top' | 'bottom';
  let face: Face;
  if (prevX <= left) face = 'left';
  else if (prevX >= right) face = 'right';
  else if (prevY <= top) face = 'top';
  else if (prevY >= bottom) face = 'bottom';
  else {
    const gaps: Array<[Face, number]> = [
      ['left', body.x - left],
      ['right', right - body.x],
      ['top', body.y - top],
      ['bottom', bottom - body.y],
    ];
    gaps.sort((a, b) => a[1] - b[1]);
    face = (gaps[0] as [Face, number])[0];
  }

  switch (face) {
    case 'left':
      body.x = left;
      if (body.vx > 0) body.vx = -body.vx * restitution;
      break;
    case 'right':
      body.x = right;
      if (body.vx < 0) body.vx = -body.vx * restitution;
      break;
    case 'top':
      body.y = top;
      if (body.vy > 0) body.vy = -body.vy * restitution;
      break;
    case 'bottom':
      body.y = bottom;
      if (body.vy < 0) body.vy = -body.vy * restitution;
      break;
  }
  return true;
}
