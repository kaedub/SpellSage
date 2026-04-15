import { z } from 'zod';

import { CardFaceSchema, CardPrintingSchema, OracleCardSchema } from './schemas';
export { type Color } from './schemas';

import { KeywordTypeSchema, KeywordSchema } from './keyword-schemas';

/** @deprecated Prefer `string`; kept for readability at call sites. */
export type Supertype = string;
/** @deprecated Prefer `string`; kept for readability at call sites. */
export type CardType = string;
/** @deprecated Prefer `string`; kept for readability at call sites. */
export type Layout = string;
export type CardFace = z.infer<typeof CardFaceSchema>;
export type CardPrinting = z.infer<typeof CardPrintingSchema>;
export type OracleCard = z.infer<typeof OracleCardSchema>;

export type KeywordType = z.infer<typeof KeywordTypeSchema>;
export type Keyword = z.infer<typeof KeywordSchema>;
