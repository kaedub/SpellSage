export const TAG_REGISTRY = {
  mana: {
    ramp: 'Increases long-term mana available beyond normal land drop progression.',
    mana_fixing: 'Helps access colors you otherwise may not reliably produce.',
    mana_dork: "Creature with a repeatable mana-producing ability, usually activated (e.g., '{T}: Add {G}').",
    mana_rock: 'Artifact that produces mana through its own ability. Not lands.',
    land_ramp: 'Puts extra lands onto the battlefield.',
    ritual: 'Produces a short-term burst of mana.',
    treasure: 'Creates, uses, or rewards Treasure tokens.',
    cost_reduction: 'Reduces your own spell or ability costs. Not taxing opponents.',
    extra_land_drop: 'Allows playing additional lands each turn.',
    untap: 'Untaps permanents to generate extra use or mana.',
    mana_sink: 'Provides repeatable or scalable use for excess mana.',
  },
  card_flow: {
    card_draw: 'Directly draws one or more cards.',
    draw_engine: 'Provides repeatable or ongoing card draw.',
    card_selection: 'Improves draw quality without necessarily gaining card quantity.',
    cantrip: 'Replaces itself by drawing a card with low opportunity cost.',
    loot: 'Draws then discards, or otherwise exchanges cards in hand.',
    wheel: 'Discards hands and draws new cards.',
    tutor: 'Searches the library for specific cards.',
    card_advantage: 'Generates net material advantage, often through multiple cards or 2-for-1 effects.',
    value_engine: 'Provides repeatable advantage not limited to drawing cards.',
  },
  interaction: {
    spot_removal: 'Removes, neutralizes, or cleanly answers a single opposing permanent.',
    board_wipe: 'Removes or resets multiple permanents at once.',
    counterspell: 'Counters spells on the stack.',
    protection: 'Prevents removal, damage, targeting, or other hostile interaction.',
    bounce: 'Returns permanents to hand.',
    fight: 'Uses creature combat or fight mechanics as removal.',
    edict: 'Forces sacrifice as a form of removal.',
    graveyard_hate: 'Disrupts graveyards or cards using them.',
    hand_disruption: "Removes or reveals cards from an opponent's hand.",
    land_destruction: 'Destroys, exiles, or otherwise removes lands.',
    mana_denial: 'Restricts opposing mana, untaps, land use, or resource development.',
    cheap_interaction: 'Provides efficient low-cost disruption.',
  },
  graveyard: {
    self_mill: 'Puts cards from own library into own graveyard.',
    mill: "Puts cards from an opponent's library into their graveyard.",
    recursion: 'Returns cards from graveyard to hand, library, or battlefield without specifically being creature-to-battlefield reanimation.',
    reanimation: 'Returns creature cards from graveyard directly to the battlefield.',
    spell_recursion: 'Returns instants or sorceries from graveyard for reuse.',
    land_recursion: 'Returns lands from graveyard or replays them.',
    graveyard_enabler: 'Actively fills or uses the graveyard to support other effects.',
    graveyard_payoff: 'Gets stronger or generates value because cards are in graveyards.',
  },
  tokens_counters: {
    token_maker: 'Creates creature or noncreature tokens.',
    token_payoff: 'Benefits from creating or controlling tokens.',
    go_wide: 'Rewards having many creatures or bodies.',
    go_tall: 'Rewards concentrating power onto one or few creatures.',
    plus1_plus1_counters: 'Places or uses +1/+1 counters as a major function.',
    counters_payoff: 'Benefits from counters being placed on permanents.',
    proliferate: 'Adds to existing counters on permanents or players.',
    anthem: 'Broadly increases the stats of multiple creatures.',
    lord: 'Provides a tribal or subtype-based stat boost.',
  },
  sacrifice_life_death: {
    sacrifice_outlet: 'Repeatable or strategically central way to sacrifice your own permanents for value, payoff, or enabling synergies. Not one-shot self-sacrifice costs unless the card\'s deck role is sac enabling.',
    sac_fodder: 'Provides expendable permanents to sacrifice.',
    death_payoff: 'Benefits when creatures or permanents die.',
    sac_payoff: 'Benefits specifically from sacrificing permanents.',
    lifegain_enabler: 'Causes you to gain life.',
    lifegain_payoff: 'Benefits from life being gained. Not cards that simply gain life.',
    life_drain: 'Causes life loss for opponents while often gaining life for you.',
    aristocrats: 'Combines sacrifice, death triggers, and incremental drain/value.',
  },
  combat_board: {
    haste_enabler: 'Grants or enables haste.',
    evasive_threat: 'Threat with offensive evasion such as flying, menace, trample, unblockable, skulk, shadow, fear, or intimidate. Not deathtouch, vigilance, first strike, reach, ward, or hexproof.',
    evasion_enabler: 'Grants offensive evasion to other permanents.',
    protection_enabler: 'Grants hexproof, indestructible, protection, ward-like safety, or similar shielding.',
    combat_trick: 'Temporary combat-focused boost, protection, or stat swing.',
    blink: 'Exiles and returns permanents to retrigger or protect them.',
    etb: 'Has a meaningful effect when it enters the battlefield.',
    etb_payoff: 'Benefits from permanents entering the battlefield.',
    ltb_payoff: 'Benefits from permanents leaving the battlefield.',
    threat: 'Must-answer permanent that generates significant advantage or pressure if left unchecked.',
    sticky_threat: 'Threat that is difficult to remove, recurs, survives interaction, or replaces itself.',
  },
  spells_artifacts_enchantments: {
    spellslinger: 'Rewards casting instants, sorceries, or multiple noncreature spells.',
    storm: 'Rewards casting many spells in a turn.',
    prowess: 'Rewards noncreature spell casting with stat growth or combat bonuses.',
    copy_spell: 'Copies spells.',
    copy_permanent: 'Copies permanents.',
    clone: 'Copies creatures specifically.',
    artifacts_matter: 'Benefits from artifacts entering, existing, or being used.',
    enchantments_matter: 'Explicitly rewards, counts, recurs, or otherwise cares about enchantments as a class. Not just "is an enchantment".',
    equipment: 'Interacts with Equipment or benefits from equipping.',
    aura: 'Interacts with Auras or benefits from enchanting.',
  },
  lands: {
    lands_matter: 'Benefits from lands entering, being played, sacrificed, or counted.',
    landfall: 'Triggers when lands enter the battlefield.',
    utility_land: 'Land whose primary value includes a meaningful non-mana ability; basic lands and simple fixing lands are not utility lands.',
  },
  tribal_typal: {
    typal: 'Rewards, references, or cares about creature types or a named subtype.',
  },
  strategy_roles: {
    build_around: 'Strongly rewards surrounding support or deck construction choices.',
    synergy_piece: 'Supports a specific strategy but may not be the payoff.',
    payoff: 'Primary reward card for a synergy package.',
    enabler: 'Primary setup card for a synergy package.',
    combo_piece: 'Part of a deterministic or high-synergy combo line.',
    finisher: 'Often closes the game quickly once resolved or stabilized.',
    burn: 'Deals direct damage to creatures, planeswalkers, or players as a main function.',
    cheat_into_play: 'Bypasses normal mana costs to put cards onto the battlefield or cast them.',
    extra_turn: 'Creates additional turns.',
    extra_combat: 'Creates additional combat steps.',
  },
  prison_control: {
    stax: 'Restricts resources, untaps, casting, attacking, or other core game actions symmetrically or asymmetrically.',
    tax: 'Increases costs opponents must pay or imposes payment requirements.',
    lock_piece: 'Contributes to a game state that heavily constrains opposing options.',
    control_piece: 'Designed primarily to slow, constrain, or answer opposing development over time.',
  },
} as const;

type TagRegistry = typeof TAG_REGISTRY;
type TagCategory = keyof TagRegistry;

export type TagId = {
  [C in TagCategory]: keyof TagRegistry[C] & string;
}[TagCategory];

function collectTagIds(): readonly TagId[] {
  const ids: TagId[] = [];
  for (const category of Object.values(TAG_REGISTRY)) {
    for (const tagId of Object.keys(category)) {
      ids.push(tagId as TagId);
    }
  }
  return ids;
}

function collectDescriptions(): Record<TagId, string> {
  const descriptions = {} as Record<TagId, string>;
  for (const category of Object.values(TAG_REGISTRY)) {
    for (const [tagId, desc] of Object.entries(category)) {
      descriptions[tagId as TagId] = desc;
    }
  }
  return descriptions;
}

export const ALL_TAG_IDS: readonly [TagId, ...TagId[]] = collectTagIds() as unknown as [TagId, ...TagId[]];

export const TAG_DESCRIPTIONS: Readonly<Record<TagId, string>> = collectDescriptions();
