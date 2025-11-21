import { CountryCode } from "./country-codes";

export interface CountryMeta {
  code: CountryCode;
  label: string;
  nationality: string;
  emailDomains: string[];
  cities: string[];
}

export const countryMeta: Record<CountryCode, CountryMeta> = {
  us: {
    code: "us",
    label: "United States",
    nationality: "American",
    emailDomains: [
      "gmail.com", "yahoo.com", "outlook.com", "hotmail.com",
      "aol.com", "icloud.com"
    ],
    cities: [
      "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
      "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"
    ],
  },

  ca: {
    code: "ca",
    label: "Canada",
    nationality: "Canadian",
    emailDomains: [
      "gmail.com", "yahoo.ca", "outlook.com", "hotmail.com",
      "bell.ca", "shaw.ca", "rogers.com"
    ],
    cities: [
      "Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa",
      "Edmonton", "Winnipeg", "Quebec City", "Hamilton", "Halifax"
    ],
  },

  uk: {
    code: "uk",
    label: "United Kingdom",
    nationality: "British",
    emailDomains: [
      "gmail.com", "outlook.com", "hotmail.co.uk", "yahoo.co.uk",
      "btinternet.com", "live.co.uk"
    ],
    cities: [
      "London", "Manchester", "Birmingham", "Leeds", "Glasgow",
      "Liverpool", "Edinburgh", "Bristol", "Sheffield", "Nottingham"
    ],
  },

  ie: {
    code: "ie",
    label: "Ireland",
    nationality: "Irish",
    emailDomains: [
      "gmail.com", "outlook.com", "yahoo.ie", "hotmail.com",
      "eircom.net", "live.ie"
    ],
    cities: [
      "Dublin", "Cork", "Limerick", "Galway", "Waterford",
      "Drogheda", "Dundalk", "Sligo", "Kilkenny", "Athlone"
    ],
  },

  de: {
    code: "de",
    label: "Germany",
    nationality: "German",
    emailDomains: [
      "gmail.com", "gmx.de", "web.de", "outlook.com",
      "t-online.de", "freenet.de"
    ],
    cities: [
      "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt",
      "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Essen"
    ],
  },

  nl: {
    code: "nl",
    label: "Netherlands",
    nationality: "Dutch",
    emailDomains: [
      "gmail.com", "outlook.com", "ziggo.nl", "hotmail.com",
      "kpnmail.nl", "live.nl"
    ],
    cities: [
      "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven",
      "Tilburg", "Groningen", "Breda", "Nijmegen", "Enschede"
    ],
  },

  be: {
    code: "be",
    label: "Belgium",
    nationality: "Belgian",
    emailDomains: [
      "gmail.com", "outlook.com", "skynet.be", "hotmail.com",
      "telenet.be", "proximus.be"
    ],
    cities: [
      "Brussels", "Antwerp", "Ghent", "Charleroi", "Liège",
      "Bruges", "Namur", "Leuven", "Mons", "Mechelen"
    ],
  },

  fr: {
    code: "fr",
    label: "France",
    nationality: "French",
    emailDomains: [
      "gmail.com", "orange.fr", "hotmail.fr", "outlook.com",
      "free.fr", "wanadoo.fr", "laposte.net"
    ],
    cities: [
      "Paris", "Lyon", "Marseille", "Toulouse", "Nice",
      "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille"
    ],
  },

  es: {
    code: "es",
    label: "Spain",
    nationality: "Spanish",
    emailDomains: [
      "gmail.com", "hotmail.es", "outlook.com", "yahoo.es",
      "telefonica.net", "orange.es"
    ],
    cities: [
      "Madrid", "Barcelona", "Valencia", "Seville", "Bilbao",
      "Zaragoza", "Malaga", "Murcia", "Palma", "Las Palmas"
    ],
  },

  it: {
    code: "it",
    label: "Italy",
    nationality: "Italian",
    emailDomains: [
      "gmail.com", "libero.it", "hotmail.it", "outlook.com",
      "alice.it", "tim.it"
    ],
    cities: [
      "Rome", "Milan", "Naples", "Turin", "Florence",
      "Bologna", "Palermo", "Genoa", "Venice", "Verona"
    ],
  },

  se: {
    code: "se",
    label: "Sweden",
    nationality: "Swedish",
    emailDomains: [
      "gmail.com", "outlook.com", "hotmail.se",
      "telia.com", "live.se"
    ],
    cities: [
      "Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås",
      "Örebro", "Linköping", "Helsingborg", "Jönköping", "Norrköping"
    ],
  },

  no: {
    code: "no",
    label: "Norway",
    nationality: "Norwegian",
    emailDomains: [
      "gmail.com", "outlook.com", "hotmail.no",
      "online.no", "live.no"
    ],
    cities: [
      "Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen",
      "Fredrikstad", "Kristiansand", "Sandnes", "Tønsberg", "Ålesund"
    ],
  },

  dk: {
    code: "dk",
    label: "Denmark",
    nationality: "Danish",
    emailDomains: [
      "gmail.com", "outlook.com", "hotmail.dk",
      "mail.dk", "live.dk"
    ],
    cities: [
      "Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg",
      "Randers", "Kolding", "Horsens", "Vejle", "Roskilde"
    ],
  },

  fi: {
    code: "fi",
    label: "Finland",
    nationality: "Finnish",
    emailDomains: [
      "gmail.com", "outlook.com", "hotmail.fi",
      "luukku.com", "suomi24.fi"
    ],
    cities: [
      "Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu",
      "Turku", "Jyväskylä", "Lahti", "Kuopio", "Pori"
    ],
  },

  pl: {
    code: "pl",
    label: "Poland",
    nationality: "Polish",
    emailDomains: [
      "gmail.com", "wp.pl", "o2.pl", "outlook.com",
      "onet.pl", "interia.pl"
    ],
    cities: [
      "Warsaw", "Kraków", "Wrocław", "Gdańsk", "Poznań",
      "Szczecin", "Łódź", "Lublin", "Katowice", "Bydgoszcz"
    ],
  },

  au: {
    code: "au",
    label: "Australia",
    nationality: "Australian",
    emailDomains: [
      "gmail.com", "outlook.com", "hotmail.com.au",
      "yahoo.com.au", "bigpond.com", "live.com.au"
    ],
    cities: [
      "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide",
      "Canberra", "Gold Coast", "Hobart", "Darwin", "Newcastle"
    ],
  },

  nz: {
    code: "nz",
    label: "New Zealand",
    nationality: "New Zealander",
    emailDomains: [
      "gmail.com", "outlook.com", "hotmail.co.nz",
      "xtra.co.nz", "live.co.nz"
    ],
    cities: [
      "Auckland", "Wellington", "Christchurch", "Hamilton", "Dunedin",
      "Tauranga", "Palmerston North", "Napier", "Rotorua", "New Plymouth"
    ],
  },

  in: {
    code: "in",
    label: "India",
    nationality: "Indian",
    emailDomains: [
      "gmail.com", "outlook.com", "yahoo.co.in", "hotmail.com",
      "rediffmail.com", "live.in"
    ],
    cities: [
      "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad",
      "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Surat"
    ],
  },

  za: {
    code: "za",
    label: "South Africa",
    nationality: "South African",
    emailDomains: [
      "gmail.com", "outlook.com", "yahoo.co.za",
      "webmail.co.za", "live.co.za"
    ],
    cities: [
      "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth",
      "Bloemfontein", "Nelspruit", "Kimberley", "East London", "Polokwane"
    ],
  },

  br: {
    code: "br",
    label: "Brazil",
    nationality: "Brazilian",
    emailDomains: [
      "gmail.com", "hotmail.com", "outlook.com",
      "bol.com.br", "globomail.com"
    ],
    cities: [
      "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza",
      "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre"
    ],
  },

  /* ------------------------------
     NEW COUNTRIES (Option 1)
  ------------------------------ */

  jp: {
    code: "jp",
    label: "Japan",
    nationality: "Japanese",
    emailDomains: [
      "gmail.com", "yahoo.co.jp", "outlook.jp",
      "docomo.ne.jp", "ezweb.ne.jp"
    ],
    cities: [
      "Tokyo", "Osaka", "Nagoya", "Sapporo", "Fukuoka",
      "Kobe", "Kyoto", "Yokohama", "Hiroshima", "Sendai"
    ],
  },

  mx: {
    code: "mx",
    label: "Mexico",
    nationality: "Mexican",
    emailDomains: [
      "gmail.com", "hotmail.com", "outlook.com",
      "prodigy.net.mx", "yahoo.com.mx"
    ],
    cities: [
      "Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana",
      "Toluca", "León", "Juárez", "Zapopan", "Mérida"
    ],
  },

  pt: {
    code: "pt",
    label: "Portugal",
    nationality: "Portuguese",
    emailDomains: [
      "gmail.com", "hotmail.pt", "outlook.com",
      "sapo.pt", "iol.pt"
    ],
    cities: [
      "Lisbon", "Porto", "Braga", "Coimbra", "Faro",
      "Aveiro", "Guimarães", "Setúbal", "Funchal", "Viseu"
    ],
  },

  kr: {
    code: "kr",
    label: "South Korea",
    nationality: "South Korean",
    emailDomains: [
      "gmail.com", "naver.com", "daum.net",
      "outlook.kr", "hotmail.com"
    ],
    cities: [
      "Seoul", "Busan", "Incheon", "Daegu", "Daejeon",
      "Gwangju", "Suwon", "Ulsan", "Changwon", "Jeju"
    ],
  },

  ru: {
    code: "ru",
    label: "Russia",
    nationality: "Russian",
    emailDomains: [
      "gmail.com", "yandex.ru", "mail.ru",
      "outlook.com", "rambler.ru"
    ],
    cities: [
      "Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan",
      "Nizhny Novgorod", "Samara", "Omsk", "Rostov-on-Don", "Ufa"
    ],
  },

  cn: {
    code: "cn",
    label: "China",
    nationality: "Chinese",
    emailDomains: [
      "gmail.com", "qq.com", "163.com", "126.com",
      "outlook.com", "sina.com"
    ],
    cities: [
      "Beijing", "Shanghai", "Shenzhen", "Guangzhou", "Chengdu",
      "Wuhan", "Tianjin", "Hangzhou", "Chongqing", "Nanjing"
    ],
  },
};
