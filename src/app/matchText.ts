/**
 * The words on the goal card, the penalty card and the scoring summary. Pure: no Phaser here, so they can be tested.
 * Plain text until the broadcast graphics are re-issued (Decision 86).
 */
import { fullLine, shortLine } from '../dynasty/pickupRoster';
import type { RosterPlayer } from '../dynasty/pickupRoster';
import { clockText, periodText } from '../match/sim/match';
import type { GoalRecord, MatchState, Penalty } from '../match/sim/match';

const side = (team: 0 | 1): string => (team === 0 ? 'Home' : 'Away');
const cap = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

/** Four lines: who scored, who helped, when, and the score. */
/** The tag under a skater on the ice: "19 Kowalski". Short, because it moves with him. */
export function nameTag(roster: readonly RosterPlayer[], index: number): string {
  const p = roster[index];
  return p ? `${p.number} ${p.last}` : '';
}

/** The tag under the teammate a pass would go to: his number only. */
export function numberTag(roster: readonly RosterPlayer[], index: number): string {
  const p = roster[index];
  return p ? `${p.number}` : '';
}

export function goalCardLines(m: MatchState, goal: GoalRecord, roster: readonly RosterPlayer[], score: readonly [number, number]): string[] {
  const who = roster[goal.scorer];
  // His goals tonight, counting this one.
  const tally = m.goals.filter((g) => g.scorer === goal.scorer && goal.scorer >= 0).length;
  const helpers = goal.assists.map((i) => roster[i]).filter((p): p is RosterPlayer => p !== undefined);
  return [
    `${side(goal.team)} goal${goal.powerPlay ? '  -  power play' : ''}`,
    who ? `${fullLine(who)} (${tally})` : 'Off a defender',
    helpers.length ? `Assists: ${helpers.map((p) => `#${p.number} ${p.last}`).join(', ')}` : who ? 'Unassisted' : '',
    `${periodText(goal.period)} ${clockText(goal.time)}     Home ${score[0]}  Away ${score[1]}`,
  ];
}

/** Four lines: who is going to the box, what for, and for how long. */
export function penaltyCardLines(m: MatchState, pen: Penalty, roster: readonly RosterPlayer[]): string[] {
  const who = roster[pen.skater];
  return [`${side(pen.team)} penalty`, who ? fullLine(who) : `${side(pen.team)} skater`, cap(pen.foul), `2 minutes     ${periodText(m.period)} ${clockText(m.clock)}`];
}

/** The line under the scorebug while penalties are being served: "#19 Kowalski tripping 0:14". */
export function penaltyClockLine(m: MatchState, roster: readonly RosterPlayer[]): string {
  return m.penalties
    .map((p) => {
      const who = roster[p.skater];
      return `${who ? `#${who.number} ${who.last}` : side(p.team)} ${p.foul} ${clockText(p.left)}`;
    })
    .join('   ');
}

/** One goal on the summary: "1st 2:49 Home #93 E. Sanddal (#17, #5) PP". */
export function scoringLine(goal: GoalRecord, roster: readonly RosterPlayer[]): string {
  const who = roster[goal.scorer];
  const helpers = goal.assists.map((i) => roster[i]).filter((p): p is RosterPlayer => p !== undefined);
  const assists = helpers.length ? ` (${helpers.map((p) => `#${p.number}`).join(', ')})` : '';
  return `${periodText(goal.period)} ${clockText(goal.time)} ${side(goal.team)} ${who ? shortLine(who) : 'off a defender'}${assists}${goal.powerPlay ? ' PP' : ''}`;
}

/** The goals for the summary panel, newest last, in at most `rows` lines: older goals fold into a count. */
export function scoringLines(m: MatchState, roster: readonly RosterPlayer[], rows: number): string[] {
  if (!m.goals.length) return ['No scoring'];
  if (m.goals.length <= rows) return m.goals.map((g) => scoringLine(g, roster));
  const shown = m.goals.slice(-(rows - 1));
  return [`${m.goals.length - shown.length} earlier goals`, ...shown.map((g) => scoringLine(g, roster))];
}
