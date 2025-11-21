export const COUNTRY_CODES = [
  "us", "ca", "uk", "ie", "de", "nl", "be",
  "fr", "es", "it",
  "se", "no", "dk", "fi",
  "pl", "au", "nz",
  "in", "za", "br",
  "jp", // Japan
  "mx", // Mexico
  "pt", // Portugal
  "kr", // South Korea
  "ru", // Russia
  "cn", // China
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];
