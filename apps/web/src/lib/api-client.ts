import type { Result } from '@shared/result';
import type {
  CardSearchFilter,
  CardSearchResult,
  CollectionResponse,
} from '@shared/search';

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

export function getCollection(
  userId: string,
): Promise<Result<CollectionResponse, ApiError>> {
  return request<CollectionResponse>(
    `/collection?userId=${encodeURIComponent(userId)}`,
  );
}

export function addToCollection(
  items: ReadonlyArray<{
    userId: string;
    cardName: string;
    set: string;
    quantity: number;
  }>,
): Promise<Result<unknown, ApiError>> {
  return request('/collection/batch', {
    method: 'POST',
    body: JSON.stringify(items),
  });
}

export function removeFromCollection(params: {
  id: number;
  userId: string;
}): Promise<Result<unknown, ApiError>> {
  return request('/collection', {
    method: 'DELETE',
    body: JSON.stringify(params),
  });
}
