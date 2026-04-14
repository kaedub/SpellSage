import type { Card } from '@shared/types';
import type { ChatMessage } from '../../adapters/openai/types';
import type { CardTagInput } from './types';

export type TagPromptEntry = {
  readonly slug: string;
  readonly definition: string;
  readonly mustHave: readonly string[];
  readonly mustNotHave: readonly string[];
  readonly edgeRule: string | null;
  readonly priority: string | null;
};

export type TagPromptGroup = {
  readonly slug: string;
  readonly tags: readonly TagPromptEntry[];
};

export function projectCardForTagging(card: Card): CardTagInput {
  const faces =
    card.faces !== null && card.faces.length > 0
      ? card.faces
          .filter((f): f is typeof f & { oracleText: string } => f.oracleText !== undefined)
          .map(f => ({
            name: f.name,
            typeLine: f.typeLine,
            oracleText: f.oracleText,
          }))
      : null;

  return {
    name: card.name,
    manaCost: card.manaCost,
    cmc: card.cmc,
    typeLine: card.typeLine,
    oracleText: card.oracleText ?? '',
    colors: card.colors ?? [],
    keywords: card.keywords,
    subtypes: card.subtypes,
    types: card.types,
    power: card.power,
    toughness: card.toughness,
    producedMana: card.producedMana,
    faces: faces !== null && faces.length > 0 ? faces : null,
  };
}

function buildTagListBlock(groups: readonly TagPromptGroup[]): string {
  const sections: string[] = [];

  for (const group of groups) {
    const label = group.slug.replace(/_/g, ' ').toUpperCase();
    const lines = group.tags.map(tag => {
      const parts = [`  - ${tag.slug}: ${tag.definition}`];

      if (tag.mustHave.length > 0) {
        parts.push(`    MUST HAVE: ${tag.mustHave.join('; ')}`);
      }
      if (tag.mustNotHave.length > 0) {
        parts.push(`    MUST NOT HAVE: ${tag.mustNotHave.join('; ')}`);
      }
      if (tag.edgeRule) {
        parts.push(`    EDGE: ${tag.edgeRule}`);
      }
      if (tag.priority) {
        parts.push(`    PRIORITY: ${tag.priority}`);
      }

      return parts.join('\n');
    });
    sections.push(`[${label}]\n${lines.join('\n')}`);
  }

  return sections.join('\n\n');
}

const FEW_SHOT_EXAMPLES = `
### Example 1
Card:
{"name":"Llanowar Elves","manaCost":"{G}","cmc":1,"typeLine":"Creature — Elf Druid","oracleText":"{T}: Add {G}.","colors":["G"],"keywords":[],"subtypes":["Elf","Druid"],"types":["Creature"],"power":"1","toughness":"1","producedMana":["G"],"faces":null}

Output:
{"tags":[{"tag":"mana_dork","confidence":0.99,"evidence":"Creature that taps for mana."},{"tag":"early_play","confidence":0.3,"evidence":"Costs one mana."}]}

Note: Only mana_dork is returned (not also ramp) because mana_dork is the most specific applicable tag. early_play is below the confidence threshold so it would be filtered.

### Example 2
Card:
{"name":"Murder","manaCost":"{1}{B}{B}","cmc":3,"typeLine":"Instant","oracleText":"Destroy target creature.","colors":["B"],"keywords":[],"subtypes":[],"types":["Instant"],"power":null,"toughness":null,"producedMana":[],"faces":null}

Output:
{"tags":[{"tag":"spot_removal","confidence":0.97,"evidence":"Destroys a single target creature."},{"tag":"cheap_interaction","confidence":0.75,"evidence":"Instant-speed removal at 3 mana."}]}

### Example 3
Card:
{"name":"Blood Artist","manaCost":"{1}{B}","cmc":2,"typeLine":"Creature — Vampire","oracleText":"Whenever Blood Artist or another creature dies, target player loses 1 life and you gain 1 life.","colors":["B"],"keywords":[],"subtypes":["Vampire"],"types":["Creature"],"power":"0","toughness":"1","producedMana":[],"faces":null}

Output:
{"tags":[{"tag":"death_payoff","confidence":0.96,"evidence":"Triggers whenever a creature dies."},{"tag":"life_drain","confidence":0.85,"evidence":"Causes opponent life loss and controller life gain on each death."},{"tag":"aristocrats","confidence":0.80,"evidence":"Death trigger plus incremental drain fits the aristocrats archetype."}]}

### Example 4
Card:
{"name":"Grizzly Bears","manaCost":"{1}{G}","cmc":2,"typeLine":"Creature — Bear","oracleText":"","colors":["G"],"keywords":[],"subtypes":["Bear"],"types":["Creature"],"power":"2","toughness":"2","producedMana":[],"faces":null}

Output:
{"tags":[]}

Note: Vanilla creatures with no meaningful abilities receive zero tags. This is correct.

### Example 5
Card:
{"name":"Priest of Gix","manaCost":"{2}{B}","cmc":3,"typeLine":"Creature — Human Cleric Minion","oracleText":"When Priest of Gix enters the battlefield, add {B}{B}{B}.","colors":["B"],"keywords":[],"subtypes":["Human","Cleric","Minion"],"types":["Creature"],"power":"0","toughness":"1","producedMana":["B"],"faces":null}

Output:
{"tags":[{"tag":"ritual","confidence":0.92,"evidence":"Adds three black mana as a one-shot ETB effect."},{"tag":"etb","confidence":0.88,"evidence":"Produces mana when it enters the battlefield."}]}

Note: This is NOT mana_dork because the mana production is a one-time ETB, not a repeatable activated ability. ritual is the correct specific tag.

### Example 6
Card:
{"name":"Teardrop Kami","manaCost":"{U}","cmc":1,"typeLine":"Creature — Spirit","oracleText":"Sacrifice Teardrop Kami: Tap or untap target permanent.","colors":["U"],"keywords":[],"subtypes":["Spirit"],"types":["Creature"],"power":"1","toughness":"1","producedMana":[],"faces":null}

Output:
{"tags":[{"tag":"untap","confidence":0.75,"evidence":"Can untap a target permanent."}]}

Note: This is NOT sacrifice_outlet. The card sacrifices only itself as a one-shot cost — it does not let you sacrifice other permanents repeatedly.
`.trim();

export function buildTaggingMessages(
  input: CardTagInput,
  groups: readonly TagPromptGroup[],
): readonly ChatMessage[] {
  const systemPrompt = `You are an MTG card tagging system.

Your job is to assign deckbuilding-relevant tags to a Magic: The Gathering card based ONLY on its oracle text, keywords, and metadata.

## Rules

1. Only use tags from the provided list. Never invent or approximate new tags.

2. Base all tags ONLY on the card's oracle text, keywords, and type line. Do not use outside knowledge.

3. Only assign a tag if there is clear, direct textual support. If uncertain, omit the tag.

4. Prefer fewer, high-confidence tags over many weak ones. Do not force tags.

5. If no tags clearly apply, return an empty tags array.

6. Prefer the most specific applicable tag. Do not include a broader tag when a more specific one already applies.

7. For multi-face cards, consider all faces. A tag applies if any face meaningfully contributes to that role. Ignore incidental or minor effects.

8. Confidence reflects how directly the card text supports the tag — NOT power level or usefulness.

9. Evidence must reference specific card text, keywords, or type information. Keep it to one short sentence.

10. Type-specific tags must match the card's type line (e.g., utility_land only for Lands, mana_dork only for Creatures, mana_rock only for Artifacts).

11. evasive_threat requires offensive evasion: flying, menace, trample, unblockable, skulk, shadow, fear, or intimidate.  
    Deathtouch, vigilance, first strike, reach, ward, and hexproof are NOT offensive evasion.  
    evasion_enabler only applies if the card grants offensive evasion to OTHER permanents.

12. sacrifice_outlet requires a repeatable or strategically central way to sacrifice your own permanents.  
    Do NOT assign it to cards that only sacrifice themselves as a one-shot cost unless the card's primary deck role is sac enabling.

13. mana_dork requires a repeatable mana ability (e.g., "{T}: Add {G}").  
    Do NOT assign it to one-time mana effects such as ETB triggers.

14. enchantments_matter only applies if the card explicitly rewards, counts, recurs, or cares about enchantments as a class.  
    Being an enchantment is not sufficient.

15. utility_land requires a meaningful non-mana ability. Basic lands and simple fixing/dual lands are NOT utility lands.

16. cost_reduction applies to reducing your own costs. Taxing opponents is tax, not cost_reduction.

17. lifegain_payoff requires the card to benefit from life being gained (a trigger or scaling effect).  
    Cards that simply gain life are lifegain_enabler, not lifegain_payoff.

18. reanimation is specifically creature cards from graveyard to battlefield.  
    recursion covers returning cards to hand, library, or battlefield that is not creature-to-battlefield reanimation. Prefer the more specific tag.

19. Do not assign tags based on incidental wording in costs or reminder text unless it reflects a real deckbuilding role.

20. Do not assign a tag unless the card would realistically be included in a deck BECAUSE of that function.

21. Each tag below includes MUST HAVE criteria (all must be satisfied) and MUST NOT HAVE criteria (any match disqualifies). Use EDGE and PRIORITY guidance to resolve ambiguous cases.

## Available Tags

${buildTagListBlock(groups)}

## Examples

${FEW_SHOT_EXAMPLES}`;

  const cardJson = JSON.stringify(input);
  const userPrompt = `Tag this card. Return only valid JSON matching the required schema.

${cardJson}`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}
