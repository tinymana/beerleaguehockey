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
  /** Half the outside width of the net, post to post: the collision width. */
  netHalfWidth: number;
  netDepth: number;
  /** Half the clear opening between the posts: what a puck must pass through to score. */
  mouthHalfWidth: number;
  postWidth: number;
  /** Height of the crossbar and of the back bar above the ice, for drawing. */
  netFrontHeight: number;
  netBackHeight: number;
  /** Distance from centre line to each blue line. */
  blueLineOffset: number;
}

/**
 * Goal dimensions. The creative director first approved a 48 px mouth against 48 px skaters (Decision 76), then,
 * after seeing both side by side, chose the smaller scale (Decision 80): a **32 px player and a 32 px goal mouth**,
 * the same proportion with more ice around the play. Everything else follows from the mouth width, so the picture,
 * the collision box and the scoring test can never disagree. All of it is data. Not locked until play-tested.
 */
export const GOAL_CONFIG = {
  /** Clear opening between the posts, in world pixels. */
  mouthWidth: 32,
  /** Values kept for testing. */
  testWidths: [32, 40, 48] as const,
  postWidth: 2,
  /** Depth behind the goal line as a share of the mouth (a real net is 44 in deep and 72 in wide). */
  depthRatio: 7 / 12,
  /** Crossbar and back-bar height as a share of the mouth (a real net is 48 in high). */
  heightRatio: 2 / 3,
  backHeightRatio: 5 / 12,
  /** Ice kept between the back of the net and the end boards, so play behind the net survives a bigger net. */
  clearanceBehind: 30,
};

/**
 * Everything on the ice that was sized for the 48 px player (the skater, his stick, the goalie, how high a shot
 * climbs) is scaled by this, so the proportions that were play-tested at 48 carry over to the smaller scale.
 */
export const PLAY_SCALE = GOAL_CONFIG.mouthWidth / 48;

export interface GoalDimensions {
  mouthWidth: number;
  outsideWidth: number;
  postWidth: number;
  depth: number;
  frontHeight: number;
  backHeight: number;
  goalLineInset: number;
}

export function goalDimensions(mouthWidth: number = GOAL_CONFIG.mouthWidth): GoalDimensions {
  const depth = Math.round(mouthWidth * GOAL_CONFIG.depthRatio);
  return {
    mouthWidth,
    outsideWidth: mouthWidth + GOAL_CONFIG.postWidth * 2,
    postWidth: GOAL_CONFIG.postWidth,
    depth,
    frontHeight: Math.round(mouthWidth * GOAL_CONFIG.heightRatio),
    backHeight: Math.round(mouthWidth * GOAL_CONFIG.backHeightRatio),
    goalLineInset: GOAL_CONFIG.clearanceBehind + depth,
  };
}

export function makeRink(mouthWidth: number = GOAL_CONFIG.mouthWidth): RinkGeometry {
  const goal = goalDimensions(mouthWidth);
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
    goalLineInset: goal.goalLineInset,
    netHalfWidth: goal.outsideWidth / 2,
    netDepth: goal.depth,
    mouthHalfWidth: goal.mouthWidth / 2,
    postWidth: goal.postWidth,
    netFrontHeight: goal.frontHeight,
    netBackHeight: goal.backHeight,
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
