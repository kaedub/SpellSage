import { CardPrintingSchema, OracleCardSchema } from '@shared/schemas';
import type { CardPrinting, CardFace, OracleCard } from '@shared/types';
import type { ScryfallCard, CardFace as ScryfallCardFace } from './types';

/** Words Scryfall uses as supertypes in `type_line` (for splitting only; not validated). */
const SUPERTYPES = new Set<string>([
    'Legendary',
    'Basic',
    'Snow',
    'World',
    'Ongoing',
]);

/** Words Scryfall uses as card types in `type_line` (for splitting only; not validated). */
const CARD_TYPES = new Set<string>([
    'Artifact',
    'Battle',
    'Conspiracy',
    'Creature',
    'Dungeon',
    'Enchantment',
    'Host',
    'Instant',
    'Kindred',
    'Land',
    'Phenomenon',
    'Plane',
    'Planeswalker',
    'Scheme',
    'Sorcery',
    'Tribal',
    'Vanguard',
]);

const ALLOWED_MANA_COLORS = new Set<string>(['W', 'U', 'B', 'R', 'G', 'C']);

function parseTypeLine(typeLine: string): {
    supertypes: string[];
    types: string[];
    subtypes: string[];
} {
    const [mainPart, subtypePart] = typeLine.split('—').map(s => s.trim());
    const words = mainPart?.split(/\s+/) ?? [];

    const supertypes: string[] = [];
    const types: string[] = [];

    for (const word of words) {
        if (SUPERTYPES.has(word)) {
            supertypes.push(word);
        } else if (CARD_TYPES.has(word)) {
            types.push(word);
        }
    }

    const subtypes = subtypePart
        ? subtypePart.split(/\s+/).filter(s => s.length > 0)
        : [];

    return { supertypes, types, subtypes };
}

function resolveImageUri(raw: ScryfallCard): string {
    if (raw.image_uris?.normal) {
        return raw.image_uris.normal;
    }
    if (raw.card_faces?.[0]?.image_uris?.normal) {
        return raw.card_faces[0].image_uris.normal;
    }
    return '';
}

function transformFace(face: ScryfallCardFace): CardFace {
    return {
        name: face.name,
        manaCost: face.mana_cost,
        typeLine: face.type_line ?? undefined,
        oracleText: face.oracle_text ?? undefined,
        colors: face.colors ?? undefined,
        power: face.power ?? undefined,
        toughness: face.toughness ?? undefined,
        imageUri: face.image_uris?.normal ?? undefined,
    };
}

function parseNumericStat(value: string | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isInteger(n) ? n : null;
}

function uniqueColors(faces: ScryfallCardFace[]): string[] {
    const seen = new Set<string>();
    for (const face of faces) {
        if (face.colors) {
            for (const c of face.colors) seen.add(c);
        }
    }
    return [...seen];
}

function normalizeProducedMana(rawProducedMana: unknown): string[] {
    if (!Array.isArray(rawProducedMana)) {
        return [];
    }

    const seen = new Set<string>();
    for (const mana of rawProducedMana) {
        if (typeof mana !== 'string') {
            continue;
        }
        if (!ALLOWED_MANA_COLORS.has(mana)) {
            continue;
        }
        seen.add(mana);
    }

    return [...seen];
}

function pickDisplayPrice(raw: ScryfallCard): string {
    const p = raw.prices;
    return p.usd ?? '???'
}

/** Shared print/oracle fields from a Scryfall `card` JSON object (default or oracle bulk). */
function scryfallCardShared(raw: ScryfallCard) {
    const front = raw.card_faces?.[0];

    const typeLine =
        raw.type_line ??
        (raw.card_faces
            ? raw.card_faces.map(f => f.type_line).join(' // ')
            : '');

    const { supertypes, types, subtypes } = parseTypeLine(
        front?.type_line ?? typeLine,
    );

    const colors = raw.colors ?? (front ? uniqueColors(raw.card_faces!) : []);

    return {
        id: raw.id,
        name: raw.name,
        set: raw.set,
        setId: raw.set_id,
        oracleId: raw.oracle_id,
        collectorNum: raw.collector_number,
        typeLine,
        supertypes,
        types,
        subtypes,
        isLegendary: supertypes.includes('Legendary'),
        colors,
        colorIdentity: raw.color_identity ?? [],
        manaCost: raw.mana_cost ?? front?.mana_cost,
        cmc: raw.cmc ?? front?.cmc,
        oracleText: raw.oracle_text ?? front?.oracle_text ?? undefined,
        layout: raw.layout,
        faces: raw.card_faces ? raw.card_faces.map(transformFace) : null,
        power: raw.power ?? null,
        toughness: raw.toughness ?? null,
        numericPower: parseNumericStat(raw.power),
        numericToughness: parseNumericStat(raw.toughness),
        keywords: raw.keywords,
        producedMana: normalizeProducedMana(raw.produced_mana),
        gameChanger: raw.game_changer,
        scryfallUri: raw.scryfall_uri,
        imageUri: resolveImageUri(raw),
    };
}

export function toCard(raw: ScryfallCard): CardPrinting {
    const card = {
        ...scryfallCardShared(raw),
        rarity: raw.rarity !== undefined && raw.rarity !== '' ? raw.rarity : undefined,
        price: pickDisplayPrice(raw),
        rawJson: raw as unknown as Record<string, unknown>,
    };

    return CardPrintingSchema.parse(card);
}

export function toOracleCard(raw: ScryfallCard): OracleCard {
    const oracle = {
        ...scryfallCardShared(raw),
        rarity: raw.rarity !== undefined && raw.rarity !== '' ? raw.rarity : undefined,
        price: pickDisplayPrice(raw),
    };

    return OracleCardSchema.parse(oracle);
}
