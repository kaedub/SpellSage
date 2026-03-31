import { z } from 'zod';

export const CollectionTextEntrySchema = z.object({
    quantity: z.number().int().positive(),
    name: z.string().min(1),
    setCode: z.string().min(1),
    collectorNum: z.string().min(1),
    foil: z.boolean(),
});

export type CollectionTextEntry = z.infer<typeof CollectionTextEntrySchema>;

const LINE_PATTERN = /^(\d+)\s+(.+?)\s+\(([A-Z0-9]+)\)\s+(\d+)(?:\s+\*F\*)?$/;

export function parseCollectionLine(line: string): CollectionTextEntry | null {
    const trimmed = line.trim();
    if (trimmed === '') return null;

    const match = LINE_PATTERN.exec(trimmed);
    if (!match) return null;

    const [, quantityStr, name, setCode, collectorNum] = match;

    return CollectionTextEntrySchema.parse({
        quantity: Number(quantityStr),
        name,
        setCode,
        collectorNum,
        foil: trimmed.endsWith('*F*'),
    });
}

export function collectionCardKey(
    name: string,
    setCode: string,
    collectorNum: string,
): string {
    return `${name}::${setCode}::${collectorNum}`;
}

export function parseCollectionText(
    text: string,
): Map<string, CollectionTextEntry[]> {
    const map = new Map<string, CollectionTextEntry[]>();
    const lines = text.split('\n');

    for (const line of lines) {
        const entry = parseCollectionLine(line);
        if (!entry) continue;

        const key = collectionCardKey(entry.name, entry.setCode, entry.collectorNum);
        const existing = map.get(key);
        if (existing) {
            existing.push(entry);
        } else {
            map.set(key, [entry]);
        }
    }

    return map;
}
