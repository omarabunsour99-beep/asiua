export const COUNTRIES = ['Korea', 'China', 'Japan', 'Thailand', 'Taiwan'] as const;
export type CatalogueCountry = typeof COUNTRIES[number];