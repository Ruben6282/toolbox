// src/data/fake-name/generate-profile.ts

import { CountryCode } from "@/data/fake-name/country-codes";
import { countryMeta } from "@/data/fake-name/country-meta";
import { nameData } from "@/data/fake-name/name-data";
import { masterJobTitles } from "@/data/fake-name/jobs";
import { getCompaniesForCountry } from "@/data/fake-name/companies";

import { Gender, GenderFilter, GeneratedName } from "@/data/fake-name/types";

import { rand } from "@/data/fake-name/utils/random";
import { pick } from "@/data/fake-name/utils/pick";
import { sanitizeEmailUser } from "@/data/fake-name/utils/sanitize";
import { generatePhoneNumber } from "@/data/fake-name/utils/phone";
import { generatePostcode } from "@/data/fake-name/utils/postcode";
import { generateAddress } from "@/data/fake-name/utils/address";
import { generateBirthDate } from "@/data/fake-name/utils/birthdate";

/**
 * Generates a complete fake user profile for a given country
 */
export const generateProfile = (
  country: CountryCode,
  genderFilter: GenderFilter
): GeneratedName => {

  const meta = countryMeta[country];
  const names = nameData[country];

  /* -------------------------------------
       1) Resolve gender
  ------------------------------------- */
  const finalGender: Gender =
    genderFilter === "random"
      ? (rand() > 0.5 ? "male" : "female")
      : genderFilter;

  /* -------------------------------------
       2) Names
  ------------------------------------- */
  const genderPool = names[finalGender];

  const firstName = pick<string>(genderPool.first);
  const lastName = pick<string>(genderPool.last);

  /* -------------------------------------
       3) Email + username
  ------------------------------------- */
  const emailUser = sanitizeEmailUser(`${firstName}.${lastName}`) || "user";
  const emailDomain = pick<string>(meta.emailDomains);
  const email = `${emailUser}@${emailDomain}`;

  // Username with random postfix for realism
  const username = `${emailUser}${Math.floor(rand() * 10000)}`;

  /* -------------------------------------
       4) Location (city, postcode, address)
  ------------------------------------- */
  const city = pick<string>(meta.cities);
  const postalCode = generatePostcode(country);
  const address = generateAddress(country, city, postalCode);

  /* -------------------------------------
       5) Phone
  ------------------------------------- */
  const phone = generatePhoneNumber(country);

  /* -------------------------------------
       6) Age + Birthdate
  ------------------------------------- */
  const age = Math.floor(rand() * 60) + 18;
  const birthDate = generateBirthDate(age);

  /* -------------------------------------
       7) Job & Company
  ------------------------------------- */
  const jobTitle = pick<string>(masterJobTitles);

  // Weighted = 70% country-specific + 30% global
  const companies = getCompaniesForCountry(country).weighted;
  const company = pick<string>(companies);

  /* -------------------------------------
       8) Final object
  ------------------------------------- */
  return {
    firstName,
    lastName,
    gender: finalGender,
    age,
    email,
    username,
    phone,
    address,
    city,
    postalCode,
    countryCode: country,
    countryName: meta.label,
    nationality: meta.nationality,
    jobTitle,
    company,
    birthDate,
  };
};
