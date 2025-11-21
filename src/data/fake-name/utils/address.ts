// src/data/fake-name/utils/address.ts

import { pick } from "./pick";
import { rand } from "./random";
import { getStreetNamesForCountry } from "../streets";
import { CountryCode } from "../country-codes";

export const generateAddress = (
  country: CountryCode,
  city: string,
  postcode: string
): string => {
  const number = Math.floor(rand() * 9999) + 1;
  const street = pick(getStreetNamesForCountry(country));

  switch (country) {
    case "us":
    case "ca":
      return `${number} ${street}, ${city}, ${postcode}`;

    case "uk":
    case "ie":
      return `${number} ${street}, ${city} ${postcode}`;

    case "au":
    case "nz":
      return `${number} ${street}, ${city} ${postcode}`;

    case "in":
      return `${number} ${street}, ${city} - ${postcode}`;

    case "za":
      return `${number} ${street}, ${city} ${postcode}`;

    case "br":
      return `${street} ${number}, ${city} - ${postcode}`;

    case "mx":
      return `${street} ${number}, ${city}, ${postcode}`;

    case "pt":
      return `${street} ${number}, ${postcode} ${city}`;

    case "jp": {
      const block = Math.floor(rand() * 3) + 1;
      const building = Math.floor(rand() * 200) + 1;
      const room = Math.floor(rand() * 99) + 1;
      return `${block}-${building}-${room} ${city}, ${postcode}`;
    }

    case "kr":
      return `${city} ${street} ${number} (${postcode})`;

    case "cn":
      return `${city} ${street} ${number} 号 (${postcode})`;

    case "ru":
      return `${street}, д. ${number}, ${city}, ${postcode}`;

    default:
      // DE / NL / BE / FR / ES / IT / SE / NO / DK / FI / PL, etc.
      return `${street} ${number}, ${postcode} ${city}`;
  }
};
