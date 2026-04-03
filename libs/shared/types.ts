import { z } from 'zod';

import {
    SupertypeSchema,
    CardTypeSchema,
    LayoutSchema,
    CardFaceSchema,
    CardSchema,
} from './schemas';
export { type Color } from "./schemas";

import { KeywordTypeSchema, KeywordSchema } from './keyword-schemas';

export type Supertype = z.infer<typeof SupertypeSchema>;
export type CardType = z.infer<typeof CardTypeSchema>;
export type Layout = z.infer<typeof LayoutSchema>;
export type CardFace = z.infer<typeof CardFaceSchema>;
export type Card = z.infer<typeof CardSchema>;

export type KeywordType = z.infer<typeof KeywordTypeSchema>;
export type Keyword = z.infer<typeof KeywordSchema>;
