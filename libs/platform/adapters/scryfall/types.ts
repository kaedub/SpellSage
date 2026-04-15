
type BulkType = 'oracle_cards' | 'default_cards' | 'unique_artwork';

/**
 * Single-character mana symbols as in JSON APIs (`W`, `U`, `B`, `R`, `G`, `C`).
 * Member names spell out the color so `Blue`/`Black` are not confused with `U`/`B`.
 */
enum ManaColor {
    White = 'W',
    Blue = 'U',
    Black = 'B',
    Red = 'R',
    Green = 'G',
    Colorless = 'C',
}

export type BulkDataObject = {
    object: 'bulk_data';
    id: string;
    type: BulkType;
    name: string;
    description: string;
    download_uri: string;
    /** ISO 8601 datetime string from the API. */
    updated_at: string;
};

export type BulkData = {
    object: 'list';
    has_more: boolean;
    data: BulkDataObject[];
};

export type CardImageUris = {
    small: string;
    normal: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
};

export type ScryfallLegality = 'legal' | 'not_legal' | 'restricted' | 'banned';

export type Legalities = {
    standard: ScryfallLegality;
    future: ScryfallLegality;
    historic: ScryfallLegality;
    timeless: ScryfallLegality;
    gladiator: ScryfallLegality;
    pioneer: ScryfallLegality;
    modern: ScryfallLegality;
    legacy: ScryfallLegality;
    pauper: ScryfallLegality;
    vintage: ScryfallLegality;
    penny: ScryfallLegality;
    commander: ScryfallLegality;
    oathbreaker: ScryfallLegality;
    standardbrawl: ScryfallLegality;
    brawl: ScryfallLegality;
    alchemy: ScryfallLegality;
    paupercommander: ScryfallLegality;
    duel: ScryfallLegality;
    oldschool: ScryfallLegality;
    premodern: ScryfallLegality;
    predh: ScryfallLegality;
};

export type CardPrices = {
    usd: string | null;
    usd_foil: string | null;
    usd_etched: string | null;
    eur: string | null;
    eur_foil: string | null;
    tix: string | null;
};

export type RelatedCard = {
    object: 'related_card';
    id: string;
    component: string;
    name: string;
    type_line: string;
    uri: string;
};

/**
 * A face on a multi-faced card. Most fields are optional because layout and
 * card type determine what Scryfall returns.
 */
export type CardFace = {
    object: 'card_face';
    name: string;
    mana_cost?: string;
    type_line?: string;
    oracle_text?: string | null;
    colors: ManaColor[];
    color_indicator?: ManaColor[];
    artist?: string | null;
    artist_id?: string | null;
    illustration_id?: string | null;
    image_uris?: CardImageUris | null;
    power?: string | null;
    toughness?: string | null;
    printed_name?: string | null;
    printed_text?: string | null;
    flavor_text?: string | null;
    oracle_id?: string;
    cmc?: number;
    layout?: string;
    loyalty?: string | null;
    defense?: string | null;
    watermark?: string | null;
};

/**
 * Raw Scryfall `card` JSON. Optional (`?`) means the key may be absent;
 * `| null` means the key is present but explicitly null.
 */
export type ScryfallCard = {
    object: 'card';
    id: string;
    oracle_id: string;
    multiverse_ids: number[];
    name: string;
    lang: string;
    /** ISO 8601 date string (`YYYY-MM-DD`). */
    released_at: string;
    uri: string;
    scryfall_uri: string;
    layout: string;
    highres_image: boolean;
    image_status: string;
    mana_cost?: string;
    cmc: number;
    type_line: string;
    colors?: ManaColor[];
    color_identity: ManaColor[];
    keywords: string[];
    legalities: Legalities;
    games: string[];
    reserved: boolean;
    game_changer: boolean;
    foil: boolean;
    nonfoil: boolean;
    finishes: string[];
    oversized: boolean;
    promo: boolean;
    reprint: boolean;
    variation: boolean;
    set_id: string;
    set: string;
    set_name: string;
    set_type: string;
    set_uri: string;
    set_search_uri: string;
    scryfall_set_uri: string;
    rulings_uri: string;
    prints_search_uri: string;
    collector_number: string;
    digital: boolean;
    rarity: string;
    card_back_id: string;
    border_color: string;
    frame: string;
    full_art: boolean;
    textless: boolean;
    booster: boolean;
    story_spotlight: boolean;
    prices: CardPrices;
    related_uris: Record<string, string>;
    purchase_uris: Record<string, string>;

    arena_id?: number;
    mtgo_id?: number | null;
    mtgo_foil_id?: number | null;
    tcgplayer_id?: number | null;
    tcgplayer_etched_id?: number | null;
    cardmarket_id?: number | null;
    color_indicator?: ManaColor[];
    all_parts?: RelatedCard[];
    card_faces?: CardFace[];
    image_uris?: CardImageUris | null;
    oracle_text?: string | null;
    flavor_name?: string | null;
    flavor_text?: string | null;
    printed_name?: string | null;
    printed_text?: string | null;
    power?: string | null;
    toughness?: string | null;
    loyalty?: string | null;
    defense?: string | null;
    hand_modifier?: string | null;
    life_modifier?: string | null;
    produced_mana?: ManaColor[];
    edhrec_rank?: number | null;
    penny_rank?: number | null;
    illustration_id?: string | null;
    artist?: string | null;
    artist_ids?: string[];
    security_stamp?: string | null;
    watermark?: string | null;
    variation_of?: string | null;
};
