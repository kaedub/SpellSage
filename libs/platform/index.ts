// Platform (business logic, DB, services) entrypoint for SpellSage.
// Keep this file as the public export surface for `@platform/db`.

export {
  addToCollection,
  findCardsByCollectorInfo,
  getCollectionByUser,
  insertCards,
  removeFromCollection,
  searchCards,
  upsertCardTags,
  upsertCollectionEntries,
  upsertKeywords,
  findKeywordBySlug,
  findAllKeywords,
} from './db/index';
export type { CardTagError, UpsertCardTagsResult } from './db/index';
export type { KeywordError, KeywordInput, UpsertKeywordsResult } from './db/index';
export type { SearchError } from './db/index';
