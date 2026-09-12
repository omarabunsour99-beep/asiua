export const COUNTRIES = ['Korea', 'China', 'Japan', 'Thailand', 'Taiwan'] as const;
export type CatalogueCountry = typeof COUNTRIES[number];
export const COUNTRY_LABELS: Record<CatalogueCountry, string> = {
  Korea: 'كوريا الجنوبية',
  China: 'الصين',
  Japan: 'اليابان',
  Thailand: 'تايلاند',
  Taiwan: 'تايوان',
}; 
export const GENRE_LABELS: Record<string, string> = {
  Romance: 'رومانسي',
  Melodrama: 'ميلودراما',
  Mystery: 'غموض',
  Period: 'تاريخي',
  Drama: 'دراما',
  Family: 'عائلي',
  Comedy: 'كوميدي',
  'Slice of Life': 'حياة يومية',
  Thriller: 'إثارة',
  Political: 'سياسي',
  Music: 'موسيقى',
  Crime: 'جريمة',
  Adventure: 'مغامرة',
  Urban: 'حضري',
};