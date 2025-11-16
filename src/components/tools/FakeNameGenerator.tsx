import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, RotateCcw, Users, Shuffle, Download } from "lucide-react";
import { notify } from "@/lib/notify";

/* -------------------------------------------------------------
   CONFIG / CONSTANTS
------------------------------------------------------------- */

const MIN_COUNT = 1;
const MAX_COUNT = 50;

const ALLOWED_GENDERS = ["random", "male", "female"] as const;
type Gender = (typeof ALLOWED_GENDERS)[number];

const COUNTRY_CODES = [
  "us",
  "ca",
  "uk",
  "ie",
  "de",
  "nl",
  "be",
  "fr",
  "es",
  "it",
  "se",
  "no",
  "dk",
  "fi",
  "pl",
  "au",
  "nz",
  "in",
  "za",
  "br",
] as const;
type CountryCode = (typeof COUNTRY_CODES)[number];

const clampCount = (value: number): number =>
  Math.max(MIN_COUNT, Math.min(MAX_COUNT, Math.floor(value || MIN_COUNT)));

const coerceGender = (value: string): Gender =>
  ALLOWED_GENDERS.includes(value as Gender) ? (value as Gender) : "random";

const coerceCountry = (value: string): CountryCode =>
  COUNTRY_CODES.includes(value as CountryCode) ? (value as CountryCode) : "us";

// Cryptographically strong random in [0, 1)
const rand = () => {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] / 0xffffffff;
};

// Pick a random element from an array
const pick = <T,>(list: T[]): T => list[Math.floor(rand() * list.length)];

// CSV escaping
const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;

// Sanitize email username: lowercase and only [a-z0-9.-]
const sanitizeEmailUser = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9.-]/g, "");

/* -------------------------------------------------------------
   COUNTRY METADATA (names, cities, domains)
------------------------------------------------------------- */

interface CountryMeta {
  code: CountryCode;
  label: string;
  nationality: string;
  emailDomains: string[];
  cities: string[];
}

const countryMeta: Record<CountryCode, CountryMeta> = {
  us: {
    code: "us",
    label: "United States",
    nationality: "American",
    emailDomains: ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"],
    cities: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"],
  },
  ca: {
    code: "ca",
    label: "Canada",
    nationality: "Canadian",
    emailDomains: ["gmail.com", "yahoo.ca", "outlook.com", "hotmail.com"],
    cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  },
  uk: {
    code: "uk",
    label: "United Kingdom",
    nationality: "British",
    emailDomains: ["gmail.com", "outlook.com", "hotmail.co.uk", "yahoo.co.uk"],
    cities: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow"],
  },
  ie: {
    code: "ie",
    label: "Ireland",
    nationality: "Irish",
    emailDomains: ["gmail.com", "outlook.com", "yahoo.ie", "hotmail.com"],
    cities: ["Dublin", "Cork", "Limerick", "Galway", "Waterford"],
  },
  de: {
    code: "de",
    label: "Germany",
    nationality: "German",
    emailDomains: ["gmail.com", "gmx.de", "web.de", "outlook.com"],
    cities: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt"],
  },
  nl: {
    code: "nl",
    label: "Netherlands",
    nationality: "Dutch",
    emailDomains: ["gmail.com", "outlook.com", "ziggo.nl", "hotmail.com"],
    cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"],
  },
  be: {
    code: "be",
    label: "Belgium",
    nationality: "Belgian",
    emailDomains: ["gmail.com", "outlook.com", "skynet.be", "hotmail.com"],
    cities: ["Brussels", "Antwerp", "Ghent", "Bruges", "Leuven"],
  },
  fr: {
    code: "fr",
    label: "France",
    nationality: "French",
    emailDomains: ["gmail.com", "orange.fr", "hotmail.fr", "outlook.com"],
    cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"],
  },
  es: {
    code: "es",
    label: "Spain",
    nationality: "Spanish",
    emailDomains: ["gmail.com", "hotmail.es", "outlook.com", "yahoo.es"],
    cities: ["Madrid", "Barcelona", "Valencia", "Seville", "Bilbao"],
  },
  it: {
    code: "it",
    label: "Italy",
    nationality: "Italian",
    emailDomains: ["gmail.com", "libero.it", "hotmail.it", "outlook.com"],
    cities: ["Rome", "Milan", "Naples", "Turin", "Florence"],
  },
  se: {
    code: "se",
    label: "Sweden",
    nationality: "Swedish",
    emailDomains: ["gmail.com", "outlook.com", "hotmail.se"],
    cities: ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås"],
  },
  no: {
    code: "no",
    label: "Norway",
    nationality: "Norwegian",
    emailDomains: ["gmail.com", "outlook.com", "hotmail.no"],
    cities: ["Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen"],
  },
  dk: {
    code: "dk",
    label: "Denmark",
    nationality: "Danish",
    emailDomains: ["gmail.com", "outlook.com", "hotmail.dk"],
    cities: ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg"],
  },
  fi: {
    code: "fi",
    label: "Finland",
    nationality: "Finnish",
    emailDomains: ["gmail.com", "outlook.com", "hotmail.fi"],
    cities: ["Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu"],
  },
  pl: {
    code: "pl",
    label: "Poland",
    nationality: "Polish",
    emailDomains: ["gmail.com", "wp.pl", "o2.pl", "outlook.com"],
    cities: ["Warsaw", "Kraków", "Wrocław", "Gdańsk", "Poznań"],
  },
  au: {
    code: "au",
    label: "Australia",
    nationality: "Australian",
    emailDomains: ["gmail.com", "outlook.com", "hotmail.com.au", "yahoo.com.au"],
    cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  },
  nz: {
    code: "nz",
    label: "New Zealand",
    nationality: "New Zealander",
    emailDomains: ["gmail.com", "outlook.com", "hotmail.co.nz"],
    cities: ["Auckland", "Wellington", "Christchurch", "Hamilton", "Dunedin"],
  },
  in: {
    code: "in",
    label: "India",
    nationality: "Indian",
    emailDomains: ["gmail.com", "outlook.com", "yahoo.co.in", "hotmail.com"],
    cities: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad"],
  },
  za: {
    code: "za",
    label: "South Africa",
    nationality: "South African",
    emailDomains: ["gmail.com", "outlook.com", "yahoo.co.za"],
    cities: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth"],
  },
  br: {
    code: "br",
    label: "Brazil",
    nationality: "Brazilian",
    emailDomains: ["gmail.com", "hotmail.com", "outlook.com"],
    cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza"],
  },
};

/* -------------------------------------------------------------
   NAME DATA (simplified but realistic pools)
------------------------------------------------------------- */

const nameData: Record<
  CountryCode,
  {
    male: { first: string[]; last: string[] };
    female: { first: string[]; last: string[] };
  }
> = {
  us: {
    male: {
      first: ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Charles", "Joseph", "Thomas"],
      last: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"],
    },
    female: {
      first: ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen"],
      last: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"],
    },
  },
  ca: {
    male: {
      first: ["Liam", "Noah", "Oliver", "William", "Elijah", "James", "Benjamin", "Lucas", "Henry", "Alexander"],
      last: ["Smith", "Brown", "Tremblay", "Martin", "Roy", "Gagnon", "Lee", "Wilson", "Johnson", "MacDonald"],
    },
    female: {
      first: ["Emma", "Olivia", "Ava", "Isabella", "Sophia", "Charlotte", "Mia", "Amelia", "Harper", "Evelyn"],
      last: ["Smith", "Brown", "Tremblay", "Martin", "Roy", "Gagnon", "Lee", "Wilson", "Johnson", "MacDonald"],
    },
  },
  uk: {
    male: {
      first: ["Oliver", "George", "Arthur", "Noah", "Muhammad", "Leo", "Oscar", "Harry", "Archie", "Jack"],
      last: ["Smith", "Jones", "Taylor", "Williams", "Brown", "Davies", "Evans", "Wilson", "Thomas", "Roberts"],
    },
    female: {
      first: ["Olivia", "Amelia", "Isla", "Ava", "Mia", "Grace", "Poppy", "Freya", "Florence", "Sophia"],
      last: ["Smith", "Jones", "Taylor", "Williams", "Brown", "Davies", "Evans", "Wilson", "Thomas", "Roberts"],
    },
  },
  ie: {
    male: {
      first: ["Jack", "James", "Noah", "Conor", "Daniel", "Adam", "Michael", "Luke", "Patrick", "Cian"],
      last: ["Murphy", "Kelly", "O'Sullivan", "Walsh", "Smith", "O'Brien", "Byrne", "Ryan", "O'Connor", "Doyle"],
    },
    female: {
      first: ["Emily", "Grace", "Sophie", "Amelia", "Ella", "Hannah", "Aoife", "Lucy", "Emma", "Chloe"],
      last: ["Murphy", "Kelly", "O'Sullivan", "Walsh", "Smith", "O'Brien", "Byrne", "Ryan", "O'Connor", "Doyle"],
    },
  },
  de: {
    male: {
      first: ["Max", "Paul", "Ben", "Lukas", "Finn", "Leon", "Jonas", "Luis", "Felix", "Noah"],
      last: ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann"],
    },
    female: {
      first: ["Mia", "Emma", "Hannah", "Sofia", "Anna", "Marie", "Lea", "Lena", "Leonie", "Emilia"],
      last: ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann"],
    },
  },
  nl: {
    male: {
      first: ["Daan", "Sem", "Lucas", "Levi", "Finn", "Luuk", "Milan", "Bram", "Thijs", "Jesse"],
      last: ["De Jong", "Jansen", "De Vries", "Van den Berg", "Bakker", "Visser", "Smit", "Meijer", "Mulder", "De Boer"],
    },
    female: {
      first: ["Emma", "Julia", "Sophie", "Anna", "Tess", "Lisa", "Sara", "Eva", "Lotte", "Noa"],
      last: ["De Jong", "Jansen", "De Vries", "Van den Berg", "Bakker", "Visser", "Smit", "Meijer", "Mulder", "De Boer"],
    },
  },
  be: {
    male: {
      first: ["Lucas", "Louis", "Liam", "Noah", "Thomas", "Arthur", "Jules", "Adam", "Nathan", "Maxime"],
      last: ["Peeters", "Janssens", "Maes", "Jacobs", "Mertens", "Claes", "Willems", "Goossens", "De Smet", "Dubois"],
    },
    female: {
      first: ["Emma", "Louise", "Olivia", "Mila", "Elise", "Marie", "Lina", "Nora", "Zoé", "Alice"],
      last: ["Peeters", "Janssens", "Maes", "Jacobs", "Mertens", "Claes", "Willems", "Goossens", "De Smet", "Dubois"],
    },
  },
  fr: {
    male: {
      first: ["Lucas", "Hugo", "Louis", "Gabriel", "Arthur", "Jules", "Nathan", "Thomas", "Paul", "Clément"],
      last: ["Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand", "Dubois", "Moreau", "Laurent"],
    },
    female: {
      first: ["Emma", "Louise", "Chloé", "Camille", "Léa", "Manon", "Sarah", "Inès", "Jade", "Zoé"],
      last: ["Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand", "Dubois", "Moreau", "Laurent"],
    },
  },
  es: {
    male: {
      first: ["Hugo", "Daniel", "Pablo", "Alejandro", "Adrián", "David", "Mario", "Diego", "Javier", "Marco"],
      last: ["García", "Martínez", "López", "Sánchez", "Pérez", "Gómez", "Fernández", "Díaz", "Rodríguez", "Moreno"],
    },
    female: {
      first: ["Lucía", "Sofía", "Martina", "María", "Julia", "Paula", "Valeria", "Emma", "Daniela", "Carla"],
      last: ["García", "Martínez", "López", "Sánchez", "Pérez", "Gómez", "Fernández", "Díaz", "Rodríguez", "Moreno"],
    },
  },
  it: {
    male: {
      first: ["Leonardo", "Francesco", "Alessandro", "Lorenzo", "Mattia", "Andrea", "Gabriele", "Riccardo", "Tommaso", "Edoardo"],
      last: ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco"],
    },
    female: {
      first: ["Sofia", "Giulia", "Aurora", "Alice", "Giorgia", "Emma", "Martina", "Greta", "Chiara", "Anna"],
      last: ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco"],
    },
  },
  se: {
    male: {
      first: ["William", "Liam", "Noah", "Elias", "Oscar", "Lucas", "Hugo", "Oliver", "Alexander", "Viktor"],
      last: ["Johansson", "Andersson", "Karlsson", "Nilsson", "Eriksson", "Larsson", "Olsson", "Persson", "Svensson", "Gustafsson"],
    },
    female: {
      first: ["Alice", "Maja", "Elsa", "Ella", "Wilma", "Ebba", "Astrid", "Alma", "Molly", "Agnes"],
      last: ["Johansson", "Andersson", "Karlsson", "Nilsson", "Eriksson", "Larsson", "Olsson", "Persson", "Svensson", "Gustafsson"],
    },
  },
  no: {
    male: {
      first: ["Jakob", "Emil", "Lucas", "Oliver", "Filip", "Oskar", "Aksel", "William", "Noah", "Håkon"],
      last: ["Hansen", "Johansen", "Olsen", "Larsen", "Andersen", "Pedersen", "Nilsen", "Kristiansen", "Jensen", "Karlsen"],
    },
    female: {
      first: ["Nora", "Emma", "Sara", "Emilie", "Sofie", "Ingrid", "Maja", "Anna", "Ida", "Thea"],
      last: ["Hansen", "Johansen", "Olsen", "Larsen", "Andersen", "Pedersen", "Nilsen", "Kristiansen", "Jensen", "Karlsen"],
    },
  },
  dk: {
    male: {
      first: ["William", "Oscar", "Noah", "Lucas", "Victor", "Malthe", "Magnus", "Emil", "Oliver", "Elias"],
      last: ["Jensen", "Nielsen", "Hansen", "Pedersen", "Andersen", "Christensen", "Larsen", "Sørensen", "Rasmussen", "Jørgensen"],
    },
    female: {
      first: ["Sofie", "Ida", "Emma", "Freja", "Clara", "Laura", "Anna", "Maja", "Caroline", "Sarah"],
      last: ["Jensen", "Nielsen", "Hansen", "Pedersen", "Andersen", "Christensen", "Larsen", "Sørensen", "Rasmussen", "Jørgensen"],
    },
  },
  fi: {
    male: {
      first: ["Eeli", "Onni", "Eino", "Leo", "Veeti", "Miska", "Matti", "Juho", "Aleksi", "Ville"],
      last: ["Korhonen", "Virtanen", "Mäkinen", "Nieminen", "Mäkelä", "Hämäläinen", "Laine", "Heikkinen", "Koskinen", "Järvinen"],
    },
    female: {
      first: ["Aino", "Emma", "Sofia", "Helmi", "Eevi", "Ella", "Venla", "Olivia", "Elsa", "Linnea"],
      last: ["Korhonen", "Virtanen", "Mäkinen", "Nieminen", "Mäkelä", "Hämäläinen", "Laine", "Heikkinen", "Koskinen", "Järvinen"],
    },
  },
  pl: {
    male: {
      first: ["Antoni", "Jan", "Jakub", "Aleksander", "Szymon", "Franciszek", "Filip", "Mikołaj", "Wojciech", "Adam"],
      last: ["Nowak", "Kowalski", "Wiśniewski", "Dąbrowski", "Lewandowski", "Wójcik", "Kamiński", "Kowalczyk", "Zieliński", "Szymański"],
    },
    female: {
      first: ["Zuzanna", "Julia", "Maja", "Hanna", "Lena", "Alicja", "Maria", "Amelia", "Oliwia", "Aleksandra"],
      last: ["Nowak", "Kowalski", "Wiśniewski", "Dąbrowski", "Lewandowski", "Wójcik", "Kamiński", "Kowalczyk", "Zieliński", "Szymański"],
    },
  },
  au: {
    male: {
      first: ["Oliver", "Noah", "Jack", "William", "Leo", "Lucas", "Henry", "Hudson", "Charlie", "Thomas"],
      last: ["Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Johnson", "White", "Martin", "Anderson"],
    },
    female: {
      first: ["Charlotte", "Olivia", "Amelia", "Isla", "Mia", "Ava", "Grace", "Chloe", "Willow", "Sophie"],
      last: ["Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Johnson", "White", "Martin", "Anderson"],
    },
  },
  nz: {
    male: {
      first: ["Oliver", "Noah", "Jack", "Leo", "Lucas", "George", "Hunter", "Mason", "Thomas", "Cooper"],
      last: ["Smith", "Williams", "Brown", "Wilson", "Taylor", "Jones", "White", "Robinson", "Thompson", "Campbell"],
    },
    female: {
      first: ["Isla", "Charlotte", "Amelia", "Olivia", "Mia", "Ava", "Harper", "Sophie", "Emily", "Ella"],
      last: ["Smith", "Williams", "Brown", "Wilson", "Taylor", "Jones", "White", "Robinson", "Thompson", "Campbell"],
    },
  },
  in: {
    male: {
      first: ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Krishna", "Ishaan", "Rohan", "Aryan"],
      last: ["Sharma", "Verma", "Gupta", "Mehta", "Singh", "Patel", "Reddy", "Iyer", "Khan", "Jain"],
    },
    female: {
      first: ["Aadhya", "Saanvi", "Ananya", "Diya", "Aarohi", "Ira", "Meera", "Sara", "Pari", "Navya"],
      last: ["Sharma", "Verma", "Gupta", "Mehta", "Singh", "Patel", "Reddy", "Iyer", "Khan", "Jain"],
    },
  },
  za: {
    male: {
      first: ["Liam", "Ethan", "Noah", "Jayden", "Aiden", "Logan", "Mpho", "Thabo", "Sipho", "Kagiso"],
      last: ["Smith", "Nkosi", "Naidoo", "Botha", "Van der Merwe", "Mokoena", "Khumalo", "Pillay", "Pretorius", "Nel"],
    },
    female: {
      first: ["Emily", "Olivia", "Mia", "Sophia", "Ava", "Lerato", "Thandi", "Naledi", "Nomsa", "Zanele"],
      last: ["Smith", "Nkosi", "Naidoo", "Botha", "Van der Merwe", "Mokoena", "Khumalo", "Pillay", "Pretorius", "Nel"],
    },
  },
  br: {
    male: {
      first: ["Miguel", "Arthur", "Davi", "Gabriel", "Bernardo", "Lucas", "Pedro", "Gustavo", "Matheus", "Rafael"],
      last: ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes"],
    },
    female: {
      first: ["Alice", "Sophia", "Helena", "Valentina", "Laura", "Isabella", "Manuela", "Júlia", "Heloísa", "Luiza"],
      last: ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes"],
    },
  },
};

/* -------------------------------------------------------------
   JOBS & COMPANIES
------------------------------------------------------------- */

const jobTitles = [
  "Software Engineer",
  "Product Manager",
  "UX Designer",
  "Data Analyst",
  "Sales Manager",
  "Marketing Specialist",
  "Support Engineer",
  "DevOps Engineer",
  "Project Manager",
  "Business Analyst",
];

const companyNames = [
  "Acme Corp",
  "Globex Ltd",
  "Innotech Solutions",
  "FutureSoft",
  "BlueSky Systems",
  "Northwind Group",
  "Pioneer Labs",
  "Vertex Dynamics",
  "NovaWorks",
  "BrightPath Inc",
];

/* -------------------------------------------------------------
   PHONE, POSTCODE, ADDRESS
------------------------------------------------------------- */

const generatePhoneNumber = (country: CountryCode): string => {
  switch (country) {
    case "us":
    case "ca": {
      const a = Math.floor(rand() * 900) + 100;
      const b = Math.floor(rand() * 900) + 100;
      const c = Math.floor(rand() * 9000) + 1000;
      return `(${a}) ${b}-${c}`;
    }
    case "uk": {
      const prefix = ["020", "0161", "0117", "074", "075", "077", "079"];
      const p = pick(prefix);
      const rest = Math.floor(rand() * 9000000) + 1000000; // 7 digits
      const s = rest.toString();
      return `${p} ${s.slice(0, 3)} ${s.slice(3)}`;
    }
    case "ie": {
      const prefix = ["01", "021", "061", "091", "071"];
      const p = pick(prefix);
      const rest = Math.floor(rand() * 9000000) + 1000000;
      const s = rest.toString();
      return `${p} ${s.slice(0, 3)} ${s.slice(3)}`;
    }
    case "de":
    case "fr":
    case "es":
    case "it":
    case "nl":
    case "be":
    case "pl":
    case "se":
    case "no":
    case "dk":
    case "fi":
    case "br":
    case "za":
    case "au":
    case "nz":
    case "in": {
      // Simple E.164-like +XX pattern
      const countryCodeMap: Record<CountryCode, string> = {
        us: "+1",
        ca: "+1",
        uk: "+44",
        ie: "+353",
        de: "+49",
        nl: "+31",
        be: "+32",
        fr: "+33",
        es: "+34",
        it: "+39",
        se: "+46",
        no: "+47",
        dk: "+45",
        fi: "+358",
        pl: "+48",
        au: "+61",
        nz: "+64",
        in: "+91",
        za: "+27",
        br: "+55",
      };
      const cc = countryCodeMap[country];
      const rest = Math.floor(rand() * 900000000) + 100000000; // 9 digits
      return `${cc} ${rest}`;
    }
  }
};

const generatePostcode = (country: CountryCode): string => {
  switch (country) {
    case "us":
      return String(Math.floor(rand() * 90000) + 10000); // 5-digit ZIP
    case "ca": {
      const letters = "ABCEGHJKLMNPRSTVWXYZ";
      const digits = "0123456789";
      const pattern = [
        letters[Math.floor(rand() * letters.length)],
        digits[Math.floor(rand() * digits.length)],
        letters[Math.floor(rand() * letters.length)],
        " ",
        digits[Math.floor(rand() * digits.length)],
        letters[Math.floor(rand() * letters.length)],
        digits[Math.floor(rand() * digits.length)],
      ];
      return pattern.join("");
    }
    case "uk": {
      // Very simplified UK-style pattern: AA1 1AA
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const digits = "0123456789";
      const pattern = [
        letters[Math.floor(rand() * letters.length)],
        letters[Math.floor(rand() * letters.length)],
        digits[Math.floor(rand() * digits.length)],
        " ",
        digits[Math.floor(rand() * digits.length)],
        letters[Math.floor(rand() * letters.length)],
        letters[Math.floor(rand() * letters.length)],
      ];
      return pattern.join("");
    }
    case "ie":
      return String(Math.floor(rand() * 90000) + 10000); // simple 5-digit
    case "de":
    case "fr":
    case "es":
    case "it":
    case "nl":
    case "be":
    case "pl":
      return String(Math.floor(rand() * 90000) + 10000);
    case "se":
    case "no":
    case "dk":
    case "fi":
      return String(Math.floor(rand() * 9000) + 1000); // 4-digit-ish
    case "au":
    case "nz":
      return String(Math.floor(rand() * 9000) + 1000);
    case "in":
      return String(Math.floor(rand() * 900000) + 100000);
    case "za":
      return String(Math.floor(rand() * 9000) + 1000);
    case "br":
      return String(Math.floor(rand() * 90000000) + 10000000); // 8-digit
  }
};

const generateAddress = (
  country: CountryCode,
  city: string,
  postcode: string
): string => {
  const streets = [
    "Main St",
    "Oak Avenue",
    "Elm Street",
    "Park Road",
    "High Street",
    "Church Lane",
    "Maple Drive",
    "Cedar Court",
  ];
  const number = Math.floor(rand() * 9999) + 1;
  const street = pick(streets);

  // Keep format simple but region-flavoured
  switch (country) {
    case "us":
    case "ca":
    case "au":
    case "nz":
      return `${number} ${street}, ${city}, ${postcode}`;
    case "uk":
    case "ie":
      return `${number} ${street}, ${city}, ${postcode}`;
    case "de":
    case "nl":
    case "be":
    case "fr":
    case "es":
    case "it":
    case "se":
    case "no":
    case "dk":
    case "fi":
    case "pl":
      return `${street} ${number}, ${postcode} ${city}`;
    case "in":
    case "za":
    case "br":
      return `${number} ${street}, ${city}, ${postcode}`;
  }
};

/* -------------------------------------------------------------
   BIRTHDATE
------------------------------------------------------------- */

const generateBirthDate = (age: number): string => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const year = currentYear - age;
  const month = Math.floor(rand() * 12) + 1;
  const day = Math.floor(rand() * 28) + 1; // keep it simple
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
};

/* -------------------------------------------------------------
   TYPES
------------------------------------------------------------- */

interface GeneratedName {
  firstName: string;
  lastName: string;
  gender: Gender;
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

/* -------------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------------- */

export const FakeNameGenerator = () => {
  const [gender, setGender] = useState<Gender>("random");
  const [country, setCountry] = useState<CountryCode>("us");
  // Allow input to be temporarily empty string for easier editing
  const [countInput, setCountInput] = useState<string>("5");
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);

  const createName = (): GeneratedName => {
    const meta = countryMeta[country];
    const names = nameData[country];

    const finalGender: Gender =
      gender === "random" ? (rand() > 0.5 ? "male" : "female") : gender;

    const genderPool = names[finalGender];
    const firstName = pick(genderPool.first);
    const lastName = pick(genderPool.last);

    const emailUser = sanitizeEmailUser(`${firstName}.${lastName}`) || "user";
    const emailDomain = pick(meta.emailDomains);
    const email = `${emailUser}@${emailDomain}`;

    const username = `${emailUser}${Math.floor(rand() * 10000)}`;

    const city = pick(meta.cities);
    const postalCode = generatePostcode(country);
    const address = generateAddress(country, city, postalCode);
    const phone = generatePhoneNumber(country);
    const age = Math.floor(rand() * 60) + 18;

    const jobTitle = pick(jobTitles);
    const company = pick(companyNames);
    const birthDate = generateBirthDate(age);

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

  const generateNames = () => {
    const parsed = parseInt(countInput || "", 10);
    const count = clampCount(isNaN(parsed) ? 5 : parsed);
    const list: GeneratedName[] = [];
    for (let i = 0; i < count; i++) list.push(createName());
    setGeneratedNames(list);
    setCountInput(String(count)); // normalize input value
    notify.success(`${count} names generated!`);
  };

  const copyToClipboard = async (text: string, successMsg: string) => {
    if (!text) {
      notify.error("Nothing to copy.");
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-999999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      notify.success(successMsg);
    } catch (err) {
      console.error("Failed to copy:", err);
      notify.error("Failed to copy to clipboard");
    }
  };

  const copySingleName = (n: GeneratedName) => {
    const text = [
      `${n.firstName} ${n.lastName}`,
      `Gender: ${n.gender}`,
      `Age: ${n.age}`,
      `Birth date: ${n.birthDate}`,
      `Email: ${n.email}`,
      `Username: ${n.username}`,
      `Phone: ${n.phone}`,
      `Address: ${n.address}`,
      `City: ${n.city}`,
      `Postal code: ${n.postalCode}`,
      `Country: ${n.countryName}`,
      `Nationality: ${n.nationality}`,
      `Job: ${n.jobTitle} @ ${n.company}`,
    ].join("\n");

    copyToClipboard(text, "Name copied!");
  };

  const copyAllText = () => {
    if (!generatedNames.length) {
      notify.error("No names to copy.");
      return;
    }

    const text = generatedNames
      .map(
        (n) =>
          `${n.firstName} ${n.lastName} | ${n.gender}, ${n.age} (${n.birthDate}) | ${n.email} | ${n.username} | ${n.phone} | ${n.address} | ${n.city} ${n.postalCode} | ${n.countryName} | ${n.jobTitle} @ ${n.company}`
      )
      .join("\n");

    copyToClipboard(text, "All names copied as text!");
  };

  const downloadCSV = () => {
    if (!generatedNames.length) {
      notify.error("No names to export.");
      return;
    }

    const header = [
      "First Name",
      "Last Name",
      "Gender",
      "Age",
      "Birth Date",
      "Email",
      "Username",
      "Phone",
      "Address",
      "City",
      "Postal Code",
      "Country Code",
      "Country Name",
      "Nationality",
      "Job Title",
      "Company",
    ].join(",");

    const rows = generatedNames
      .map((n) =>
        [
          escapeCsv(n.firstName),
          escapeCsv(n.lastName),
          escapeCsv(n.gender),
          escapeCsv(String(n.age)),
          escapeCsv(n.birthDate),
          escapeCsv(n.email),
          escapeCsv(n.username),
          escapeCsv(n.phone),
          escapeCsv(n.address),
          escapeCsv(n.city),
          escapeCsv(n.postalCode),
          escapeCsv(n.countryCode),
          escapeCsv(n.countryName),
          escapeCsv(n.nationality),
          escapeCsv(n.jobTitle),
          escapeCsv(n.company),
        ].join(",")
      )
      .join("\n");

    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fake-names.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success("CSV downloaded!");
  };

  const downloadJSON = () => {
    if (!generatedNames.length) {
      notify.error("No names to export.");
      return;
    }

    const blob = new Blob([JSON.stringify(generatedNames, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fake-names.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success("JSON downloaded!");
  };

  const clearNames = () => {
    setGeneratedNames([]);
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Fake Name Generator (Pro)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={gender}
                onValueChange={(value) => setGender(coerceGender(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={country}
                onValueChange={(value) =>
                  setCountry(coerceCountry(value) as CountryCode)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {countryMeta[code].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number of Names</Label>
              <Input
                type="number"
                min={MIN_COUNT}
                max={MAX_COUNT}
                value={countInput}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow temporary empty input during typing
                  if (value === "") {
                    setCountInput("");
                    return;
                  }
                  // Only allow digits
                  if (/^\d+$/.test(value)) {
                    const n = clampCount(parseInt(value, 10));
                    // Immediately clamp values larger than MAX_COUNT to prevent entering >50
                    setCountInput(String(n));
                  }
                }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={generateNames}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Generate Names
            </Button>
            <Button
              onClick={clearNames}
              variant="outline"
              className="w-full sm:w-auto flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {generatedNames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Generated Names ({generatedNames.length})
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAllText}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy All (Text)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCSV}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadJSON}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download JSON
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedNames.map((n, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-semibold">
                          {n.firstName} {n.lastName}
                        </h3>
                        <Badge variant="outline">{n.gender}</Badge>
                        <Badge variant="outline">Age: {n.age}</Badge>
                        <Badge variant="outline">{n.nationality}</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div>
                          <strong>Email:</strong> {n.email}
                        </div>
                        <div>
                          <strong>Username:</strong> {n.username}
                        </div>
                        <div>
                          <strong>Phone:</strong> {n.phone}
                        </div>
                        <div>
                          <strong>Birth date:</strong> {n.birthDate}
                        </div>
                        <div>
                          <strong>Job:</strong> {n.jobTitle}
                        </div>
                        <div>
                          <strong>Company:</strong> {n.company}
                        </div>
                        <div>
                          <strong>Address:</strong> {n.address}
                        </div>
                        <div>
                          <strong>City / Postal / Country:</strong>{" "}
                          {n.city}, {n.postalCode}, {n.countryName}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => copySingleName(n)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-xs sm:text-sm text-muted-foreground">
          <p>• All generated identities are fictional and for testing only.</p>
          <p>• Use them responsibly and within applicable laws.</p>
          <p>• Perfect for seeding databases, testing forms, and demo data.</p>
        </CardContent>
      </Card>
    </div>
  );
};
