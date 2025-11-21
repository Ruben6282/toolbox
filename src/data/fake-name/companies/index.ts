// src/data/fake-name/companies/index.ts

import { CountryCode } from "@/data/fake-name/country-codes";
import { globalCompanies } from "@/data/fake-name/companies/global";

// Local company datasets
import { usCompanies } from "@/data/fake-name/companies/us";
import { caCompanies } from "@/data/fake-name/companies/ca";
import { ukCompanies } from "@/data/fake-name/companies/uk";
import { ieCompanies } from "@/data/fake-name/companies/ie";
import { deCompanies } from "@/data/fake-name/companies/de";
import { nlCompanies } from "@/data/fake-name/companies/nl";
import { beCompanies } from "@/data/fake-name/companies/be";
import { frCompanies } from "@/data/fake-name/companies/fr";
import { esCompanies } from "@/data/fake-name/companies/es";
import { itCompanies } from "@/data/fake-name/companies/it";
import { seCompanies } from "@/data/fake-name/companies/se";
import { noCompanies } from "@/data/fake-name/companies/no";
import { dkCompanies } from "@/data/fake-name/companies/dk";
import { fiCompanies } from "@/data/fake-name/companies/fi";
import { plCompanies } from "@/data/fake-name/companies/pl";
import { auCompanies } from "@/data/fake-name/companies/au";
import { nzCompanies } from "@/data/fake-name/companies/nz";
import { inCompanies } from "@/data/fake-name/companies/in";
import { zaCompanies } from "@/data/fake-name/companies/za";
import { brCompanies } from "@/data/fake-name/companies/br";

// Newly added countries (matching missing CountryCodes)
import { jpCompanies } from "@/data/fake-name/companies/jp";
import { mxCompanies } from "@/data/fake-name/companies/mx";
import { ptCompanies } from "@/data/fake-name/companies/pt";
import { krCompanies } from "@/data/fake-name/companies/kr";
import { ruCompanies } from "@/data/fake-name/companies/ru";
import { cnCompanies } from "@/data/fake-name/companies/cn";

// Map local companies by country code
export const countryCompanies: Record<CountryCode, string[]> = {
  us: usCompanies,
  ca: caCompanies,
  uk: ukCompanies,
  ie: ieCompanies,
  de: deCompanies,
  nl: nlCompanies,
  be: beCompanies,
  fr: frCompanies,
  es: esCompanies,
  it: itCompanies,
  se: seCompanies,
  no: noCompanies,
  dk: dkCompanies,
  fi: fiCompanies,
  pl: plCompanies,
  au: auCompanies,
  nz: nzCompanies,
  in: inCompanies,
  za: zaCompanies,
  br: brCompanies,
  jp: jpCompanies,
  mx: mxCompanies,
  pt: ptCompanies,
  kr: krCompanies,
  ru: ruCompanies,
  cn: cnCompanies,
};

// 70% country-specific, 30% global
export const getCompaniesForCountry = (country: CountryCode) => {
  const local = countryCompanies[country] || [];
  const global = globalCompanies;

  const weighted = [
    ...Array(7).fill(local).flat(),
    ...Array(3).fill(global).flat(),
  ];

  return {
    local,
    global,
    weighted,
  };
};
