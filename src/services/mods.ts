import { ItemMod } from "./types";

export type ParsedMod = {
  /** Stat id in the form the trade search expects, e.g. `explicit.stat_53045048`. */
  hash: string;
  /** Display text, with the game's markup resolved. */
  text: string;
  /** The rolled values, read out of the mod description. */
  value1?: number;
  value2?: number;
  tier?: string;
  /** Numeric part of the tier, for sorting. Lower is better; undefined when unknown. */
  tierNum?: number;
  level: number;
};

/**
 * Resolves the game's inline markup: `[Attack|Attacks]` renders as "Attacks" and
 * `[Evasion]` as "Evasion".
 */
export function formatModText(description: string) {
  return description
    .replace(/\[([^|\]]+)\|([^\]]+)\]/g, "$2")
    .replace(/\[([^\]]+)\]/g, "$1");
}

/**
 * The values actually rolled on the item, in the order they appear. "Adds 14 to 22 Cold
 * damage" gives `[14, 22]`.
 */
export function modValues(description: string) {
  const matches = formatModText(description).match(/[-+]?\d+(?:\.\d+)?/g);
  return (matches || []).map(Number);
}

/**
 * The trade API prefixes mod hashes with `stat.`, but searches and the stat tables use
 * the id without it.
 */
export function statId(hash: string) {
  return hash.replace(/^stat\./, "");
}

export function parseMod(mod: ItemMod): ParsedMod {
  const [affix] = mod.mods || [];
  const values = modValues(mod.description);

  return {
    hash: statId(mod.hash),
    text: formatModText(mod.description),
    value1: values[0],
    value2: values[1],
    tier: affix?.tier,
    // Left undefined rather than 0 when there is no affix data, since tier 0 is a real
    // (and best possible) tier.
    tierNum: affix?.tier ? Number(affix.tier.replace(/[^0-9]/g, "")) : undefined,
    level: affix?.level ?? 0,
  };
}
