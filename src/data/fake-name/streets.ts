// src/data/fake-name/streets.ts

import { CountryCode } from "./country-codes";

/* -------------------------------------------------------------
   COUNTRY-SPECIFIC STREET NAMES
------------------------------------------------------------- */

/* ------------------------ USA & CANADA ------------------------ */
const usCaStreets = [
  "Main Street",
  "Oak Street",
  "Maple Avenue",
  "Cedar Street",
  "Elm Street",
  "Pine Street",
  "Washington Avenue",
  "Lincoln Street",
  "Jefferson Avenue",
  "Park Lane",
  "Sunset Boulevard",
  "Broadway",
  "River Road",
  "Hillcrest Drive",
  "Highland Avenue",
  "Chestnut Street",
  "Madison Avenue",
  "2nd Street",
  "3rd Street",
  "4th Street",
];

/* ------------------------ UNITED KINGDOM ------------------------ */
const ukStreets = [
  "High Street",
  "Station Road",
  "Church Street",
  "Victoria Road",
  "London Road",
  "Green Lane",
  "Manor Road",
  "Church Lane",
  "Park Road",
  "The Crescent",
  "Kingsway",
  "Queens Road",
  "Mill Lane",
  "Market Street",
  "Baker Street",
  "Oxford Road",
  "Cambridge Street",
];

/* ------------------------ IRELAND ------------------------ */
const irelandStreets = [
  "Main Street",
  "Church Road",
  "High Road",
  "New Road",
  "St. Patrick's Street",
  "O'Connell Street",
  "Dame Street",
  "Grafton Street",
  "Patrick Street",
  "North Circular Road",
];

/* ------------------------ NETHERLANDS ------------------------ */
const nlStreets = [
  "Dorpsstraat",
  "Kerkstraat",
  "Hoofdstraat",
  "Schoolstraat",
  "Molenweg",
  "Stationsweg",
  "Industrieweg",
  "Julianaweg",
  "Raadhuisstraat",
  "Vlietstraat",
  "Havenstraat",
  "Dijkstraat",
];

/* ------------------------ GERMANY ------------------------ */
const deStreets = [
  "Hauptstraße",
  "Bahnhofstraße",
  "Schulstraße",
  "Gartenstraße",
  "Dorfstraße",
  "Kirchweg",
  "Industriestraße",
  "Lindenweg",
  "Bergstraße",
  "Friedenstraße",
  "Mühlenweg",
];

/* ------------------------ BELGIUM ------------------------ */
const beStreets = [
  "Stationsstraat",
  "Marktstraat",
  "Brugstraat",
  "Beukendreef",
  "Oude Baan",
  "Nieuwstraat",
  "Kasteelstraat",
  "Mechelse Steenweg",
];

/* ------------------------ FRANCE ------------------------ */
const frStreets = [
  "Rue de la République",
  "Avenue de Paris",
  "Rue Victor Hugo",
  "Boulevard Saint-Michel",
  "Rue du Château",
  "Rue de Lyon",
  "Rue de Provence",
  "Avenue Victor Hugo",
  "Rue de l'Église",
];

/* ------------------------ SPAIN ------------------------ */
const esStreets = [
  "Calle Mayor",
  "Calle Real",
  "Avenida de España",
  "Calle del Sol",
  "Calle Nueva",
  "Avenida del Parque",
  "Calle de San Juan",
  "Paseo de la Habana",
  "Calle de Alcalá",
];

/* ------------------------ ITALY ------------------------ */
const itStreets = [
  "Via Roma",
  "Corso Italia",
  "Via Garibaldi",
  "Via del Corso",
  "Via Nazionale",
  "Via Dante",
  "Via Manzoni",
  "Via Milano",
  "Viale Venezia",
];

/* ------------------------ SWEDEN ------------------------ */
const seStreets = [
  "Sveavägen",
  "Kungsgatan",
  "Storgatan",
  "Stationsgatan",
  "Skolgatan",
  "Kyrkogatan",
  "Östra Vägen",
  "Norra Allén",
];

/* ------------------------ NORWAY ------------------------ */
const noStreets = [
  "Storgata",
  "Kirkegata",
  "Skolegata",
  "Industriveien",
  "Fjordveien",
  "Hovedgata",
  "Vestliveien",
];

/* ------------------------ DENMARK ------------------------ */
const dkStreets = [
  "Hovedgaden",
  "Kirkestræde",
  "Stationsvej",
  "Industrivej",
  "Bakkevej",
  "Nørregade",
  "Søndergade",
];

/* ------------------------ FINLAND ------------------------ */
const fiStreets = [
  "Keskuskatu",
  "Kirkonkyläntie",
  "Asematie",
  "Rantakatu",
  "Koivutie",
  "Mäntytie",
  "Koulukatu",
];

/* ------------------------ POLAND ------------------------ */
const plStreets = [
  "Ul. Krakowska",
  "Ul. Warszawska",
  "Ul. Szkolna",
  "Ul. Kwiatowa",
  "Ul. Polna",
  "Ul. Lipowa",
  "Ul. Słoneczna",
];

/* ------------------------ INDIA ------------------------ */
const inStreets = [
  "MG Road",
  "Station Road",
  "Main Bazaar Road",
  "Link Road",
  "Park Street",
  "Temple Road",
  "Gandhi Marg",
  "Jawahar Road",
];

/* ------------------------ AUSTRALIA & NEW ZEALAND ------------------------ */
const auNzStreets = [
  "George Street",
  "King Street",
  "Queen Street",
  "Victoria Road",
  "River Road",
  "Forest Drive",
  "Beach Parade",
  "Sunset Parade",
];

/* ------------------------ SOUTH AFRICA ------------------------ */
const zaStreets = [
  "Voortrekker Road",
  "Long Street",
  "Kloof Street",
  "Church Street",
  "Berg Street",
  "Main Road",
];

/* ------------------------ BRAZIL ------------------------ */
const brStreets = [
  "Rua das Flores",
  "Avenida Paulista",
  "Rua Augusta",
  "Rua São João",
  "Rua XV de Novembro",
  "Avenida Brasil",
];

/* ------------------------ JAPAN ------------------------ */
const jpStreets = [
  "Shibuya-dori",
  "Harajuku-dori",
  "Akihabara Street",
  "Sakura Street",
  "Asakusa-dori",
  "Roppongi-dori",
  "Ginza-dori",
];

/* ------------------------ SOUTH KOREA ------------------------ */
const krStreets = [
  "Teheran-ro",
  "Gangnam-daero",
  "Jongno",
  "Myeongdong-gil",
  "Hongdae-ro",
];

/* ------------------------ CHINA ------------------------ */
const cnStreets = [
  "Nanjing Road",
  "Wangfujing Street",
  "Chang'an Avenue",
  "Renmin Road",
  "Zhongshan Road",
];

/* ------------------------ RUSSIA ------------------------ */
const ruStreets = [
  "ул. Ленина",
  "ул. Тверская",
  "ул. Пушкина",
  "ул. Советская",
  "ул. Центральная",
];

/* ------------------------ MEXICO ------------------------ */
const mxStreets = [
  "Calle Reforma",
  "Calle Hidalgo",
  "Calle Juárez",
  "Avenida Insurgentes",
  "Calle Morelos",
];

/* ------------------------ PORTUGAL ------------------------ */
const ptStreets = [
  "Rua da Liberdade",
  "Avenida da República",
  "Rua das Flores",
  "Rua do Sol",
  "Rua Direita",
];

/* -------------------------------------------------------------
   MAP STREETS BY COUNTRY
------------------------------------------------------------- */

export const streetNamesByCountry: Record<CountryCode, string[]> = {
  us: usCaStreets,
  ca: usCaStreets,
  uk: ukStreets,
  ie: irelandStreets,
  de: deStreets,
  nl: nlStreets,
  be: beStreets,
  fr: frStreets,
  es: esStreets,
  it: itStreets,
  se: seStreets,
  no: noStreets,
  dk: dkStreets,
  fi: fiStreets,
  pl: plStreets,
  au: auNzStreets,
  nz: auNzStreets,
  in: inStreets,
  za: zaStreets,
  br: brStreets,
  jp: jpStreets,
  kr: krStreets,
  cn: cnStreets,
  ru: ruStreets,
  mx: mxStreets,
  pt: ptStreets,
};

/**
 * Get street list for given country, with a fallback
 */
export const getStreetNamesForCountry = (country: CountryCode): string[] => {
  return streetNamesByCountry[country] ?? usCaStreets;
};

/* -------------------------------------------------------------
   OPTIONAL: GLOBAL FLATTENED LIST
------------------------------------------------------------- */
export const streetNames: string[] = Object.values(streetNamesByCountry).flat();
