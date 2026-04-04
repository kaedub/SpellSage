import type { Result } from '@shared/result';
import type {
  CardSearchFilter,
  CardSearchResult,
  CollectionCardsResponse,
  CollectionSummary,
} from '@shared/search';
import {
  TagTaxonomySchema,
  type TagTaxonomy,
} from '@shared/tag-taxonomy';

export type ApiError = {
  readonly kind: 'network' | 'http' | 'parse';
  readonly message: string;
  readonly status?: number;
};

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<Result<T, ApiError>> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    return err({ kind: 'network', message: 'Failed to reach the server' });
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return err({
      kind: 'http',
      message: body || `Request failed with status ${response.status}`,
      status: response.status,
    });
  }

  try {
    const data = (await response.json()) as T;
    return ok(data);
  } catch {
    return err({ kind: 'parse', message: 'Failed to parse response JSON' });
  }
}

export function searchCards(
  filter: CardSearchFilter,
): Promise<Result<CardSearchResult, ApiError>> {
  return request<CardSearchResult>('/cards/search', {
    method: 'POST',
    body: JSON.stringify(filter),
  });
}

export function getCollections(
  userId: string,
): Promise<Result<CollectionSummary[], ApiError>> {
  return request<CollectionSummary[]>(
    `/collections?userId=${encodeURIComponent(userId)}`,
  );
}

export function createCollection(params: {
  userId: string;
  name: string;
}): Promise<Result<CollectionSummary, ApiError>> {
  return request<CollectionSummary>('/collections', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function deleteCollection(
  collectionId: number,
): Promise<Result<unknown, ApiError>> {
  return request(`/collections/${collectionId}`, {
    method: 'DELETE',
  });
}

export function getCollectionCards(
  collectionId: number,
): Promise<Result<CollectionCardsResponse, ApiError>> {
  return request<CollectionCardsResponse>(
    `/collections/${collectionId}/cards`,
  );
}

export function addCardsToCollection(
  collectionId: number,
  entries: ReadonlyArray<{
    cardId: string;
    quantity: number;
    foil?: boolean;
  }>,
): Promise<Result<unknown, ApiError>> {
  return request(`/collections/${collectionId}/cards`, {
    method: 'POST',
    body: JSON.stringify({ entries }),
  });
}

export function removeCardFromCollection(
  collectionId: number,
  cardEntryId: number,
): Promise<Result<unknown, ApiError>> {
  return request(`/collections/${collectionId}/cards/${cardEntryId}`, {
    method: 'DELETE',
  });
}

export async function getTagTaxonomy(): Promise<
  Result<TagTaxonomy, ApiError>
> {
  let response: Response;
  try {
    response = await fetch('/api/tags', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch {
    return err({ kind: 'network', message: 'Failed to reach the server' });
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return err({
      kind: 'http',
      message: body || `Request failed with status ${response.status}`,
      status: response.status,
    });
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return err({ kind: 'parse', message: 'Failed to parse response JSON' });
  }

  const parsed = TagTaxonomySchema.safeParse(json);
  if (!parsed.success) {
    return err({
      kind: 'parse',
      message: 'Invalid tag taxonomy response',
    });
  }

  return ok(parsed.data);
}
