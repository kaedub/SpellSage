import 'dotenv/config';
import { ScryfallCard } from './types';

const API_URL = 'https://api.scryfall.com';
const HEADERS = {
  'User-Agent': 'SpellSage:1.0',
  Accept: 'application/json',
} as const;


const sleepMs = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Boundary for Scryfall HTTP.
 * Returns raw JSON so decoding/validation can live in the decoder.
 */
export async function getRandomCard(): Promise<ScryfallCard> {
  await sleepMs(500);
  const response = await fetch(`${API_URL}/cards/random`, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(
      `Scryfall GET /cards/random failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data as ScryfallCard;
}

