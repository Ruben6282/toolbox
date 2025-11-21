import { CountryCode } from "./country-codes";

export const GENDERS = ["male", "female"] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_FILTERS = ["random", "male", "female"] as const;
export type GenderFilter = (typeof GENDER_FILTERS)[number];

export interface GeneratedName {
  firstName: string;
  lastName: string;
  gender: Gender; // final resolved gender, no "random" here
  age: number;
  email: string;
  username: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  countryCode: CountryCode;
  countryName: string;
  nationality: string;
  jobTitle: string;
  company: string;
  birthDate: string; // YYYY-MM-DD
}
