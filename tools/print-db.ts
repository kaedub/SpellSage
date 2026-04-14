import 'dotenv/config';

import { prisma } from '../libs/platform/adapters/prisma/client';

const CARD_SELECT = {
  name: true,
  manaCost: true,
  typeLine: true,
  oracleText: true,
} as const;

function header(title: string): void {
  console.log(`\n${'━'.repeat(64)}`);
  console.log(`  ${title}`);
  console.log(`${'━'.repeat(64)}`);
}

function dim(text: string): string {
  return `\x1b[2m${text}\x1b[0m`;
}

function bold(text: string): string {
  return `\x1b[1m${text}\x1b[0m`;
}

async function summary(): Promise<void> {
  header('Summary');

  const totalTags = await prisma.cardTag.count();
  const distinctCards = await prisma.cardTag.groupBy({
    by: ['cardId'],
  });
  const distinctTagNames = await prisma.cardTag.groupBy({
    by: ['tagSlug'],
  });

  console.log(`  Total tag rows:     ${bold(String(totalTags))}`);
  console.log(`  Distinct cards:     ${bold(String(distinctCards.length))}`);
  console.log(`  Distinct tag types: ${bold(String(distinctTagNames.length))}`);

  if (distinctCards.length > 0) {
    console.log(`  Avg tags/card:      ${bold((totalTags / distinctCards.length).toFixed(1))}`);
  }
}

async function recentTags(): Promise<void> {
  header('Recent Tags (last 20)');

  const rows = await prisma.cardTag.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: { card: { select: CARD_SELECT } },
  });

  if (rows.length === 0) {
    console.log('  (none)');
    return;
  }

  for (const r of rows) {
    const cost = r.card.manaCost ? dim(` ${r.card.manaCost}`) : '';
    console.log(`  ${bold(r.card.name)}${cost}  →  ${bold(r.tagSlug)}`);
  }
}

async function tagsByCard(): Promise<void> {
  header('All Tags Grouped by Card');

  const rows = await prisma.cardTag.findMany({
    orderBy: { card: { name: 'asc' } },
    include: { card: { select: CARD_SELECT } },
  });

  if (rows.length === 0) {
    console.log('  (none)');
    return;
  }

  type CardInfo = { name: string; manaCost: string | null; typeLine: string; oracleText: string | null };
  const grouped = new Map<string, { card: CardInfo; tags: string[] }>();

  for (const r of rows) {
    const entry = grouped.get(r.cardId);
    if (entry) {
      entry.tags.push(r.tagSlug);
    } else {
      grouped.set(r.cardId, { card: r.card, tags: [r.tagSlug] });
    }
  }

  for (const { card, tags } of grouped.values()) {
    const cost = card.manaCost ? dim(` ${card.manaCost}`) : '';
    console.log(`\n  ${bold(card.name)}${cost}`);
    console.log(`  ${dim(card.typeLine)}`);
    if (card.oracleText) {
      const lines = card.oracleText.split('\n');
      for (const line of lines) {
        console.log(`  ${dim(line)}`);
      }
    }
    console.log(`  Tags: ${tags.map(t => bold(t)).join(', ')}`);
  }
}

async function tagFrequency(): Promise<void> {
  header('Tag Frequency (most common first)');

  const rows = await prisma.cardTag.groupBy({
    by: ['tagSlug'],
    _count: { tagSlug: true },
    orderBy: { _count: { tagSlug: 'desc' } },
  });

  if (rows.length === 0) {
    console.log('  (none)');
    return;
  }

  for (const r of rows) {
    console.log(`  ${r.tagSlug} (${r._count.tagSlug})`);
  }
}

async function main(): Promise<void> {
  await summary();
  await recentTags();
  // await tagsByCard();
  await tagFrequency();

  await prisma.$disconnect();
}

main().catch(async (err: unknown) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
