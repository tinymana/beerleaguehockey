/**
 * Appearance: how a created player looks. A record of choices by stable id, and a compositor that turns the
 * record into what can actually be drawn today.
 *
 * The record is deliberately ahead of the art. Faces are finished preset portraits; the body is a flattened
 * grey model; hair, facial hair, skin tone, body type and equipment are stored and shown as reference picks,
 * but there are no layers yet to draw them on the player. The compositor says so for each part instead of
 * pretending: `drawn` lists what the game can draw, `stored` what is remembered for when layers arrive.
 *
 * Appearance never changes an attribute.
 */
import type { Position } from './attributes';
import { APPEARANCE_CATALOG } from './data/appearanceCatalog';

export const APPEARANCE_VERSION = 1;

export type AppearancePart = 'face' | 'hair' | 'facialHair' | 'skinTone' | 'bodyType';
export const EQUIPMENT_SLOTS = ['protection', 'stick', 'skate', 'sock', 'accessory'] as const;
export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];

export interface AppearanceRecord {
  version: number;
  /** A preset portrait: "face:face_07" or "bald:bald_12". */
  face: string;
  hair: string | null;
  facialHair: string | null;
  skinTone: string;
  bodyType: string;
  equipment: Partial<Record<EquipmentSlot, string>>;
  /** ISO three-letter country code, or null for unspecified. */
  nationality: string | null;
}

export interface CatalogOption {
  id: string;
  label: string;
  /** Key into the character frame manifest ("face:face_07"), when there is a picture. */
  frame?: string;
}

const number = (id: string): string => id.replace(/^.*?(\d+)$/, '$1').replace(/^0+/, '') || id;
const title = (id: string): string => id.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** What each part can be set to. Hair and facial hair may also be none. */
export function optionsFor(part: AppearancePart): CatalogOption[] {
  const c = APPEARANCE_CATALOG;
  switch (part) {
    case 'face':
      return [
        ...c.face.items.map((i) => ({ id: `face:${i.id}`, label: `Face ${number(i.id)}`, frame: `face:${i.id}` })),
        ...c.bald.items.map((i) => ({ id: `bald:${i.id}`, label: `Bald ${number(i.id)}`, frame: `bald:${i.id}` })),
      ];
    case 'hair':
      return c.hair.items.filter((i) => i.category === 'hair').map((i) => ({ id: i.id, label: `Hair ${number(i.id)}`, frame: `hair:${i.id}` }));
    case 'facialHair':
      return c.beard.items.map((i) => ({ id: i.id, label: `Beard ${number(i.id)}`, frame: `beard:${i.id}` }));
    case 'skinTone':
      return c.skin.items.map((i) => ({ id: i.id, label: `Tone ${number(i.id)}` }));
    case 'bodyType':
      return c.body.items.map((i) => ({ id: i.id, label: title(i.id), frame: `body:${i.id}` }));
  }
}

export function equipmentOptions(slot: EquipmentSlot): CatalogOption[] {
  return APPEARANCE_CATALOG.equipment.items.filter((i) => i.category === slot).map((i) => ({ id: i.id, label: `${title(slot)} ${number(i.id)}`, frame: `equipment:${i.id}` }));
}

export interface Nationality {
  code: string;
  name: string;
}

export const NATIONALITIES: readonly Nationality[] = APPEARANCE_CATALOG.flag.items.map((i) => ({ code: i.id, name: i.name }));
const NATIONALITY_BY_CODE = new Map(NATIONALITIES.map((n) => [n.code, n]));

export function nationalityByCode(code: string | null): Nationality | undefined {
  return code ? NATIONALITY_BY_CODE.get(code) : undefined;
}

/** Skin tone colours for a tone id: data only, until skin masks exist to apply them to. */
export function skinToneColors(id: string): Record<string, string> | undefined {
  return APPEARANCE_CATALOG.skin.items.find((i) => i.id === id)?.colors;
}

export function defaultAppearance(): AppearanceRecord {
  return {
    version: APPEARANCE_VERSION,
    face: optionsFor('face')[0]?.id ?? '',
    hair: null,
    facialHair: null,
    skinTone: optionsFor('skinTone')[0]?.id ?? '',
    bodyType: optionsFor('bodyType').find((o) => o.id === 'average')?.id ?? optionsFor('bodyType')[0]?.id ?? '',
    equipment: {},
    nationality: null,
  };
}

const has = (options: CatalogOption[], id: string | null): boolean => id !== null && options.some((o) => o.id === id);

export function appearanceProblems(record: AppearanceRecord): string[] {
  const problems: string[] = [];
  if (record.version !== APPEARANCE_VERSION) problems.push(`appearance version ${record.version}`);
  if (!has(optionsFor('face'), record.face)) problems.push(`unknown face ${record.face}`);
  if (record.hair !== null && !has(optionsFor('hair'), record.hair)) problems.push(`unknown hair ${record.hair}`);
  if (record.facialHair !== null && !has(optionsFor('facialHair'), record.facialHair)) problems.push(`unknown facial hair ${record.facialHair}`);
  if (!has(optionsFor('skinTone'), record.skinTone)) problems.push(`unknown skin tone ${record.skinTone}`);
  if (!has(optionsFor('bodyType'), record.bodyType)) problems.push(`unknown body type ${record.bodyType}`);
  for (const [slot, id] of Object.entries(record.equipment)) {
    if (!(EQUIPMENT_SLOTS as readonly string[]).includes(slot)) problems.push(`unknown equipment slot ${slot}`);
    else if (!has(equipmentOptions(slot as EquipmentSlot), id ?? null)) problems.push(`unknown ${slot} ${String(id)}`);
  }
  if (record.nationality !== null && !nationalityByCode(record.nationality)) problems.push(`unknown nationality ${record.nationality}`);
  return problems;
}

/**
 * Read an appearance from a save, repairing rather than refusing: appearance is editable at any time and holds
 * no rolled values, so an id the art no longer has falls back to the default for that part (the fallback chain).
 */
export function repairAppearance(raw: unknown): AppearanceRecord {
  const base = defaultAppearance();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppearanceRecord>;
  const pick = (options: CatalogOption[], id: unknown, fallback: string): string => (typeof id === 'string' && has(options, id) ? id : fallback);
  const orNull = (options: CatalogOption[], id: unknown): string | null => (typeof id === 'string' && has(options, id) ? id : null);
  const equipment: Partial<Record<EquipmentSlot, string>> = {};
  for (const slot of EQUIPMENT_SLOTS) {
    const id = (r.equipment as Record<string, unknown> | undefined)?.[slot];
    if (typeof id === 'string' && has(equipmentOptions(slot), id)) equipment[slot] = id;
  }
  return {
    version: APPEARANCE_VERSION,
    face: pick(optionsFor('face'), r.face, base.face),
    hair: orNull(optionsFor('hair'), r.hair),
    facialHair: orNull(optionsFor('facialHair'), r.facialHair),
    skinTone: pick(optionsFor('skinTone'), r.skinTone, base.skinTone),
    bodyType: pick(optionsFor('bodyType'), r.bodyType, base.bodyType),
    equipment,
    nationality: typeof r.nationality === 'string' && nationalityByCode(r.nationality) ? r.nationality : null,
  };
}

export interface ComposedLayer {
  /** What this layer is. */
  part: string;
  /** Key into the character frame manifest. */
  frame: string;
}

export interface ComposedAppearance {
  /** The portrait, as layers in drawing order. One layer today: the preset face. */
  portrait: ComposedLayer[];
  /** The full-body preview, as layers in drawing order. One layer today: the grey model for the position. */
  body: ComposedLayer[];
  /** The flag, when a nationality is set. */
  flag: ComposedLayer | null;
  /** Choices that are remembered but cannot be drawn on the player yet, with the reason. */
  stored: { part: string; id: string; reason: string }[];
}

export type BodyView = 'front' | 'right' | 'rear' | 'left';

/**
 * The compositor. Layer order when layered art exists (the brief's order): body, skin, head, features, brows,
 * hair, facial hair, jersey and pants, team branding, number and name, equipment, accessories.
 * Today each list has the one flattened layer the art supplies, and everything else is reported in `stored`.
 */
export function composeAppearance(record: AppearanceRecord, position: Position, view: BodyView = 'front'): ComposedAppearance {
  const r = repairAppearance(record);
  const model = position === 'goalie' ? 'goalie' : 'skater';
  const stored: ComposedAppearance['stored'] = [];
  const noLayers = 'no layer art yet: batch 16 supplies this as reference only';
  if (r.hair) stored.push({ part: 'hair', id: r.hair, reason: noLayers });
  if (r.facialHair) stored.push({ part: 'facialHair', id: r.facialHair, reason: noLayers });
  stored.push({ part: 'skinTone', id: r.skinTone, reason: 'no skin masks yet: the tone ramps are data with nothing to apply them to' });
  stored.push({ part: 'bodyType', id: r.bodyType, reason: 'one body model exists: body types are reference concepts' });
  for (const slot of EQUIPMENT_SLOTS) {
    const id = r.equipment[slot];
    if (id) stored.push({ part: `equipment.${slot}`, id, reason: 'thumbnails only: nothing is drawn on the model' });
  }
  return {
    portrait: [{ part: 'face', frame: r.face }],
    body: [{ part: 'body', frame: `model:${model}_${view}` }],
    flag: r.nationality ? { part: 'flag', frame: `flag:${r.nationality}` } : null,
    stored,
  };
}
