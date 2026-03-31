import { z } from 'zod';

import {
    SupertypeSchema,
    CardTypeSchema,
    LayoutSchema,
    CardFaceSchema,
    CardSchema,
} from './schemas';
export { type Color } from "./schemas";

export type Supertype = z.infer<typeof SupertypeSchema>;
export type CardType = z.infer<typeof CardTypeSchema>;
export type Layout = z.infer<typeof LayoutSchema>;
export type CardFace = z.infer<typeof CardFaceSchema>;
export type Card = z.infer<typeof CardSchema>;
