// The league list is fetched from the trade API at startup (see `Poe2TradeClient.getLeagues`)
// so it stays correct across league rotations. This is only the fallback used until that
// request resolves, or if it fails.
export const Leagues = [
  'Runes of Aldur',
  'HC Runes of Aldur',
  'Standard',
  'Hardcore'
] as const;

// League ids come from the API, so this is a plain string rather than a union of the
// fallback names above.
export type League = string;
