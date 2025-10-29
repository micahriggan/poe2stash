export const Leagues = [
  'Rise of the Abyssal',
  'HC Rise of the Abyssal',
  'Standard',
  'Hardcore'
] as const;

export type League = typeof Leagues[number];
