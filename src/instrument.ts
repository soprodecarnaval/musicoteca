import { Instrument } from "../types";
const instrumentAliases: [string, Instrument][] = [
  // bombardino
  ["bombardino", "bombardino"],
  // clarinete
  ["clarinet", "clarinete"],
  ["clarinete", "clarinete"],
  ["clarineta", "clarinete"],
  // flauta
  ["flauta", "flauta"],
  ["flute", "flauta"],
  ["flauta transversal", "flauta"],
  // sax alto
  ["alto", "sax alto"],
  ["sax alto", "sax alto"],
  ["sax alta", "sax alto"],
  ["saxophone alto", "sax alto"],
  ["alto sax", "sax alto"],
  // sax soprano
  ["soprano", "sax soprano"],
  ["sax soprano", "sax soprano"],
  ["soprano sax", "sax soprano"],
  ["saxophone soprano", "sax soprano"],
  // sax tenor
  ["tenor", "sax tenor"],
  ["sax tenor", "sax tenor"],
  ["sax ternor", "sax tenor"],
  ["tenor sax", "sax tenor"],
  ["saxophone tenor", "sax tenor"],
  // trombone
  ["trombone com pirata", "trombone pirata"],
  ["trombone sem pirata", "trombone"],
  ["trombone pirata", "trombone pirata"],
  ["trombone", "trombone"],
  ["bone com pirata", "trombone pirata"],
  ["bone sem pirata", "trombone"],
  ["bone pirata", "trombone pirata"],
  ["bone", "trombone"],
  // trompete
  ["trompete sem pirata", "trompete"],
  ["trompete com pirata", "trompete pirata"],
  ["trompete pirata", "trompete pirata"],
  ["trompete", "trompete"],
  ["trumpet", "trompete"],
  ["trompette", "trompete"],
  ["pete com pirata", "trompete pirata"],
  ["pete sem pirata", "trompete"],
  ["pete pirata", "trompete pirata"],
  ["pete", "trompete"],
  // tuba
  ["tuba", "tuba"],
  ["sousaphone", "tuba"],
];

// We will sort them by number of parts descending, so we're sure that
// names with more parts will be matched before their subsets (e.g: 'trompete pirata' < 'trompete')
instrumentAliases.sort(
  (a, b) => b[0].split(" ").length - a[0].split(" ").length
);

export const parseInstrument = (raw: string): Instrument | undefined => {
  const normalized = raw.replace(/[_\-.]/g, " ").toLowerCase();
  const match = instrumentAliases.find(([alias]) => normalized.includes(alias));
  return match ? match[1] : undefined;
};
