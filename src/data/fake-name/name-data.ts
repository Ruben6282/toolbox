import { CountryCode } from "./country-codes";

export const nameData: Record<
  CountryCode,
  {
    male: { first: string[]; last: string[] };
    female: { first: string[]; last: string[] };
  }
> = {

  /* -------------------------------------------------------------
     UNITED STATES
  ------------------------------------------------------------- */
  us: {
    male: {
        first: [
        "James","Logan","Michael","Elijah","Aiden","Joseph","Carter","Owen","Caleb","Julian",
        "Wyatt","Evan","Nathan","Hunter","Cooper","Dominic","Christopher","Isaac","Grayson","Leo",
        "Aaron","Gavin","Miles","Adrian","Xavier","Jason","Zachary","Tyler","Jordan","Harrison",
        "Brandon","Austin","Elliot","Damian","Vincent","Wesley","Silas","Maxwell","Theodore","Tristan",
        "Landon","Eric","Marcus","Cole","Spencer","Jasper","Hayden","Sean","Brody","Victor"
        ],
        last: [
        "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez",
        "Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin",
        "Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson",
        "Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
        "Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts"
        ]
    },
    female: {
        first: [
        "Emma","Ava","Mia","Harper","Scarlett","Layla","Evelyn","Aria","Luna","Chloe",
        "Grace","Nora","Penelope","Hazel","Ellie","Zoe","Stella","Aurora","Addison","Brooklyn",
        "Paisley","Savannah","Anna","Skylar","Samantha","Violet","Lillian","Lucy","Bella","Camila",
        "Autumn","Ariana","Sadie","Ruby","Nova","Clara","Hadley","Faith","Eliza","Madeline",
        "Naomi","Alice","Quinn","Reagan","Piper","Ivy","Adeline","Olive","Mackenzie","Julia"
        ],
        last: [
        "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez",
        "Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin",
        "Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson",
        "Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
        "Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts"
        ]
    }
    },

  /* -------------------------------------------------------------
     CANADA
  ------------------------------------------------------------- */
  ca: {
    male: {
        first: [
        "Liam","Noah","Jackson","Logan","Benjamin","Lucas","Grayson","Carter","Wyatt","Hunter",
        "Ethan","Mason","Jacob","Nathan","Owen","Levi","Samuel","Connor","Xavier","Elias",
        "Caleb","Josiah","Theo","Miles","Austin","Gavin","Colton","Parker","Nolan","Jordan",
        "Damien","Bennett","Emmett","Avery","Jasper","Roman","Silas","Lincoln","Marcus","Christian",
        "Elliot","Declan","Hayden","Beau","Malcolm","Wesley","Callum","Reid","Spencer","Arthur"
        ],
        last: [
        "Smith","Brown","Tremblay","Martin","Roy","Gagnon","Lee","Wilson","Johnson","MacDonald",
        "Thompson","Anderson","White","Taylor","Roberts","Walker","Clark","Miller","Wright","Green",
        "Bouchard","Dubois","Gauthier","Morin","Fortin","Pelletier","Lévesque","Fournier","Simard","Nguyen",
        "Ouellet","Girard","Caron","Beaulieu","Bergeron","Lavoie","Lapointe","Gingras","Lambert","Roy",
        "Harper","Bennett","McLean","Sinclair","Hamilton","Grant","MacKenzie","Stewart","Campbell","Fraser"
        ]
    },
    female: {
        first: [
        "Emma","Olivia","Charlotte","Amelia","Ava","Isabella","Chloe","Mila","Ella","Sofia",
        "Aria","Scarlett","Violet","Lily","Abigail","Emily","Harper","Hannah","Nora","Zoe",
        "Evelyn","Aurora","Ruby","Willow","Clara","Madeline","Elena","Penelope","Hazel","Stella",
        "Quinn","Aubrey","Alice","Ivy","Sienna","Naomi","Freya","Adeline","Piper","Maeve",
        "Isla","Luna","Maya","Jade","Eloise","Reese","Paisley","Mackenzie","Aria","Georgia"
        ],
        last: [
        "Smith","Brown","Tremblay","Martin","Roy","Gagnon","Lee","Wilson","Johnson","MacDonald",
        "Thompson","Anderson","White","Taylor","Roberts","Walker","Clark","Miller","Wright","Green",
        "Bouchard","Dubois","Gauthier","Morin","Fortin","Pelletier","Lévesque","Fournier","Simard","Nguyen",
        "Ouellet","Girard","Caron","Beaulieu","Bergeron","Lavoie","Lapointe","Gingras","Lambert","Roy",
        "Harper","Bennett","McLean","Sinclair","Hamilton","Grant","MacKenzie","Stewart","Campbell","Fraser"
        ]
    }
    },

  /* -------------------------------------------------------------
     UNITED KINGDOM
  ------------------------------------------------------------- */
  uk: {
    male: {
        first: [
        "Oliver","George","Harry","Jack","Noah","Leo","Oscar","Archie","Charlie","Jacob",
        "Thomas","Freddie","Alfie","Theo","Arthur","Lucas","Elliot","Benjamin","Joseph","Finley",
        "Isaac","Jude","Reuben","Louis","Riley","Harrison","Edward","Luca","Toby","Max",
        "Adam","Sam","Blake","Owen","Callum","Dominic","Harvey","Joel","Spencer","Kieran",
        "Nathan","Hugo","Gabriel","Elias","Rowan","Miles","Caleb","Brody","Ashton","Felix"
        ],
        last: [
        "Smith","Jones","Taylor","Brown","Williams","Wilson","Johnson","Davies","Patel","Wright",
        "Robinson","Thompson","White","Walker","Green","Evans","King","Hill","Scott","Moore",
        "Clark","Harris","Edwards","Morgan","Mitchell","Ward","Turner","Phillips","James","Watson",
        "Dyer","Barker","Reid","Foster","Pearson","Gray","Simmonds","Stevens","Lane","Bennett",
        "Miller","Holmes","Carter","Chapman","Matthews","Collins","Hunt","Marshall","Webb","Stone"
        ]
    },
    female: {
        first: [
        "Olivia","Amelia","Isla","Ava","Mia","Freya","Lily","Grace","Evie","Sophia",
        "Ella","Poppy","Charlotte","Willow","Sienna","Harper","Daisy","Millie","Rosie","Chloe",
        "Evelyn","Emma","Molly","Lottie","Ruby","Phoebe","Esme","Hollie","Maeve","Alice",
        "Elsie","Thea","Nina","Heidi","Ivy","Aria","Bella","Luna","Nora","Zara",
        "Florence","Matilda","Georgia","Summer","Clara","Sadie","Eliza","Hazel","Brooke","Imogen"
        ],
        last: [
        "Smith","Jones","Taylor","Brown","Williams","Wilson","Johnson","Davies","Patel","Wright",
        "Robinson","Thompson","White","Walker","Green","Evans","King","Hill","Scott","Moore",
        "Clark","Harris","Edwards","Morgan","Mitchell","Ward","Turner","Phillips","James","Watson",
        "Dyer","Barker","Reid","Foster","Pearson","Gray","Simmonds","Stevens","Lane","Bennett",
        "Miller","Holmes","Carter","Chapman","Matthews","Collins","Hunt","Marshall","Webb","Stone"
        ]
    }
    },
  /* -------------------------------------------------------------
     IRELAND
  ------------------------------------------------------------- */
  ie: {
    male: {
        first: [
        "Jack","James","Noah","Charlie","Daniel","Adam","Alex","Liam","Patrick","Oisin",
        "Finn","Conor","Michael","Luke","Rian","Sean","Mark","Harry","Tadhg","Cillian",
        "Oscar","Jacob","Evan","Callum","Rory","Shane","Cathal","Dara","Aidan","Fionn",
        "Eoghan","Killian","Ruairi","Tomás","Colin","Eoin","Daithi","Niall","Stephen","Ronán",
        "Pierce","Colm","Keegan","Malachy","Donal","Tiernan","Shay","Barry","Oran","Brendan"
        ],
        last: [
        "Murphy","Kelly","O'Sullivan","Walsh","Smith","O'Brien","Byrne","Ryan","O'Connor","Doyle",
        "McCarthy","Gallagher","O'Neill","Dunne","McDonagh","Brennan","Reilly","Lynch","Hayes","Collins",
        "Healy","McLaughlin","Kavanagh","Quinn","Murray","Burke","Casey","Fitzgerald","Buckley","Carroll",
        "Barry","Higgins","Flynn","Kenny","Curtin","Sheehan","O'Donnell","Clancy","Gleeson","Power",
        "Ward","Hogan","Moore","Regan","Bolger","O'Rourke","Maher","Brady","Dolan","Tobin"
        ]
    },
    female: {
        first: [
        "Emily","Grace","Sophie","Amelia","Ella","Hannah","Aoife","Emma","Lucy","Chloe",
        "Molly","Freya","Katie","Erin","Ruby","Sarah","Ciara","Isla","Abigail","Leah",
        "Sadhbh","Niamh","Anna","Roise","Clodagh","Ava","Kayla","Holly","Zoe","Orla",
        "Faye","Eabha","Aisling","Saoirse","Maya","Tara","Meabh","Jasmine","Nessa","Indie",
        "Aine","Roisin","Keira","Lara","Heidi","Amber","Lyra","Nola","Blaithin","Elodie"
        ],
        last: [
        "Murphy","Kelly","O'Sullivan","Walsh","Smith","O'Brien","Byrne","Ryan","O'Connor","Doyle",
        "McCarthy","Gallagher","O'Neill","Dunne","McDonagh","Brennan","Reilly","Lynch","Hayes","Collins",
        "Healy","McLaughlin","Kavanagh","Quinn","Murray","Burke","Casey","Fitzgerald","Buckley","Carroll",
        "Barry","Higgins","Flynn","Kenny","Curtin","Sheehan","O'Donnell","Clancy","Gleeson","Power",
        "Ward","Hogan","Moore","Regan","Bolger","O'Rourke","Maher","Brady","Dolan","Tobin"
        ]
    }
    },

  /* -------------------------------------------------------------
     GERMANY
  ------------------------------------------------------------- */
  de: {
    male: {
        first: [
        "Leon","Paul","Ben","Finn","Elias","Jonas","Luis","Noah","Felix","Maximilian",
        "Luca","Henry","Theo","Oskar","Jakob","Tim","Jannik","Till","Matteo","Jonathan",
        "Moritz","Emil","David","Karl","Anton","Simon","Tobias","Niklas","Marlon","Fabian",
        "Philipp","Hannes","Linus","Jan","Benedikt","Florian","Vincent","Robin","Erik","Tom",
        "Kilian","Matthias","Samuel","Lennart","Fabio","Sebastian","Leander","Raphael","Hagen","Oliver"
        ],
        last: [
        "Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann",
        "Koch","Bauer","Richter","Klein","Wolf","Schröder","Neumann","Schwarz","Zimmermann","Braun",
        "Krüger","Hofmann","Hartmann","Lange","Schmitt","Werner","Schmitz","Krause","Meier","Lehmann",
        "Schmid","Schulze","Maier","Köhler","Herrmann","Walter","König","Mayer","Huber","Fuchs",
        "Peters","Lang","Scholz","Möller","Weiß","Jung","Keller","Vogel","Freitag","Schreiber"
        ]
    },
    female: {
        first: [
        "Mia","Emma","Hannah","Sophia","Lea","Anna","Lina","Sofia","Emilia","Marie",
        "Ella","Ida","Clara","Lara","Luisa","Paula","Melina","Frieda","Greta","Charlotte",
        "Johanna","Isabell","Helena","Maja","Amelie","Elina","Ronja","Carla","Annalena","Tilda",
        "Zoe","Selina","Marlene","Lilly","Jana","Alina","Eva","Merle","Nora","Mira",
        "Pauline","Leni","Antonia","Josephine","Rosalie","Annika","Fiona","Klara","Malia","Liv"
        ],
        last: [
        "Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann",
        "Koch","Bauer","Richter","Klein","Wolf","Schröder","Neumann","Schwarz","Zimmermann","Braun",
        "Krüger","Hofmann","Hartmann","Lange","Schmitt","Werner","Schmitz","Krause","Meier","Lehmann",
        "Schmid","Schulze","Maier","Köhler","Herrmann","Walter","König","Mayer","Huber","Fuchs",
        "Peters","Lang","Scholz","Möller","Weiß","Jung","Keller","Vogel","Freitag","Schreiber"
        ]
    }
    },

  /* -------------------------------------------------------------
     NETHERLANDS
  ------------------------------------------------------------- */
  nl: {
    male: {
        first: [
        "Daan","Sem","Lucas","Levi","Finn","Luuk","Milan","Bram","Thijs","Jesse",
        "Noah","Gijs","Ruben","Lars","Timo","Pim","Joep","Mees","Sander","Olivier",
        "Hugo","Niek","Rens","Wout","Floris","Max","Noud","Siem","Bas","Kaj",
        "Jorn","Dion","Roan","Ties","Pepijn","Vince","Mick","Jurre","Stan","Teun",
        "Wes","Yannick","Cas","Sjoerd","Dylan","Jelmer","Quinten","Niels","Twan","Odin"
        ],
        last: [
        "De Jong","Jansen","De Vries","Van den Berg","Bakker","Visser","Smit","Meijer","Mulder","De Boer",
        "Bos","Vos","Peters","Hendriks","Van Dijk","Kok","Verhoeven","Willems","Van der Meer","Dekker",
        "Brouwer","Sanders","Hoekstra","Maas","Van Leeuwen","Kuiper","Van Dam","Van der Heijden","Molenaar","Prins",
        "Blom","Post","Scholten","Koster","Veenstra","Jonker","Peeters","Gerritsen","Kramer","Vermeulen",
        "Van den Heuvel","Boer","Groen","Vissers","Schaap","Hermans","Smits","Koopman","Korver","Schouten"
        ]
    },
    female: {
        first: [
        "Emma","Julia","Sophie","Anna","Tess","Lisa","Sara","Eva","Lotte","Noa",
        "Fleur","Roos","Yara","Mila","Luna","Evi","Liv","Nina","Lena","Sofie",
        "Isabel","Merel","Benthe","Romy","Sterre","Iris","Karlijn","Maud","Vera","Mare",
        "Loïs","Linde","Saar","Keet","Fenna","Elin","Amélie","Jill","Maya","Zara",
        "Nova","Cato","Puck","Tessa","Amira","Livia","Bibi","Naomi","Ilse","Floor"
        ],
        last: [
        "De Jong","Jansen","De Vries","Van den Berg","Bakker","Visser","Smit","Meijer","Mulder","De Boer",
        "Bos","Vos","Peters","Hendriks","Van Dijk","Kok","Verhoeven","Willems","Van der Meer","Dekker",
        "Brouwer","Sanders","Hoekstra","Maas","Van Leeuwen","Kuiper","Van Dam","Van der Heijden","Molenaar","Prins",
        "Blom","Post","Scholten","Koster","Veenstra","Jonker","Peeters","Gerritsen","Kramer","Vermeulen",
        "Van den Heuvel","Boer","Groen","Vissers","Schaap","Hermans","Smits","Koopman","Korver","Schouten"
        ]
    }
    },

  /* -------------------------------------------------------------
     BELGIUM
  ------------------------------------------------------------- */
  be: {
    male: {
        first: [
        "Lucas","Louis","Noah","Arthur","Jules","Liam","Adam","Victor","Finn","Thomas",
        "Maxime","Nathan","Ethan","Milan","Lars","Emiel","Arne","Robin","Thibault","Mathis",
        "Baptiste","Simon","Oscar","Alexander","Gabriel","Tibo","Nicolas","Stan","Kobe","Jonathan",
        "Dries","Anton","Quentin","Hugo","Bram","Cédric","Axel","Samuel","Matteo","Xander",
        "Elias","Ruben","Adrien","Maarten","Sébastien","Laurens","Olivier","Florian","Yanick","Dorian"
        ],
        last: [
        "Peeters","Janssens","Maes","Jacobs","Mertens","Willems","Claes","Goossens","De Smet","Dubois",
        "Lemmens","Van Damme","De Clercq","Verhoeven","Desmet","Martens","Dupont","Lambert","Vandenberghe","Van den Bossche",
        "Declercq","De Backer","Gérard","Michiels","De Winter","Vandamme","Dupuis","De Meyer","Lefevre","Van Acker",
        "De Wilde","De Ridder","Lacroix","Vermeulen","Vanderlinden","Vandenberg","François","Maillard","Vandecasteele","Vermeire",
        "De Block","De Bruyn","Leroy","Vandewalle","Renard","De Vos","De Coninck","Collard","De Roeck","Wouters"
        ]
    },
    female: {
        first: [
        "Emma","Louise","Olivia","Mila","Elise","Marie","Lina","Nora","Zoé","Alice",
        "Anna","Chloé","Ella","Tess","Lisa","Camille","Sophie","Lara","Fien","Elena",
        "Sarah","Amélie","Valentina","June","Lotte","Yasmine","Oona","Livia","Helena","Pauline",
        "Marthe","Manon","Kaat","Victoire","Lea","Noor","Rune","Isaline","Charlotte","Hanne",
        "Féline","Maya","Alixe","Lilly","Alicia","Sofia","Jade","Rosalie","Nella","Émilie"
        ],
        last: [
        "Peeters","Janssens","Maes","Jacobs","Mertens","Willems","Claes","Goossens","De Smet","Dubois",
        "Lemmens","Van Damme","De Clercq","Verhoeven","Desmet","Martens","Dupont","Lambert","Vandenberghe","Van den Bossche",
        "Declercq","De Backer","Gérard","Michiels","De Winter","Vandamme","Dupuis","De Meyer","Lefevre","Van Acker",
        "De Wilde","De Ridder","Lacroix","Vermeulen","Vanderlinden","Vandenberg","François","Maillard","Vandecasteele","Vermeire",
        "De Block","De Bruyn","Leroy","Vandewalle","Renard","De Vos","De Coninck","Collard","De Roeck","Wouters"
        ]
    }
    },

  /* -------------------------------------------------------------
     FRANCE
  ------------------------------------------------------------- */
  fr: {
    male: {
        first: [
        "Lucas","Gabriel","Louis","Arthur","Léo","Raphaël","Nathan","Jules","Hugo","Ethan",
        "Noah","Mathis","Tom","Sacha","Théo","Maxime","Baptiste","Antoine","Paul","Alexandre",
        "Enzo","Matéo","Clément","Adrien","Nolan","Simon","Martin","Victor","Evan","Gaspard",
        "Quentin","Robin","Basile","Tristan","Florian","Julien","Marin","Timothée","Thibault","Maël",
        "Corentin","Samuel","Eliott","Rayan","César","Lorenzo","Oscar","Valentin","Damien","Amaury"
        ],
        last: [
        "Martin","Bernard","Thomas","Petit","Robert","Richard","Durand","Dubois","Moreau","Laurent",
        "Simon","Michel","Lefebvre","Leroy","Roux","David","Bertrand","Morel","Fournier","Girard",
        "Bonnet","Dupont","Lambert","Fontaine","Rousseau","Vincent","Muller","Lefèvre","Faure","Andre",
        "Mercier","Blanc","Guerin","Boyer","Garnier","Chevalier","Francois","Legrand","Gauthier","Garcia",
        "Perrin","Robin","Andre","Meyer","Lucas","Fernandez","Masson","Marchand","Barbier","Brun"
        ]
    },
    female: {
        first: [
        "Emma","Louise","Chloé","Léa","Camille","Manon","Sarah","Inès","Jade","Zoé",
        "Alice","Anna","Lina","Clara","Maëlys","Juliette","Romane","Nina","Ambre","Eva",
        "Océane","Mélissa","Alicia","Lucie","Louna","Sofia","Mila","Lyana","Amandine","Elsa",
        "Justine","Margot","Agathe","Salomé","Adèle","Héloïse","Noémie","Elina","Maddie","Rose",
        "Victoire","Iris","Capucine","Élodie","Lison","Jeanne","Marion","Aurélie","Yasmine","Ophélie"
        ],
        last: [
        "Martin","Bernard","Thomas","Petit","Robert","Richard","Durand","Dubois","Moreau","Laurent",
        "Simon","Michel","Lefebvre","Leroy","Roux","David","Bertrand","Morel","Fournier","Girard",
        "Bonnet","Dupont","Lambert","Fontaine","Rousseau","Vincent","Muller","Lefèvre","Faure","Andre",
        "Mercier","Blanc","Guerin","Boyer","Garnier","Chevalier","Francois","Legrand","Gauthier","Garcia",
        "Perrin","Robin","Andre","Meyer","Lucas","Fernandez","Masson","Marchand","Barbier","Brun"
        ]
    }
    },

  /* -------------------------------------------------------------
     SPAIN
  ------------------------------------------------------------- */
  es: {
    male: {
        first: [
        "Hugo","Daniel","Pablo","Alejandro","Adrián","Mario","David","Diego","Javier","Marco",
        "Raúl","Sergio","Bruno","Mateo","Álvaro","Rubén","Iván","Álex","Iago","Samuel",
        "Fernando","Gabriel","Ismael","Oscar","Nicolás","Rafael","Víctor","Gonzalo","Tomás","Lucas",
        "Rodrigo","Jaime","Saúl","Julián","Andrés","Héctor","Martín","Unai","Thiago","Enrique",
        "Ramón","Cristian","Manuel","Darío","Alfonso","Borja","Elías","Emilio","Ignacio","Esteban"
        ],
        last: [
        "García","Martínez","López","Sánchez","Pérez","Gómez","Fernández","Díaz","Rodríguez","Moreno",
        "Álvarez","Jiménez","Muñoz","Romero","Rubio","Molina","Delgado","Hernández","Torres","Castro",
        "Ortega","Vargas","Cruz","Reyes","Aguilar","Marín","Ibáñez","Santos","Guerrero","Ramos",
        "Suárez","Navarro","Domínguez","Vega","Campos","León","Arias","Herrera","Silva","Rojas",
        "Camacho","Cano","Fuentes","Calvo","Peña","Nieto","Solís","Bravo","Vidal","Beltrán"
        ]
    },
    female: {
        first: [
        "Lucía","Sofía","Martina","María","Julia","Emma","Paula","Valeria","Daniela","Carla",
        "Marta","Claudia","Alba","Noa","Elena","Jimena","Irene","Abril","Rocío","Laia",
        "Aitana","Lola","Vera","Ona","Alicia","Olaya","Nerea","Triana","Blanca","Lidia",
        "Candela","Ariadna","Yaiza","Marina","Lara","Celia","Aroa","Ainhoa","Lúa","Salma",
        "Malena","Adriana","Nora","Isabel","Pilar","Teresa","Sarai","Aina","Carol","Mara"
        ],
        last: [
        "García","Martínez","López","Sánchez","Pérez","Gómez","Fernández","Díaz","Rodríguez","Moreno",
        "Álvarez","Jiménez","Muñoz","Romero","Rubio","Molina","Delgado","Hernández","Torres","Castro",
        "Ortega","Vargas","Cruz","Reyes","Aguilar","Marín","Ibáñez","Santos","Guerrero","Ramos",
        "Suárez","Navarro","Domínguez","Vega","Campos","León","Arias","Herrera","Silva","Rojas",
        "Camacho","Cano","Fuentes","Calvo","Peña","Nieto","Solís","Bravo","Vidal","Beltrán"
        ]
    }
    },

  /* -------------------------------------------------------------
     ITALY
  ------------------------------------------------------------- */
  it: {
    male: {
        first: [
        "Leonardo","Francesco","Alessandro","Lorenzo","Mattia","Andrea","Gabriele","Riccardo","Tommaso","Edoardo",
        "Giovanni","Simone","Angelo","Marco","Federico","Pietro","Nicola","Michele","Stefano","Daniele",
        "Cristian","Giorgio","Enrico","Luca","Massimo","Vittorio","Dario","Fabio","Carlo","Raffaele",
        "Renato","Moreno","Salvatore","Sergio","Giulio","Mirko","Antonio","Alberto","Damiano","Matteo",
        "Pierluigi","Franco","Leone","Ruggero","Elia","Vincenzo","Tiziano","Claudio","Filippo","Umberto"
        ],
        last: [
        "Rossi","Russo","Ferrari","Esposito","Bianchi","Romano","Colombo","Ricci","Marino","Greco",
        "Conti","Lombardi","Gallo","Costa","Fontana","Moretti","Pellegrini","Caruso","Giordano","Mancini",
        "Rizzo","Ferraro","Ferri","Barbieri","De Luca","Bianco","Mariani","Benetti","Sartori","Grasso",
        "Guerra","Palmieri","Sanna","Fabbri","Martini","Parisi","Villa","Bruno","Testa","Longo",
        "Monti","Farina","Neri","Pagano","Ruggiero","Bellini","Battaglia","Piras","Costantini","Orlando"
        ]
    },
    female: {
        first: [
        "Sofia","Giulia","Aurora","Alice","Giorgia","Emma","Martina","Greta","Chiara","Anna",
        "Viola","Bianca","Elena","Camilla","Alessia","Noemi","Sara","Arianna","Beatrice","Lucrezia",
        "Carlotta","Paola","Eleonora","Maddalena","Rachele","Isabella","Valentina","Miriam","Francesca","Elisa",
        "Ludovica","Allegra","Caterina","Serena","Federica","Silvia","Angela","Benedetta","Claudia","Patrizia",
        "Flavia","Cristina","Rita","Marta","Rebecca","Monica","Ilaria","Roberta","Daniela","Tamara"
        ],
        last: [
        "Rossi","Russo","Ferrari","Esposito","Bianchi","Romano","Colombo","Ricci","Marino","Greco",
        "Conti","Lombardi","Gallo","Costa","Fontana","Moretti","Pellegrini","Caruso","Giordano","Mancini",
        "Rizzo","Ferraro","Ferri","Barbieri","De Luca","Bianco","Mariani","Benetti","Sartori","Grasso",
        "Guerra","Palmieri","Sanna","Fabbri","Martini","Parisi","Villa","Bruno","Testa","Longo",
        "Monti","Farina","Neri","Pagano","Ruggiero","Bellini","Battaglia","Piras","Costantini","Orlando"
        ]
    }
    },

  /* -------------------------------------------------------------
     SWEDEN
  ------------------------------------------------------------- */
  se: {
    male: {
        first: [
        "William","Liam","Noah","Elias","Oscar","Lucas","Hugo","Oliver","Alexander","Viktor",
        "Isak","Theo","Emil","Albin","Leo","Ludvig","Filip","Vincent","Melvin","Elton",
        "Arvid","Sixten","Axel","Malte","Milton","Jonathan","Nils","Felix","Sam","Wilmer",
        "Henry","Benjamin","Casper","Vidar","Algot","Kian","Ivar","Elis","Ebbe","Jasper",
        "Tage","Colin","Otto","August","Melker","Theodor","Sigge","Milo","Kevin","Olle"
        ],
        last: [
        "Johansson","Andersson","Karlsson","Nilsson","Eriksson","Larsson","Olsson","Persson","Svensson","Gustafsson",
        "Pettersson","Jonsson","Jansson","Hansson","Bengtsson","Lindberg","Jakobsson","Magnusson","Olofsson","Lindström",
        "Lundberg","Berg","Holm","Lundgren","Björk","Eklund","Sjöberg","Axelsson","Mattsson","Nordström",
        "Blom","Sandberg","Hedlund","Holmgren","Ekström","Nyström","Falk","Wallin","Lind","Hedberg",
        "Håkansson","Samuelsson","Ström","Engström","Paulsson","Nyberg","Ek","Wallgren","Fransson","Sundberg"
        ]
    },
    female: {
        first: [
        "Alice","Maja","Elsa","Ella","Wilma","Ebba","Astrid","Alma","Molly","Agnes",
        "Saga","Freja","Stella","Vera","Ines","Signe","Tilde","Emilia","Lovisa","Selma",
        "Ida","Alva","Juni","Sofia","Ellen","Liv","Filippa","Joline","Nora","Hedda",
        "Tuva","Moá","Nellie","Ronja","Tyra","Jasmine","Lykke","Daniella","Hanna","Elvira",
        "Melina","Thea","Mira","Nova","Livia","Elina","Leia","Märta","Tilda","Linnea"
        ],
        last: [
        "Johansson","Andersson","Karlsson","Nilsson","Eriksson","Larsson","Olsson","Persson","Svensson","Gustafsson",
        "Pettersson","Jonsson","Jansson","Hansson","Bengtsson","Lindberg","Jakobsson","Magnusson","Olofsson","Lindström",
        "Lundberg","Berg","Holm","Lundgren","Björk","Eklund","Sjöberg","Axelsson","Mattsson","Nordström",
        "Blom","Sandberg","Hedlund","Holmgren","Ekström","Nyström","Falk","Wallin","Lind","Hedberg",
        "Håkansson","Samuelsson","Ström","Engström","Paulsson","Nyberg","Ek","Wallgren","Fransson","Sundberg"
        ]
    }
    },

  /* -------------------------------------------------------------
     NORWAY
  ------------------------------------------------------------- */
  no: {
    male: {
        first: [
        "Jakob","Emil","Oliver","Noah","Filip","Aksel","Oskar","William","Lucas","Håkon",
        "Magnus","Tobias","Isak","Henrik","Jonas","Sander","Mikkel","Theodor","Markus","Johannes",
        "Marius","Hallvard","Elias","Nikolai","Vetle","Eirik","Jens","Adrian","Ulrik","Even",
        "Leander","Sivert","Storm","Odin","Jonathan","Simen","Tormod","Stian","Tellef","Kristian",
        "Mats","Fredrik","Tarjei","Kasper","Steinar","Ludvig","Halvard","Knut","Sindre","Benjamin"
        ],
        last: [
        "Hansen","Johansen","Olsen","Larsen","Andersen","Pedersen","Nilsen","Kristiansen","Jensen","Karlsen",
        "Pettersen","Eriksen","Berg","Haugen","Johannessen","Andreassen","Paulsen","Svendsen","Sørensen","Moen",
        "Mortensen","Martinsen","Iversen","Antonsen","Gundersen","Holm","Lie","Strand","Aas","Myhre",
        "Lunde","Sæther","Haug","Amundsen","Solberg","Moe","Dahl","Lund","Knutsen","Aasen",
        "Bakke","Thorsen","Fredriksen","Hauge","Helland","Dalen","Løken","Nygård","Tveit","Sand"
        ]
    },
    female: {
        first: [
        "Nora","Emma","Sara","Ingrid","Sofie","Emilie","Ida","Thea","Maja","Anna",
        "Sigrid","Tuva","Hedda","Iben","Frida","Kaja","Vilde","Oda","Aurora","Selma",
        "Julie","Ella","Linnea","Mina","Eira","Synne","Alma","Iselin","Tiril","Vera",
        "Amalie","Live","Mathilde","Hanna","Jenny","Mari","Mille","Ronja","Ylva","Monica",
        "Helle","Helene","Lovise","Malin","Kristine","Marte","Karoline","Evelina","Leah","Solveig"
        ],
        last: [
        "Hansen","Johansen","Olsen","Larsen","Andersen","Pedersen","Nilsen","Kristiansen","Jensen","Karlsen",
        "Pettersen","Eriksen","Berg","Haugen","Johannessen","Andreassen","Paulsen","Svendsen","Sørensen","Moen",
        "Mortensen","Martinsen","Iversen","Antonsen","Gundersen","Holm","Lie","Strand","Aas","Myhre",
        "Lunde","Sæther","Haug","Amundsen","Solberg","Moe","Dahl","Lund","Knutsen","Aasen",
        "Bakke","Thorsen","Fredriksen","Hauge","Helland","Dalen","Løken","Nygård","Tveit","Sand"
        ]
    }
    },

  /* -------------------------------------------------------------
     DENMARK
  ------------------------------------------------------------- */
  dk: {
    male: {
        first: [
        "William","Noah","Oscar","Lucas","Victor","Malthe","Magnus","Emil","Oliver","Elias",
        "Frederik","Aksel","Christian","Marius","August","Silas","Albert","Tobias","Felix","Nikolaj",
        "Liam","Mathias","Asger","Valdemar","Laurits","Storm","Villads","Johan","Otto","Brody",
        "Jonas","Holger","Lauge","Thor","Benjamin","Rasmus","Kasper","Bjørn","Mikkel","Lasse",
        "Vilhelm","Jeppe","Hjalte","Anker","Kenny","Søren","Henrik","Karsten","Rune","Stefan"
        ],
        last: [
        "Jensen","Nielsen","Hansen","Pedersen","Andersen","Christensen","Larsen","Sørensen","Rasmussen","Jørgensen",
        "Petersen","Madsen","Kristensen","Olsen","Thomsen","Christiansen","Poulsen","Johansen","Møller","Mortensen",
        "Knudsen","Clausen","Bach","Holm","Simonsen","Frandsen","Bonde","Schmidt","Dam","Munk",
        "Lund","Krogh","Vestergaard","Bang","Bjerregaard","Skov","Dalgaard","Hald","Friis","Haugaard",
        "Koch","Brandt","Møller","Riis","Hoffmann","Bach","Foged","Bech","Dal","Holst"
        ]
    },
    female: {
        first: [
        "Sofie","Ida","Emma","Freja","Clara","Laura","Anna","Maja","Caroline","Sarah",
        "Olivia","Astrid","Julie","Alma","Lærke","Josefine","Filippa","Silke","Tilde","Cecilie",
        "Nora","Leonora","Signe","Agnes","Mille","Marie","Alberte","Amalie","Nanna","Ellinor",
        "Ronja","Liv","Thyra","Mira","Mathilde","Ella","Siri","Selma","Saga","Asta",
        "Andrea","Vera","Melissa","Evelina","Nina","Sabrina","Elin","Karla","Jasmin","Bolette"
        ],
        last: [
        "Jensen","Nielsen","Hansen","Pedersen","Andersen","Christensen","Larsen","Sørensen","Rasmussen","Jørgensen",
        "Petersen","Madsen","Kristensen","Olsen","Thomsen","Christiansen","Poulsen","Johansen","Møller","Mortensen",
        "Knudsen","Clausen","Bach","Holm","Simonsen","Frandsen","Bonde","Schmidt","Dam","Munk",
        "Lund","Krogh","Vestergaard","Bang","Bjerregaard","Skov","Dalgaard","Hald","Friis","Haugaard",
        "Koch","Brandt","Møller","Riis","Hoffmann","Bach","Foged","Bech","Dal","Holst"
        ]
    }
    },

  /* -------------------------------------------------------------
     FINLAND
  ------------------------------------------------------------- */
  fi: {
    male: {
        first: [
        "Eeli","Onni","Eino","Leo","Veeti","Miska","Matti","Juho","Aleksi","Ville",
        "Toivo","Aapo","Otso","Arttu","Oskari","Lauri","Niklas","Joel","Eemil","Anssi",
        "Paavo","Santeri","Ilmari","Sakari","Teemu","Kristian","Henri","Aatu","Roope","Jesse",
        "Samuli","Topi","Väinö","Jere","Anton","Petri","Joni","Armas","Pyry","Valtteri",
        "Kimi","Konsta","Kaspar","Vilho","Eeli","Eljas","Jalo","Iivo","Miika","Olli"
        ],
        last: [
        "Korhonen","Virtanen","Mäkinen","Nieminen","Mäkelä","Hämäläinen","Laine","Heikkinen","Koskinen","Järvinen",
        "Lehtonen","Lehtinen","Tuominen","Saarinen","Salminen","Heinonen","Niemi","Kinnunen","Karjalainen","Aalto",
        "Rantanen","Kallio","Hiltunen","Ojala","Savolainen","Räsänen","Ahonen","Moilanen","Vainio","Hirvonen",
        "Kekkonen","Pietilä","Harju","Miettinen","Peltonen","Korpela","Koivisto","Uusitalo","Holopainen","Tolonen",
        "Jokinen","Klemola","Pakkanen","Vartiainen","Lampinen","Kuusela","Tamminen","Harjula","Leppänen","Rajala"
        ]
    },
    female: {
        first: [
        "Aino","Emma","Sofia","Helmi","Eevi","Ella","Venla","Olivia","Elsa","Linnea",
        "Ilona","Kerttu","Saana","Anni","Meri","Hilla","Sanni","Noora","Minna","Aada",
        "Oona","Lotta","Kaisa","Hanne","Elviira","Eevi","Johanna","Riina","Saara","Katri",
        "Hilda","Kaisu","Mimosa","Minttu","Iida","Pihla","Anita","Vilja","Tarja","Varpu",
        "Kreeta","Elina","Saila","Mira","Paula","Tanja","Rauha","Siiri","Salla","Tuuli"
        ],
        last: [
        "Korhonen","Virtanen","Mäkinen","Nieminen","Mäkelä","Hämäläinen","Laine","Heikkinen","Koskinen","Järvinen",
        "Lehtonen","Lehtinen","Tuominen","Saarinen","Salminen","Heinonen","Niemi","Kinnunen","Karjalainen","Aalto",
        "Rantanen","Kallio","Hiltunen","Ojala","Savolainen","Räsänen","Ahonen","Moilanen","Vainio","Hirvonen",
        "Kekkonen","Pietilä","Harju","Miettinen","Peltonen","Korpela","Koivisto","Uusitalo","Holopainen","Tolonen",
        "Jokinen","Klemola","Pakkanen","Vartiainen","Lampinen","Kuusela","Tamminen","Harjula","Leppänen","Rajala"
        ]
    }
    },

  /* -------------------------------------------------------------
     POLAND
  ------------------------------------------------------------- */
  pl: {
    male: {
        first: [
        "Antoni","Jan","Jakub","Aleksander","Szymon","Franciszek","Filip","Mikołaj","Wojciech","Adam",
        "Tymon","Kacper","Leon","Natan","Mateusz","Borys","Milan","Julian","Igor","Patryk",
        "Damian","Rafał","Karol","Tomasz","Daniel","Marek","Andrzej","Sebastian","Krystian","Oskar",
        "Bartłomiej","Maciej","Kamil","Łukasz","Dawid","Hubert","Piotr","Mariusz","Adrian","Dominik",
        "Emil","Kornel","Ksawery","Fabian","Grzegorz","Oliwier","Kajetan","Florian","Witold","Jerzy"
        ],
        last: [
        "Nowak","Kowalski","Wiśniewski","Dąbrowski","Lewandowski","Wójcik","Kamiński","Kowalczyk","Zieliński","Szymański",
        "Woźniak","Kozłowski","Jankowski","Mazur","Krawczyk","Kaczmarek","Piotrowski","Grabowski","Zając","Pawłowski",
        "Michalski","Król","Nowakowski","Wieczorek","Jabłoński","Dudek","Stępień","Górski","Pawlak","Sikora",
        "Walczak","Baran","Rutkowski","Michalak","Szewczyk","Ostrowski","Tomaszewski","Zalewski","Wróbel","Marciniak",
        "Adamczyk","Jasiński","Bąk","Borowski","Szczepański","Lis","Chmielewski","Wilk","Świątek","Urbaniak"
        ]
    },
    female: {
        first: [
        "Zuzanna","Julia","Maja","Hanna","Lena","Alicja","Maria","Amelia","Oliwia","Aleksandra",
        "Michalina","Nadia","Gabriela","Wiktoria","Emilia","Klara","Pola","Laura","Natalia","Jagoda",
        "Karolina","Kalina","Nela","Malwina","Blanka","Izabela","Magdalena","Daria","Patrycja","Joanna",
        "Weronika","Dominika","Aniela","Helena","Łucja","Liliana","Iga","Marcelina","Eliza","Martyna",
        "Justyna","Agata","Dagmara","Ewelina","Milena","Aurelia","Sylwia","Roksana","Bianka","Kamila"
        ],
        last: [
        "Nowak","Kowalski","Wiśniewski","Dąbrowski","Lewandowski","Wójcik","Kamiński","Kowalczyk","Zieliński","Szymański",
        "Woźniak","Kozłowski","Jankowski","Mazur","Krawczyk","Kaczmarek","Piotrowski","Grabowski","Zając","Pawłowski",
        "Michalski","Król","Nowakowski","Wieczorek","Jabłoński","Dudek","Stępień","Górski","Pawlak","Sikora",
        "Walczak","Baran","Rutkowski","Michalak","Szewczyk","Ostrowski","Tomaszewski","Zalewski","Wróbel","Marciniak",
        "Adamczyk","Jasiński","Bąk","Borowski","Szczepański","Lis","Chmielewski","Wilk","Świątek","Urbаниак"
        ]
    }
    },

  /* -------------------------------------------------------------
     AUSTRALIA
  ------------------------------------------------------------- */
  au: {
    male: {
        first: [
        "Oliver","Noah","Jack","William","Leo","Lucas","Henry","Hudson","Charlie","Thomas",
        "Archie","Hunter","Mason","Harry","James","Ethan","Alexander","Samuel","Joshua","Finn",
        "Beau","Harvey","Isaac","Theo","Sebastian","Jaxon","Archer","Austin","Flynn","Miles",
        "Luca","Nate","Riley","Jordan","Cooper","Xavier","Parker","Blake","Kai","Zach",
        "Ashton","Hayden","Callum","Spencer","Aiden","Declan","Mitchell","Alex","Tyler","Damian"
        ],
        last: [
        "Smith","Jones","Williams","Brown","Wilson","Taylor","Johnson","White","Martin","Anderson",
        "Thompson","Thomas","Walker","Harris","Lee","Ryan","Robinson","Lewis","Young","King",
        "Hall","Allen","Wright","Scott","Green","Baker","Adams","Mitchell","Campbell","Miller",
        "Carter","Murphy","Rogers","Morgan","Evans","Stewart","Parker","Foster","Reid","Griffin",
        "Bell","Coleman","Hayes","Chapman","Ward","Cooper","Spence","Armstrong","McDonald","Burns"
        ]
    },
    female: {
        first: [
        "Charlotte","Olivia","Amelia","Isla","Mia","Ava","Grace","Chloe","Willow","Sophie",
        "Ella","Violet","Hazel","Matilda","Harper","Zara","Aria","Layla","Imogen","Phoebe",
        "Evelyn","Stella","Georgia","Savannah","Freya","Mackenzie","Summer","Heidi","Eloise","Piper",
        "Abigail","Sienna","Mila","Rosie","Maeve","Ayla","Lexi","Hallie","Luna","Belle",
        "Maddison","Kiara","Elsie","Penelope","Olive","Thea","Alana","Darcy","Poppy","Claudia"
        ],
        last: [
        "Smith","Jones","Williams","Brown","Wilson","Taylor","Johnson","White","Martin","Anderson",
        "Thompson","Thomas","Walker","Harris","Lee","Ryan","Robinson","Lewis","Young","King",
        "Hall","Allen","Wright","Scott","Green","Baker","Adams","Mitchell","Campbell","Miller",
        "Carter","Murphy","Rogers","Morgan","Evans","Stewart","Parker","Foster","Reid","Griffin",
        "Bell","Coleman","Hayes","Chapman","Ward","Cooper","Spence","Armstrong","McDonald","Burns"
        ]
    }
    },

  /* -------------------------------------------------------------
     NEW ZEALAND
  ------------------------------------------------------------- */
  nz: {
    male: {
        first: [
        "Oliver","Noah","Jack","Leo","Lucas","George","Hunter","Mason","Thomas","Cooper",
        "Arlo","Beau","Finn","Elijah","Henry","Harrison","Harry","Isaac","Alex","Max",
        "Charlie","Liam","Theo","Harvey","Louis","Archer","Blake","Riley","Asher","Reuben",
        "Quinn","Caleb","Jordan","Flynn","Zachary","Toby","Elliot","Hayden","Micah","Felix",
        "Dallas","Miles","Koby","Patrick","Jasper","Kade","Nate","Xander","Owen","Phoenix"
        ],
        last: [
        "Smith","Williams","Brown","Wilson","Taylor","Jones","White","Robinson","Thompson","Campbell",
        "Anderson","Harris","Martin","Allen","Walker","Young","King","Scott","Moore","Cooper",
        "Ward","Wood","Reid","Edwards","Turner","Miller","Clark","Davis","Mitchell","Patel",
        "Bell","Evans","Lewis","Jackson","Parker","Carter","Green","Hall","Baker","Wright",
        "Gray","Hill","Ross","Shaw","Webb","Foster","Douglas","Graham","Marshall","Burke"
        ]
    },
    female: {
        first: [
        "Isla","Charlotte","Amelia","Olivia","Mia","Ava","Harper","Sophie","Emily","Ella",
        "Lucy","Lily","Grace","Freya","Zoe","Mackenzie","Aria","Hazel","Jessica","Ruby",
        "Georgia","Poppy","Mila","Scarlett","Sienna","Hannah","Emma","Bella","Phoebe","Evelyn",
        "Willow","Maeve","Rose","Thea","Heidi","Alexa","Quinn","Indie","Hallie","Violet",
        "Sadie","Maya","Luna","Stella","Amber","Maddison","Zoey","Kiara","Ayla","Jordyn"
        ],
        last: [
        "Smith","Williams","Brown","Wilson","Taylor","Jones","White","Robinson","Thompson","Campbell",
        "Anderson","Harris","Martin","Allen","Walker","Young","King","Scott","Moore","Cooper",
        "Ward","Wood","Reid","Edwards","Turner","Miller","Clark","Davis","Mitchell","Patel",
        "Bell","Evans","Lewis","Jackson","Parker","Carter","Green","Hall","Baker","Wright",
        "Gray","Hill","Ross","Shaw","Webb","Foster","Douglas","Graham","Marshall","Burke"
        ]
    }
    },

  /* -------------------------------------------------------------
     INDIA
  ------------------------------------------------------------- */
  in: {
    male: {
        first: [
        "Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Krishna","Ishaan","Rohan","Aryan",
        "Kabir","Dhruv","Anay","Yuvan","Ritvik","Shivansh","Atharv","Rahul","Raghav","Manav",
        "Samar","Dev","Kunal","Param","Naman","Siddharth","Om","Harshit","Pranav","Tanay",
        "Vedant","Ayaan","Kartik","Tanish","Ankit","Varun","Akhil","Keshav","Roshan","Jay",
        "Rohit","Vivek","Sahil","Arnav","Gautam","Deepak","Yash","Abhay","Ansh","Nikhil"
        ],
        last: [
        "Sharma","Verma","Gupta","Mehta","Singh","Patel","Reddy","Iyer","Khan","Jain",
        "Nair","Chopra","Kapoor","Pillai","Das","Ghosh","Bose","Roy","Mukherjee","Sinha",
        "Malhotra","Khanna","Gill","Bhat","Shah","Rastogi","Rawat","Bhatt","Pandey","Tripathi",
        "Chauhan","Yadav","Rana","Agarwal","Banerjee","Sen","Shetty","Menon","Joshi","Kulkarni",
        "Desai","Pathak","Rajput","Goel","Saxena","Mahajan","Bhardwaj","Venkatesh","Chatterjee","Dubey"
        ]
    },
    female: {
        first: [
        "Aadhya","Saanvi","Ananya","Diya","Aarohi","Ira","Meera","Sara","Pari","Navya",
        "Aanya","Riya","Ishita","Shanaya","Kiara","Naira","Trisha","Anvi","Lavanya","Sneha",
        "Tanisha","Muskan","Aditi","Prachi","Nandini","Samaira","Vaishnavi","Kavya","Pooja","Rekha",
        "Divya","Harini","Shreya","Mira","Krisha","Isha","Jhanvi","Amrita","Bhavya","Mitali",
        "Pallavi","Radhika","Tara","Neha","Devika","Sahana","Avni","Shalini","Shruti","Anushka"
        ],
        last: [
        "Sharma","Verma","Gupta","Mehta","Singh","Patel","Reddy","Iyer","Khan","Jain",
        "Nair","Chopra","Kapoor","Pillai","Das","Ghosh","Bose","Roy","Mukherjee","Sinha",
        "Malhotra","Khanna","Gill","Bhat","Shah","Rastogi","Rawat","Bhatt","Pandey","Tripathi",
        "Chauhan","Yadav","Rana","Agarwal","Banerjee","Sen","Shetty","Menon","Joshi","Kulkarni",
        "Desai","Pathak","Rajput","Goel","Saxena","Mahajan","Bhardwaj","Venkatesh","Chatterjee","Dubey"
        ]
    }
    },

  /* -------------------------------------------------------------
     SOUTH AFRICA
  ------------------------------------------------------------- */
  za: {
    male: {
        first: [
        "Liam","Ethan","Noah","Jayden","Aiden","Logan","Mpho","Thabo","Sipho","Kagiso",
        "Dylan","Reece","Tyler","Jordan","Caleb","Nathan","Connor","Jason","Blake","Luke",
        "Keegan","Damian","Evan","Chris","Kyle","Shane","Lwandle","Bongani","Sibusiso","Mbuso",
        "Zola","Ayanda","Kwame","Vuyo","Andile","Sandile","Karabo","Thulani","Jabulani","Litha",
        "Thami","Khaya","Nhlanhla","Mduduzi","Maphosa","Lundi","Teboho","Siyabonga","Akani","Nkosi"
        ],
        last: [
        "Smith","Nkosi","Naidoo","Botha","Van der Merwe","Mokoena","Khumalo","Pillay","Pretorius","Nel",
        "Sithole","Dlamini","Ngcobo","Zuma","Mabaso","Jansen","Steyn","Kruger","Smit","du Plessis",
        "Oosthuizen","Visser","Fourie","Cronje","Van Wyk","Van Heerden","Miller","Bester","Brand","Le Roux",
        "Pieters","Coetzee","Muller","Geldenhuys","Myburgh","Swanepoel","Lourens","Marais","Olivier","Strydom",
        "Prinsloo","Ferreira","Van Rooyen","Erasmus","Oberholzer","Kotze","Van Zyl","Vorster","Kriel","Jooste"
        ]
    },
    female: {
        first: [
        "Emily","Olivia","Mia","Sophia","Ava","Lerato","Thandi","Naledi","Nomsa","Zanele",
        "Kayla","Hannah","Sarah","Chloe","Amelia","Gabriella","Zoey","Layla","Jessica","Ella",
        "Riley","Savannah","Sienna","Jade","Ruby","Emma","Isabella","Peyton","Keira","Megan",
        "Asavela","Ayanda","Amahle","Zinhle","Busisiwe","Nandi","Liyema","Khethiwe","Yara","Anele",
        "Khanyi","Zoleka","Samke","Buhle","Thobeka","Lerisha","Tshenolo","Gugu","Mpho","Siphesihle"
        ],
        last: [
        "Smith","Nkosi","Naidoo","Botha","Van der Merwe","Mokoena","Khumalo","Pillay","Pretorius","Nel",
        "Sithole","Dlamini","Ngcobo","Zuma","Mabaso","Jansen","Steyn","Kruger","Smit","du Plessis",
        "Oosthuizen","Visser","Fourie","Cronje","Van Wyk","Van Heerden","Miller","Bester","Brand","Le Roux",
        "Pieters","Coetzee","Muller","Geldenhuys","Myburgh","Swanepoel","Lourens","Marais","Olivier","Strydom",
        "Prinsloo","Ferreira","Van Rooyen","Erasmus","Oberholzer","Kotze","Van Zyl","Vorster","Kriel","Jooste"
        ]
    }
    },

  /* -------------------------------------------------------------
     BRAZIL
  ------------------------------------------------------------- */
  br: {
    male: {
        first: [
        "Miguel","Arthur","Davi","Gabriel","Bernardo","Lucas","Pedro","Gustavo","Matheus","Rafael",
        "Bruno","Felipe","Daniel","Eduardo","Thiago","Luan","Vinícius","Henrique","Cauã","João",
        "Pietro","Diego","Victor","André","Alexandre","Igor","Enzo","Heitor","Nicolas","Leonardo",
        "Caio","Ruan","Emanuel","Rodrigo","Hugo","Marcelo","Alan","Bryan","Vitor","Samuel",
        "Murilo","Kauê","Elias","Otávio","Dener","Márcio","Wilker","Fabrício","Paulo","Cássio"
        ],
        last: [
        "Silva","Santos","Oliveira","Souza","Rodrigues","Ferreira","Alves","Pereira","Lima","Gomes",
        "Costa","Ribeiro","Martins","Carvalho","Araujo","Melo","Barbosa","Cardoso","Rocha","Dias",
        "Teixeira","Nunes","Pinto","Borges","Monteiro","Moreira","Cavalcante","Cunha","Gonçalves","Vieira",
        "Freitas","Santana","Campos","Barros","Reis","Correia","Batista","Sales","Assis","Saraiva",
        "Mendes","Xavier","Ramos","Peixoto","Guimarães","Fonseca","Farias","Roque","Pacheco","Porto"
        ]
    },
    female: {
        first: [
        "Alice","Sophia","Helena","Valentina","Laura","Isabella","Manuela","Júlia","Heloísa","Luiza",
        "Camila","Giovanna","Lívia","Beatriz","Clara","Sarah","Lorena","Mariana","Nicole","Gabriela",
        "Ana","Rafaela","Carolina","Stella","Melissa","Fernanda","Elisa","Amanda","Mirella","Úrsula",
        "Yasmin","Pietra","Clarice","Sara","Bianca","Rebeca","Fabiana","Letícia","Sabrina","Daiane",
        "Paloma","Adriana","Natália","Cristina","Juliana","Bruna","Renata","Daniela","Tatiane","Tainá"
        ],
        last: [
        "Silva","Santos","Oliveira","Souza","Rodrigues","Ferreira","Alves","Pereira","Lima","Gomes",
        "Costa","Ribeiro","Martins","Carvalho","Araujo","Melo","Barbosa","Cardoso","Rocha","Dias",
        "Teixeira","Nunes","Pinto","Borges","Monteiro","Moreira","Cavalcante","Cunha","Gonçalves","Vieira",
        "Freitas","Santana","Campos","Barros","Reis","Correia","Batista","Sales","Assis","Saraiva",
        "Mendes","Xavier","Ramos","Peixoto","Guimarães","Fonseca","Farias","Roque","Pacheco","Porto"
        ]
    }
    },

  /* -------------------------------------------------------------
     JAPAN
  ------------------------------------------------------------- */
  jp: {
    male: {
      first: [
        "Haruto", "Yuto", "Sota", "Yuki", "Hayato",
        "Ren", "Kaito", "Riku", "Kota", "Daiki",
      ],
      last: [
        "Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe",
        "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato",
      ],
    },
    female: {
      first: [
        "Yui", "Aoi", "Hina", "Sakura", "Misaki",
        "Riko", "Haruka", "Mio", "Nanami", "Yuna",
      ],
      last: [
        "Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe",
        "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato",
      ],
    },
  },

  /* -------------------------------------------------------------
     MEXICO
  ------------------------------------------------------------- */
  mx: {
    male: {
      first: [
        "José", "Juan", "Luis", "Carlos", "Miguel",
        "Jorge", "Ángel", "Diego", "Alejandro", "Ricardo",
      ],
      last: [
        "Hernández", "García", "Martínez", "López", "González",
        "Pérez", "Sánchez", "Ramírez", "Cruz", "Flores",
      ],
    },
    female: {
      first: [
        "María", "Sofía", "Valentina", "Ximena", "Camila",
        "Daniela", "Fernanda", "Paula", "Regina", "Andrea",
      ],
      last: [
        "Hernández", "García", "Martínez", "López", "González",
        "Pérez", "Sánchez", "Ramírez", "Cruz", "Flores",
      ],
    },
  },

  /* -------------------------------------------------------------
     PORTUGAL
  ------------------------------------------------------------- */
  pt: {
    male: {
      first: [
        "João", "Francisco", "Martim", "Afonso", "Rodrigo",
        "Miguel", "Gonçalo", "Tiago", "Diogo", "Pedro",
      ],
      last: [
        "Silva", "Santos", "Ferreira", "Pereira", "Oliveira",
        "Costa", "Martins", "Rodrigues", "Sousa", "Gomes",
      ],
    },
    female: {
      first: [
        "Maria", "Leonor", "Matilde", "Carolina", "Beatriz",
        "Ana", "Mariana", "Inês", "Luísa", "Francisca",
      ],
      last: [
        "Silva", "Santos", "Ferreira", "Pereira", "Oliveira",
        "Costa", "Martins", "Rodrigues", "Sousa", "Gomes",
      ],
    },
  },

  /* -------------------------------------------------------------
     SOUTH KOREA
  ------------------------------------------------------------- */
  kr: {
    male: {
      first: [
        "Min-jun", "Seo-jun", "Ji-hoon", "Do-hyun", "Hyun-woo",
        "Jae-won", "Tae-hyun", "Woo-jin", "Sung-min", "Hyeon-ju",
      ],
      last: [
        "Kim", "Lee", "Park", "Choi", "Jung",
        "Kang", "Cho", "Yoon", "Jang", "Lim",
      ],
    },
    female: {
      first: [
        "Seo-yeon", "Ha-yoon", "Ji-woo", "Ha-eun", "Yu-na",
        "Min-seo", "Seo-ah", "Su-bin", "Ye-won", "Da-eun",
      ],
      last: [
        "Kim", "Lee", "Park", "Choi", "Jung",
        "Kang", "Cho", "Yoon", "Jang", "Lim",
      ],
    },
  },

  /* -------------------------------------------------------------
     RUSSIA
  ------------------------------------------------------------- */
  ru: {
    male: {
      first: [
        "Alexander", "Dmitry", "Ivan", "Sergey", "Aleksei",
        "Nikolai", "Mikhail", "Andrei", "Yuri", "Pavel",
      ],
      last: [
        "Ivanov", "Petrov", "Sidorov", "Smirnov", "Popov",
        "Kuznetsov", "Volkov", "Fedorov", "Morozov", "Solovyov",
      ],
    },
    female: {
      first: [
        "Anastasia", "Sofia", "Daria", "Olga", "Maria",
        "Elena", "Natalia", "Yulia", "Victoria", "Polina",
      ],
      last: [
        "Ivanova", "Petrova", "Sidorova", "Smirnova", "Popova",
        "Kuznetsova", "Volkova", "Fedorova", "Morozova", "Solovyova",
      ],
    },
  },

  /* -------------------------------------------------------------
     CHINA
  ------------------------------------------------------------- */
  cn: {
    male: {
      first: [
        "Wei", "Jun", "Hao", "Peng", "Lei",
        "Ming", "Tao", "Jian", "Qiang", "Bo",
      ],
      last: [
        "Wang", "Li", "Zhang", "Liu", "Chen",
        "Yang", "Huang", "Zhao", "Wu", "Zhou",
      ],
    },
    female: {
      first: [
        "Mei", "Yan", "Li", "Ling", "Hui",
        "Xiu", "Fen", "Ying", "Qian", "Jia",
      ],
      last: [
        "Wang", "Li", "Zhang", "Liu", "Chen",
        "Yang", "Huang", "Zhao", "Wu", "Zhou",
      ],
    },
  },

};
