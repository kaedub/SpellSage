// Platform (business logic, DB, services) entrypoint for SpellSage.
// Keep this file as the public export surface for `@platform/db`.

export {
  addToCollection,
  findCardsByCollectorInfo,
  getCollection,
  insertCards,
  removeFromCollection,
  searchCards,
  upsertCardTags,
  upsertCollectionEntries,
} from './db/index';
export type { CardTagError, UpsertCardTagsResult } from './db/index';
export type { SearchError } from './db/index';
