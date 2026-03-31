import { CardSchema, SupertypeSchema, CardTypeSchema } from '@shared/schemas';
import type { Card, CardFace } from '@shared/types';
import type { ScryfallCard, CardFace as ScryfallCardFace } from './types';

const SUPERTYPES = new Set<string>(SupertypeSchema.options);
const CARD_TYPES = new Set<string>(CardTypeSchema.options);

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
        typeLine: face.type_line,
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

export function toCard(raw: ScryfallCard): Card {
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

    const card = {
        id: raw.id,
        name: raw.name,
        set: raw.set,
        setId: raw.set_id,
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
        producedMana: raw.produced_mana ?? [],
        gameChanger: raw.game_changer,
        scryfallUri: raw.scryfall_uri,
        imageUri: resolveImageUri(raw),
        rawJson: raw as unknown as Record<string, unknown>,
    };

    return CardSchema.parse(card);
}
