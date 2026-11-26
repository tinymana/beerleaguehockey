/**
 * Fictional name pools, by nationality. Used by the random-name button in Create a Player and by the
 * fictional fallback influence registry. These are ordinary given names and surnames combined at random:
 * no entry is meant to be a real person. Nothing here comes from any dataset.
 */
import type { Rng } from '../core/rng';

export interface NamePool {
  /** Three-letter country code, as used on flags. */
  code: string;
  country: string;
  first: readonly string[];
  last: readonly string[];
}

const CORE_POOLS: readonly NamePool[] = [
  { code: 'CAN', country: 'Canada', first: ['Brody', 'Tanner', 'Gord', 'Wade', 'Dallas', 'Colby', 'Reid', 'Darcy', 'Lyle', 'Clint', 'Jesse', 'Brent', 'Shane', 'Trevor', 'Marcel', 'Remy'], last: ['Kowalchuk', 'Tremblay', 'MacAskill', 'Lafleche', 'Pruden', 'Hargrave', 'Boudreault', 'Stoyko', 'Fehr', 'Laroque', 'Wiebe', 'Cormack', 'Gauvin', 'Penner', 'Dubeau', 'Skelly'] },
  { code: 'USA', country: 'United States', first: ['Chet', 'Dusty', 'Brock', 'Tucker', 'Cody', 'Hank', 'Mitch', 'Travis', 'Doug', 'Kyle', 'Randy', 'Garrett', 'Zeke', 'Wyatt', 'Earl', 'Scooter'], last: ['Halverson', 'Brannigan', 'Keswick', 'Dombrowski', 'Lindgren', 'Petrosky', 'Hollister', 'Vance', 'Oberg', 'Whitlock', 'Rourke', 'Stanek', 'Bergstrom', 'Culpepper', 'Mahoney', 'Drummond'] },
  { code: 'SWE', country: 'Sweden', first: ['Lars', 'Anders', 'Mats', 'Jonas', 'Per', 'Oskar', 'Viktor', 'Emil', 'Stefan', 'Axel', 'Gustav', 'Nils', 'Henrik', 'Tobias', 'Elias', 'Rasmus'], last: ['Lindqvist', 'Bergholm', 'Sandahl', 'Nyberg', 'Ekdahl', 'Hallgren', 'Strandberg', 'Lundmark', 'Wikman', 'Sjogren', 'Forsell', 'Alstrom', 'Dahlberg', 'Norling', 'Rydell', 'Engvall'] },
  { code: 'FIN', country: 'Finland', first: ['Jari', 'Mikko', 'Teemu', 'Ville', 'Antti', 'Juha', 'Sami', 'Eero', 'Kalle', 'Petri', 'Tuomas', 'Lauri', 'Olli', 'Markus', 'Aleksi', 'Niko'], last: ['Makinen', 'Korpela', 'Laaksonen', 'Heikkila', 'Rantala', 'Salonen', 'Kivisto', 'Ahonen', 'Nurmi', 'Peltola', 'Virtala', 'Hakala', 'Lehtola', 'Saarela', 'Jokela', 'Toivola'] },
  { code: 'RUS', country: 'Russia', first: ['Dmitri', 'Sergei', 'Alexei', 'Pavel', 'Igor', 'Nikolai', 'Andrei', 'Maxim', 'Oleg', 'Yuri', 'Viktor', 'Ilya', 'Anton', 'Kirill', 'Roman', 'Boris'], last: ['Volkovsky', 'Morozenko', 'Karpin', 'Zubarev', 'Lebedkin', 'Sokolnik', 'Gusarov', 'Baranin', 'Taranov', 'Vorobin', 'Kuzmenko', 'Orlovsky', 'Belousov', 'Shumilin', 'Drozdov', 'Yakushin'] },
  { code: 'CZE', country: 'Czechia', first: ['Petr', 'Jiri', 'Tomas', 'Martin', 'Pavel', 'Jakub', 'Ondrej', 'Milan', 'Radek', 'Vaclav', 'Lukas', 'David', 'Roman', 'Michal', 'Karel', 'Zdenek'], last: ['Novotny', 'Kratochvil', 'Havlicek', 'Prochazka', 'Dvoracek', 'Sedlak', 'Vesely', 'Hruska', 'Kolar', 'Machacek', 'Stastka', 'Benesik', 'Vrbka', 'Zemanek', 'Fialka', 'Kubicek'] },
  { code: 'SVK', country: 'Slovakia', first: ['Marek', 'Peter', 'Juraj', 'Miroslav', 'Lubomir', 'Richard', 'Andrej', 'Tomas', 'Branislav', 'Ivan', 'Matej', 'Robert', 'Stanislav', 'Erik', 'Samuel', 'Dusan'], last: ['Hudak', 'Kovacik', 'Bartos', 'Mikus', 'Sloboda', 'Gajdos', 'Lukac', 'Danko', 'Hrivnak', 'Balaz', 'Petrovic', 'Urban', 'Varga', 'Kopecny', 'Chovan', 'Majersky'] },
  { code: 'GER', country: 'Germany', first: ['Dieter', 'Uwe', 'Jens', 'Klaus', 'Stefan', 'Lukas', 'Moritz', 'Felix', 'Tobias', 'Jochen', 'Marco', 'Dennis', 'Leon', 'Sven', 'Rolf', 'Heiko'], last: ['Krueger', 'Hoffmeister', 'Brandl', 'Seidel', 'Reichel', 'Wolfram', 'Kessler', 'Baumann', 'Lutz', 'Ehrhardt', 'Pfeiffer', 'Stolz', 'Gruber', 'Lindner', 'Vogt', 'Renner'] },
  { code: 'SUI', country: 'Switzerland', first: ['Reto', 'Urs', 'Beat', 'Luca', 'Nino', 'Roman', 'Sven', 'Fabian', 'Timo', 'Marc', 'Dario', 'Yannick', 'Simon', 'Remo', 'Andres', 'Pius'], last: ['Zurbriggen', 'Ambauen', 'Hofmann', 'Streiff', 'Bieri', 'Gerber', 'Wicki', 'Rothen', 'Fischli', 'Kunzle', 'Meili', 'Sprecher', 'Baltis', 'Egli', 'Sutz', 'Furrer'] },
  { code: 'LAT', country: 'Latvia', first: ['Janis', 'Martins', 'Kaspars', 'Arturs', 'Rihards', 'Edgars', 'Gints', 'Oskars', 'Raitis', 'Uldis', 'Miks', 'Ronalds', 'Zemgus', 'Lauris', 'Krisjanis', 'Toms'], last: ['Ozols', 'Kalnins', 'Berzins', 'Liepins', 'Krumins', 'Balodis', 'Vitols', 'Sprogis', 'Dzenis', 'Skrastis', 'Zvirbulis', 'Lapins', 'Rudzitis', 'Abols', 'Eglitis', 'Purins'] },
  { code: 'NOR', country: 'Norway', first: ['Espen', 'Mats', 'Ole', 'Anders', 'Jonas', 'Kristian', 'Morten', 'Tore', 'Patrick', 'Marius', 'Henrik', 'Stian', 'Eirik', 'Ken', 'Lars', 'Sondre'], last: ['Thorsrud', 'Holte', 'Bakken', 'Skredsvig', 'Olstad', 'Vikstad', 'Roysland', 'Hansen', 'Solberg', 'Bonsak', 'Tollefsrud', 'Lindstrom', 'Haugen', 'Kristiansen', 'Nordby', 'Myhre'] },
  { code: 'DEN', country: 'Denmark', first: ['Mikkel', 'Frederik', 'Jannik', 'Nikolaj', 'Lars', 'Oliver', 'Morten', 'Peter', 'Rasmus', 'Jesper', 'Kasper', 'Emil', 'Mads', 'Philip', 'Simon', 'Soren'], last: ['Boegh', 'Reinholt', 'Storm', 'Jakobsen', 'Lauritzen', 'Madsen', 'Poulsen', 'Bjerregaard', 'Nielsen', 'Hartvig', 'Jensen', 'Larsen', 'Dahl', 'Brogger', 'Christensen', 'Meyer'] },
];


/** Further given names per nationality. */
const MORE_FIRST: Record<string, readonly string[]> = {
  CAN: ['Alain', 'Benoit', 'Blake', 'Brayden', 'Cam', 'Chad', 'Corey', 'Curtis', 'Dale', 'Denis', 'Derek', 'Dustin', 'Etienne', 'Fraser', 'Garth', 'Glen', 'Grant', 'Guy', 'Jared', 'Jordie', 'Kirk', 'Luc', 'Mathieu', 'Murray', 'Neil', 'Normand', 'Pascal', 'Pierre', 'Quinn', 'Rejean', 'Riley', 'Rod', 'Ross', 'Russ', 'Serge', 'Stu', 'Sylvain', 'Terry', 'Troy', 'Yvon'],
  USA: ['Aaron', 'Beau', 'Blaine', 'Brad', 'Bryce', 'Chase', 'Clay', 'Colt', 'Dale', 'Dean', 'Deke', 'Duke', 'Eli', 'Gage', 'Grady', 'Jace', 'Jeb', 'Joel', 'Judd', 'Kip', 'Lane', 'Logan', 'Mason', 'Nate', 'Nolan', 'Otis', 'Pete', 'Reese', 'Rhett', 'Ricky', 'Seth', 'Skip', 'Tate', 'Ted', 'Toby', 'Trent', 'Vern', 'Walt', 'Wes', 'Zane'],
  SWE: ['Adam', 'Albin', 'Alfred', 'Anton', 'Arvid', 'Bengt', 'Bjorn', 'Bo', 'Carl', 'Daniel', 'David', 'Edvin', 'Erik', 'Filip', 'Fredrik', 'Goran', 'Hampus', 'Hugo', 'Isak', 'Jakob', 'Jesper', 'Joel', 'Johan', 'Karl', 'Kent', 'Leif', 'Linus', 'Ludvig', 'Magnus', 'Marcus', 'Mikael', 'Olle', 'Oscar', 'Pontus', 'Robin', 'Sebastian', 'Simon', 'Sven', 'Ulf', 'William'],
  FIN: ['Aki', 'Ari', 'Arto', 'Eetu', 'Elias', 'Esa', 'Hannu', 'Harri', 'Heikki', 'Henri', 'Ilkka', 'Jani', 'Janne', 'Joni', 'Jouni', 'Jukka', 'Jussi', 'Kari', 'Kimmo', 'Lasse', 'Marko', 'Matti', 'Mika', 'Miro', 'Oskari', 'Otto', 'Pasi', 'Pekka', 'Rasmus', 'Reijo', 'Riku', 'Roope', 'Santeri', 'Seppo', 'Tapio', 'Tero', 'Timo', 'Toni', 'Topi', 'Veli'],
  RUS: ['Aleksandr', 'Arkady', 'Artem', 'Bogdan', 'Daniil', 'Denis', 'Eduard', 'Evgeni', 'Fedor', 'Gennady', 'Georgi', 'Gleb', 'Grigori', 'Ivan', 'Konstantin', 'Leonid', 'Lev', 'Makar', 'Mark', 'Matvei', 'Mikhail', 'Nikita', 'Pyotr', 'Ruslan', 'Semyon', 'Stanislav', 'Stepan', 'Taras', 'Timur', 'Vadim', 'Valeri', 'Vasili', 'Vitali', 'Vladimir', 'Vladislav', 'Vyacheslav', 'Yegor', 'Zakhar', 'Egor', 'Rodion'],
  CZE: ['Adam', 'Ales', 'Antonin', 'Bohumil', 'Daniel', 'Dominik', 'Filip', 'Frantisek', 'Jan', 'Jaromir', 'Jaroslav', 'Josef', 'Kamil', 'Ladislav', 'Libor', 'Lubos', 'Marek', 'Matej', 'Miroslav', 'Oldrich', 'Otakar', 'Patrik', 'Robert', 'Rostislav', 'Rudolf', 'Stanislav', 'Stepan', 'Tadeas', 'Viktor', 'Vit', 'Vladimir', 'Vojtech', 'Zbynek', 'Hynek', 'Ivo', 'Leos', 'Marian', 'Richard', 'Simon', 'Vlastimil'],
  SVK: ['Adam', 'Adrian', 'Boris', 'Daniel', 'David', 'Dominik', 'Emil', 'Filip', 'Igor', 'Jakub', 'Jan', 'Jozef', 'Kamil', 'Karol', 'Ladislav', 'Lukas', 'Marian', 'Martin', 'Michal', 'Milan', 'Oliver', 'Ondrej', 'Patrik', 'Pavol', 'Rastislav', 'Roman', 'Rudolf', 'Simon', 'Stefan', 'Viktor', 'Vladimir', 'Zdeno', 'Zigmund', 'Tibor', 'Henrich', 'Radovan', 'Slavomir', 'Marcel', 'Denis', 'Alex'],
  GER: ['Achim', 'Andreas', 'Axel', 'Bernd', 'Christoph', 'Dirk', 'Erich', 'Florian', 'Frank', 'Fritz', 'Georg', 'Gerd', 'Gunther', 'Hannes', 'Hans', 'Holger', 'Jan', 'Jurgen', 'Kai', 'Karl', 'Konrad', 'Lars', 'Lothar', 'Manfred', 'Markus', 'Matthias', 'Max', 'Niklas', 'Oliver', 'Otto', 'Peter', 'Ralf', 'Rainer', 'Sebastian', 'Simon', 'Thomas', 'Timo', 'Torsten', 'Ulrich', 'Wolfgang'],
  SUI: ['Adrian', 'Alain', 'Benjamin', 'Bruno', 'Christian', 'Damien', 'Daniel', 'Denis', 'Elia', 'Emil', 'Fabio', 'Florian', 'Gaetan', 'Gian', 'Hans', 'Ivo', 'Jan', 'Joel', 'Jonas', 'Julien', 'Kevin', 'Lars', 'Leo', 'Lino', 'Lukas', 'Manuel', 'Martin', 'Mathias', 'Noah', 'Pascal', 'Patrick', 'Philippe', 'Raphael', 'Rene', 'Robin', 'Samuel', 'Thierry', 'Tobias', 'Urban', 'Vincent'],
  LAT: ['Agris', 'Aigars', 'Ainars', 'Aivars', 'Aleksandrs', 'Andris', 'Armands', 'Atis', 'Daniels', 'Davis', 'Dzintars', 'Elvis', 'Emils', 'Ernests', 'Gatis', 'Guntis', 'Gustavs', 'Haralds', 'Ivars', 'Jekabs', 'Juris', 'Karlis', 'Klavs', 'Kristaps', 'Maris', 'Markuss', 'Matiss', 'Nauris', 'Niks', 'Normunds', 'Pauls', 'Peteris', 'Renars', 'Roberts', 'Rolands', 'Sandis', 'Teodors', 'Valdis', 'Viesturs', 'Vilnis'],
  NOR: ['Aksel', 'Alexander', 'Andreas', 'Arne', 'Bjorn', 'Christian', 'Daniel', 'Emil', 'Erik', 'Erlend', 'Fredrik', 'Geir', 'Gunnar', 'Haakon', 'Halvor', 'Harald', 'Jan', 'Joakim', 'Jorgen', 'Kjetil', 'Knut', 'Magnus', 'Markus', 'Martin', 'Mathias', 'Nils', 'Odd', 'Oystein', 'Per', 'Petter', 'Rune', 'Sander', 'Sigurd', 'Simen', 'Sverre', 'Terje', 'Thomas', 'Tobias', 'Trond', 'Vegard'],
  DEN: ['Alexander', 'Anders', 'Andreas', 'Anton', 'Bjarke', 'Bo', 'Carl', 'Christian', 'Claus', 'Daniel', 'Erik', 'Finn', 'Flemming', 'Henrik', 'Jacob', 'Jakob', 'Jens', 'Jonas', 'Kim', 'Kristian', 'Lasse', 'Magnus', 'Malthe', 'Marcus', 'Martin', 'Mathias', 'Michael', 'Niels', 'Nicklas', 'Ole', 'Patrick', 'Poul', 'Sebastian', 'Steffen', 'Sune', 'Thomas', 'Tobias', 'Troels', 'Ulrik', 'Victor'],
};

/** A surname built the way the language builds them: a stem and an ending. */
function compose(stems: readonly string[], endings: readonly string[]): string[] {
  const out: string[] = [];
  for (const stem of stems) for (const end of endings) if (!stem.toLowerCase().endsWith(end)) out.push(`${stem}${end}`);
  return out;
}

/** Further surnames per nationality, composed from stems and endings typical of the language. */
const MORE_LAST: Record<string, readonly string[]> = {
  CAN: compose(['Ash','Black','Fair','Green','Hart','Kings','North','Red','Stone','White','Wood','Brook'], ['field','wood','ley','ton','well','ford','man','stock']).concat(compose(['Mac','Mc'], ['Allister','Cray','Tavish','Kinnon','Gregor','Phail','Innes','Leod','Rae','Nab']), compose(['Beau','Du','La','Le','De'], ['chene','mont','pierre','roche','vigne','marais','fort','lac'])),
  USA: compose(['Brad','Car','Dal','Ellis','Graf','Hamp','Kemp','Lang','Mil','Nor','Pres','Rad','Shel','Thorn','Wal','Win'], ['ton','ford','ley','field','wood','burn','well','worth']).concat(compose(['Ander','Carl','Erick','Gustaf','Han','Jen','John','Lar','Nel','Ol','Peter','Swen'], ['son','sen'])),
  SWE: compose(['Al','Berg','Bjork','Dahl','Ek','Fors','Hed','Holm','Lind','Lund','Ny','Sand','Sjo','Stor','Sund','Vik','Wall','Ahl','Gran','Hag'], ['berg','strom','qvist','gren','lund','man','dahl','stedt']),
  FIN: compose(['Aalto','Haapa','Heino','Hirvo','Joki','Kallio','Karhu','Koski','Laine','Lehti','Maki','Niemi','Oja','Ranta','Saari','Salmi','Suo','Tammi','Vaara','Virta'], ['nen','la','lainen','maa','salo','vuori','niemi','koski']),
  RUS: compose(['Abram','Bor','Dem','Fed','Gavr','Kar','Lazar','Mel','Nik','Pan','Rod','Sem','Tim','Ust','Vas','Zakh','Yef','Mak','Dan','Luk'], ['ov','ev','in','enko','sky','ovich','chuk','itsyn']),
  CZE: compose(['Bar','Cer','Dol','Hol','Jan','Kov','Kra','Mar','Nov','Pol','Rad','Sla','Sve','Tom','Vac','Zel','Hav','Kub','Ben','Pes'], ['ek','ak','ik','ka','sky','cek','ovsky','ny']),
  SVK: compose(['Bal','Cho','Dur','Gab','Hla','Jur','Kol','Luk','Mich','Pal','Rep','Sta','Tur','Val','Zub','Ond','Ham','Kri','Dem','Svi'], ['ik','ak','ko','ka','sky','ovic','cik','an']),
  GER: compose(['Alt','Berg','Brand','Eich','Fried','Gold','Hart','Hof','Klein','Lang','Lind','Neu','Rein','Roth','Schon','Stein','Wald','Weiss','Winter','Zimmer'], ['mann','berg','er','hoff','meier','feld','bach','stein']),
  SUI: compose(['Ander','Bach','Brun','Burg','Egg','Frei','Grau','Hug','Kauf','Loch','Matt','Ober','Rie','Schmid','Stud','Tann','Wid','Zum','Zur','Hal'], ['er','mann','li','ler','egger','matter','holz','bach']),
  LAT: compose(['Abol','Berz','Cir','Dzen','Egl','Gail','Jaun','Kaln','Krast','Lac','Liep','Ozol','Pried','Rozen','Sil','Strazd','Vanag','Vilk','Zar','Zied'], ['ins','s','nieks','ans','ulis','ovskis','itis','ajs']),
  NOR: compose(['Aas','Berg','Dal','Eide','Fjell','Gran','Haug','Hol','Lie','Lund','Mo','Nes','Ost','Sand','Sol','Stor','Vik','Od','Tor','Sig'], ['land','stad','vik','heim','rud','dal','nes','seth']).concat(compose(['Ander','Hal','Jo','Lar','Ol','Ped','Svend','Tor'], ['sen'])),
  DEN: compose(['Bjerre','Dam','Friis','Gram','Holm','Kjaer','Lund','Mork','Noer','Skov','Staer','Vest','Bruun','Dal','Hede','Krog','Ravn','Toft'], ['gaard','strup','borg','berg','lev','by','bjerg','rup']).concat(compose(['Ander','Christen','Han','Jen','Jorgen','Knud','Lar','Mad','Mikkel','Niel','Ol','Peder','Poul','Rasmus','Soren','Thom'], ['sen'])),
};

/** The first names and surnames each pool started with. The fictional professional registry draws only from these, so growing the pools never renames a professional. */
export const CORE_POOL_SIZE = 16;

const unique = (names: readonly string[]): string[] => [...new Set(names)].filter((n) => /^[A-Za-z' -]{2,12}$/.test(n));

/**
 * Composed surnames left out, per pool. With these gone, no name the pools can make matches a real professional
 * on the development team's private check list. Only surnames are listed: nothing here identifies a person.
 */
/** Added given names left out for the same reason (they met a core surname). */
const LEFT_OUT_FIRST: Record<string, readonly string[]> = {
  CAN: ['Dustin'],
  SUI: ['Martin'],
  NOR: ['Joakim'],
  DEN: ['Erik', 'Nicklas'],
};

const LEFT_OUT: Record<string, readonly string[]> = {
  CAN: ['Ashton', 'McRae', 'McTavish', 'Penner', 'Tremblay'],
  USA: ['Anderson', 'Bradley', 'Johnson', 'Larsen', 'Nelson', 'Norton', 'Petersen', 'Shelton'],
  SWE: ['Berglund', 'Bergqvist', 'Dahlstrom', 'Eklund', 'Forsberg', 'Granlund', 'Hedberg', 'Holmberg', 'Holmqvist', 'Holmstrom', 'Lindberg', 'Lindgren', 'Lindstrom', 'Lundqvist', 'Sjoberg', 'Sjostrom', 'Sundqvist', 'Sundstrom', 'Wallstedt'],
  FIN: ['Heinola', 'Jokela', 'Jokinen', 'Koskinen', 'Laaksonen', 'Makiniemi', 'Nieminen', 'Ojanen', 'Rantanen', 'Saarela'],
  RUS: ['Gusarov', 'Kuzmenko', 'Rodin'],
  CZE: ['Novak', 'Novotny', 'Polak', 'Prochazka', 'Sedlak'],
  SVK: ['Bartos', 'Repik'],
  GER: ['Goldmann', 'Lindberg', 'Reichel'],
  SUI: ['Gerber', 'Haller'],
  NOR: ['Holland', 'Lindstrom', 'Solheim'],
  DEN: ['Andersen', 'Christensen', 'Hansen', 'Jensen', 'Larsen', 'Rasmussen', 'Sorensen'],
};

/**
 * The full pools (Decision 75: toward 100,000 combinations). The core names come first and never move; the rest are appended.
 */
export const NAME_POOLS: readonly NamePool[] = CORE_POOLS.map((pool) => ({
  ...pool,
  first: unique([...pool.first, ...(MORE_FIRST[pool.code] ?? []).filter((n) => !(LEFT_OUT_FIRST[pool.code] ?? []).includes(n))]),
  last: unique([...pool.last, ...(MORE_LAST[pool.code] ?? []).filter((n) => !(LEFT_OUT[pool.code] ?? []).includes(n))]),
}));

/** How many different full names the pools can make. */
export function nameCombinations(): number {
  return NAME_POOLS.reduce((sum, pool) => sum + pool.first.length * pool.last.length, 0);
}

const BY_CODE = new Map(NAME_POOLS.map((p) => [p.code, p]));

export function namePoolFor(code: string | null | undefined): NamePool | undefined {
  return code ? BY_CODE.get(code) : undefined;
}

/**
 * Pairs the generator skips, as positions in a pool (code, given-name index, surname index): thirteen combinations of
 * the original core names that happen to match a real professional on the development team's private check list.
 * Positions, not names, so nothing here spells one out. No fictional professional or alias uses any of them.
 */
const SKIPPED_PAIRS = new Set(
  ([['CAN', 11, 1], ['CAN', 14, 1], ['FIN', 1, 14], ['FIN', 4, 2], ['FIN', 14, 13], ['RUS', 2, 6], ['RUS', 6, 10], ['CZE', 1, 0], ['CZE', 3, 3], ['CZE', 10, 5], ['SVK', 1, 2], ['GER', 5, 4], ['DEN', 13, 11]] as const).map(
    ([code, f, l]) => `${code}:${f}:${l}`,
  ),
);

/** A fictional name from the pool for this nationality, or from a pool chosen at random when there is none for it. */
export function randomName(rng: Rng, code?: string | null): { first: string; last: string; code: string } {
  const pool = namePoolFor(code) ?? (NAME_POOLS[rng.int(NAME_POOLS.length)] as NamePool);
  for (;;) {
    const f = rng.int(pool.first.length);
    const l = rng.int(pool.last.length);
    if (SKIPPED_PAIRS.has(`${pool.code}:${f}:${l}`)) continue;
    return { first: pool.first[f] as string, last: pool.last[l] as string, code: pool.code };
  }
}

/** Whether the generator can produce this exact pair. */
export function isSkippedPair(code: string, firstIndex: number, lastIndex: number): boolean {
  return SKIPPED_PAIRS.has(`${code}:${firstIndex}:${lastIndex}`);
}
