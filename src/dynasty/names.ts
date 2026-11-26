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

export const NAME_POOLS: readonly NamePool[] = [
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

const BY_CODE = new Map(NAME_POOLS.map((p) => [p.code, p]));

export function namePoolFor(code: string | null | undefined): NamePool | undefined {
  return code ? BY_CODE.get(code) : undefined;
}

/** A fictional name from the pool for this nationality, or from a pool chosen at random when there is none for it. */
export function randomName(rng: Rng, code?: string | null): { first: string; last: string; code: string } {
  const pool = namePoolFor(code) ?? (NAME_POOLS[rng.int(NAME_POOLS.length)] as NamePool);
  return { first: pool.first[rng.int(pool.first.length)] as string, last: pool.last[rng.int(pool.last.length)] as string, code: pool.code };
}
