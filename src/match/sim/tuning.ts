/**
 * Gameplay tuning values for the skating prototype.
 *
 * Units: distances are logical pixels (4 px is about 1 foot of ice), time is
 * seconds. Everything here is data, exposed live in the developer tuning
 * panel. Nothing in the simulation hard-codes a feel value.
 */

export interface Tuning {
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  turnResponse: number;
  iceFriction: number;
  puckFriction: number;
  pickupRadius: number;
  shotVelocity: number;
  boardRestitution: number;
  cameraFollow: number;
  cameraLookahead: number;
  /** View only: vertical foreshortening of the ice. 1 = straight down. */
  cameraTilt: number;
}

export const DEFAULT_TUNING: Readonly<Tuning> = Object.freeze({
  maxSpeed: 175,
  acceleration: 420,
  deceleration: 620,
  turnResponse: 6,
  iceFriction: 0.55,
  puckFriction: 0.45,
  pickupRadius: 9,
  shotVelocity: 560,
  boardRestitution: 0.65,
  cameraFollow: 6,
  cameraLookahead: 0.35,
  cameraTilt: 0.74,
});

export interface TuningSpec {
  key: keyof Tuning;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  help: string;
}

export const TUNING_SPECS: readonly TuningSpec[] = [
  { key: 'maxSpeed', label: 'Max skating speed', unit: 'px/s', min: 60, max: 360, step: 5, help: 'Top speed at full stride.' },
  { key: 'acceleration', label: 'Acceleration', unit: 'px/s2', min: 80, max: 1600, step: 20, help: 'How fast speed builds while a direction is held.' },
  { key: 'deceleration', label: 'Deceleration', unit: 'px/s2', min: 80, max: 2400, step: 20, help: 'Braking when the stick is pushed against travel.' },
  { key: 'turnResponse', label: 'Turning responsiveness', unit: '1/s', min: 0.5, max: 20, step: 0.5, help: 'How fast sideways slide is shed in a turn. Low is slippery, high is on rails.' },
  { key: 'iceFriction', label: 'Ice friction', unit: '1/s', min: 0, max: 4, step: 0.05, help: 'Glide drag with no direction held. Low means long glides.' },
  { key: 'puckFriction', label: 'Puck friction', unit: '1/s', min: 0, max: 3, step: 0.05, help: 'How quickly a loose puck slows.' },
  { key: 'pickupRadius', label: 'Puck pickup radius', unit: 'px', min: 3, max: 24, step: 0.5, help: 'Distance from the stick blade at which a loose puck is collected.' },
  { key: 'shotVelocity', label: 'Shot velocity', unit: 'px/s', min: 150, max: 1200, step: 10, help: 'Puck speed of a fully wound-up shot.' },
  { key: 'boardRestitution', label: 'Board restitution', unit: '0-1', min: 0, max: 1, step: 0.05, help: 'Share of speed the puck keeps bouncing off the boards.' },
  { key: 'cameraFollow', label: 'Camera follow', unit: '1/s', min: 1, max: 20, step: 0.5, help: 'How tightly the camera tracks the play.' },
  { key: 'cameraLookahead', label: 'Camera look-ahead', unit: 's', min: 0, max: 1, step: 0.05, help: 'How far the camera leads in the direction of travel.' },
  { key: 'cameraTilt', label: 'Camera tilt', unit: '0.6-1', min: 0.6, max: 1, step: 0.02, help: 'Angle of the overhead camera. 1 looks straight down; lower flattens the view and raises boards and nets. Redraws the rink.' },
];

/**
 * Secondary feel constants. Not yet in the panel; promoted there when they
 * prove worth tuning live.
 */
export const FEEL = Object.freeze({
  skaterRadius: 7,
  puckRadius: 2,
  /** Distance from skater centre to stick blade. */
  stickReach: 13,
  /** Seconds of wind-up for a full-power shot. */
  maxChargeTime: 0.6,
  /** Share of shot velocity for an instant tap (wrist shot). */
  minShotFactor: 0.55,
  /** Share of skater velocity added to a shot. */
  shotInherit: 0.3,
  /** Seconds after a shot before the shooter can re-collect the puck. */
  pickupCooldown: 0.35,
  /** A puck moving faster than this relative to the skater cannot be collected. */
  pickupMaxRelativeSpeed: 420,
  /** Radians per second the skater's body rotates toward the held direction. */
  facingTurnRate: 16,
  skaterBoardRestitution: 0.1,
  /** Speed below which a gliding skater comes to rest. */
  restSpeed: 2,
  /** Seconds the puck sits in the net after a goal before returning to centre. */
  goalPause: 1.3,
});

export function cloneTuning(source: Readonly<Tuning> = DEFAULT_TUNING): Tuning {
  return { ...source };
}
