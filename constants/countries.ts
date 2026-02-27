export const COUNTRY_OPTIONS = [
  'Bangladesh',
  'India',
  'Pakistan',
  'Nepal',
  'Sri Lanka',
  'United Arab Emirates',
  'Saudi Arabia',
  'Qatar',
  'Kuwait',
  'Malaysia',
  'Singapore',
  'Thailand',
  'Japan',
  'South Korea',
  'China',
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Netherlands',
  'Australia',
  'New Zealand'
] as const;

export type SupportedCountry = (typeof COUNTRY_OPTIONS)[number];
