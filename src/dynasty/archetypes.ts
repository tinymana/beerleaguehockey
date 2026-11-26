/**
 * Beer League Archetypes: who a player is in the room (Decision 44, registry approved in Decision 54).
 *
 * An archetype never changes an attribute, a ceiling, a development rate or a simulation roll.
 * Only the starting archetypes are here: they are what the creator needs. The career-evolved ones
 * (AR20 to AR30) are approved as a registry but their rules wait for the systems they depend on.
 */
import type { Position } from './attributes';

export interface StartingArchetype {
  id: string;
  name: string;
  description: string;
  /** Backgrounds that make this archetype available; empty means any. */
  backgrounds: readonly string[];
  /** Positions that make this archetype available; empty means any. */
  positions: readonly Position[];
}

export const STARTING_ARCHETYPES: readonly StartingArchetype[] = [
  { id: 'AR01', name: 'Rookie', description: 'New skates, no idea where to stand, tapes his stick wrong.', backgrounds: [], positions: [] },
  { id: 'AR02', name: 'Pond Hockey Kid', description: 'Learned outdoors. Great hands, has never heard of offside.', backgrounds: ['pond'], positions: [] },
  { id: 'AR03', name: 'Washed-Up Junior', description: 'Played junior, will tell you, peaked at 17.', backgrounds: ['junior'], positions: [] },
  { id: 'AR04', name: 'Rink Rat', description: 'Has been at this rink since he was six. Knows which shower works.', backgrounds: ['youth', 'highSchool'], positions: [] },
  { id: 'AR05', name: 'Roller Kid', description: 'Dangles for days. Cannot stop.', backgrounds: ['roller'], positions: [] },
  { id: 'AR06', name: 'Equipment Guy', description: 'Four sticks, three hundred dollars each. Cannot raise the puck.', backgrounds: [], positions: [] },
  { id: 'AR07', name: 'Emergency Goalie', description: 'Not really a goalie. Owns the gear. Gets the call anyway.', backgrounds: [], positions: ['goalie'] },
];

const BY_ID = new Map(STARTING_ARCHETYPES.map((a) => [a.id, a]));

export function startingArchetypeById(id: string): StartingArchetype | undefined {
  return BY_ID.get(id);
}

export function startingArchetypesFor(position: Position, background: string): StartingArchetype[] {
  return STARTING_ARCHETYPES.filter(
    (a) => (a.backgrounds.length === 0 || a.backgrounds.includes(background)) && (a.positions.length === 0 || a.positions.includes(position)),
  );
}
