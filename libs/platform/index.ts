// Platform (business logic, DB, services) entrypoint for SpellSage.
// Keep this file as the public export surface for `@platform/db`.

export {
  createCollection,
  getCollectionsByUser,
  getCollectionCards,
  addCardsToCollection,
  removeCardFromCollection,
  deleteCollection,
  findCardsByCollectorInfo,
  insertCards,
  searchCards,
  upsertCardTags,
  findUntaggedCards,
  getTaggingQueueStats,
  upsertCollectionEntries,
  upsertKeywords,
  findKeywordBySlug,
  findAllKeywords,
  upsertTagTaxonomy,
  loadTagTaxonomy,
} from './db/index';
export type { CollectionError, CollectionSummary, CollectionCardEntry } from './db/index';
export type { CardTagError, CardTagInput, UpsertCardTagsResult, TaggingQueueStats } from './db/index';
export type { KeywordError, KeywordInput, UpsertKeywordsResult } from './db/index';
export type { SearchError } from './db/index';
export type {
  TagError,
  TagInput,
  TagGroupInput,
  UpsertTagTaxonomyResult,
  TagTaxonomyEntry,
  TagTaxonomyGroup,
  TagTaxonomy,
} from './db/index';
