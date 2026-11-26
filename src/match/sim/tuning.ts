import { PLAY_SCALE } from './rink';
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
  pickupRadius: 9 * PLAY_SCALE,
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
  skaterRadius: 7 * PLAY_SCALE,
  puckRadius: 2,
  /** Distance from skater centre to stick blade. */
  stickReach: 13 * PLAY_SCALE,
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

/** Shooting and puck flight for the Milestone 1 prototype (Decision 78). Starting values for hands-on testing, not balance. */
export const SHOOT = {
  /** Wind-up, as a share of a full one, at which a shot becomes a slap shot. */
  slapThreshold: 0.5,
  releaseHeight: 1,
  /** How fast each shot climbs off the blade. A wrist shot rises; a slap shot stays low. */
  // Lift and gravity shrink with the net, so a shot climbs the same share of the crossbar's height at any scale.
  wristLift: 90 * PLAY_SCALE,
  slapLift: 50 * PLAY_SCALE,
  gravity: 120 * PLAY_SCALE,
  /** Slowing while airborne (the ice slows it far more once it lands). */
  airDrag: 0.15,
  /** Half the thickness of the crossbar, in height. */
  barThickness: 1.5 * PLAY_SCALE,
  ironRestitution: 0.55,
  /** A loose puck faster than this counts as a shot for a goalie's reaction clock. */
  launchSpeed: 150,
} as const;

/**
 * Shot aim help (creative director feedback, Nov 26: corner shots are hard to aim on a keyboard).
 * Starting values for hands-on testing. Applies to every skater, the computer's included.
 */
export const AIM = {
  /** Only this close to the goal line, in px. */
  range: 200,
  /** The biggest change of direction the help will make, in radians. Beyond it the shot goes where the stick points. */
  maxTurn: 0.9,
  /** How far inside the post the aim point is, beyond the puck's own radius. */
  cornerInset: 1.5,
  /** The aim point lands anywhere within this many px either side of the corner: some shots find the post or the goalie. */
  spread: 6,
};

/** The 5-on-5 test game: passing and puck battles. Starting values for hands-on testing, not balance. */
export const TEAM = {
  passSpeed: 330,
  /** Teammates nearer or farther than this are not passing targets. */
  passMin: 14,
  passMax: 300,
  /** How closely a teammate must line up with the stick or held direction (cosine). */
  passCone: 0.45,
  /** Seconds of the receiver's travel a pass allows for, at most. */
  passLead: 0.6,
  /** Seconds a receiver keeps going to a pass. */
  passWatch: 1.5,
  /** An opponent's blade or body this close to a carried puck knocks it loose. */
  pokeRadius: 9 * PLAY_SCALE,
  pokeSpeed: 70,
  /** Seconds before the same skater can poke again, before the old carrier can pick it back up, and of safety after gaining the puck. */
  pokeCooldown: 0.9,
  strippedCooldown: 0.5,
  pokeGrace: 0.3,
  /** A puck higher than this goes over the skaters' sticks. */
  pickupHeight: 6 * PLAY_SCALE,
};
