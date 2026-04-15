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
  insertOracleCards,
  upsertOracleCardTags,
  searchCards,
  upsertCardTags,
  findUntaggedCards,
  getTaggingQueueStats,
  isCardEligibleForLlmTagging,
  TAGGABLE_CARD_TYPES,
  upsertCollectionEntries,
  upsertKeywords,
  findKeywordBySlug,
  findAllKeywords,
  upsertTagTaxonomy,
  loadTagTaxonomy,
  getCollectionTagAggregates,
  getCollectionCardInventoryStats,
  getCollectionDistinctTaggedCardCount,
} from './db/index';
export type {
  CollectionError,
  CollectionSummary,
  CollectionCardEntry,
  CollectionTagAggregate,
  CollectionCardInventoryStats,
} from './db/index';
export type { OracleCardTagSeedInput } from './db/index';
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
