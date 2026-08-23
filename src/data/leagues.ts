export const Leagues = [
  'Runes of Aldur',
  'HC Runes of Aldur',
  'Standard',
  'Hardcore'
] as const;

export type League = typeof Leagues[number];
