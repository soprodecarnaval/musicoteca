import z from "zod";

export const zInstrument = z.enum([
  "bombardino",
  "clarinete",
  "flauta",
  "sax alto",
  "sax soprano",
  "sax tenor",
  "trombone",
  "trombone pirata",
  "trompete",
  "trompete pirata",
  "tuba",
]);
export type Instrument = z.infer<typeof zInstrument>;

export const zPart = z.object({
  name: z.string(),
  instrument: zInstrument,
  svg: z.string(),
  midi: z.string(),
});
export type Part = z.infer<typeof zPart>;

export const zSong = z.object({
  title: z.string(),
  composer: z.string(),
  sub: z.string(),
  mscz: z.string(),
  metajson: z.string(),
  midi: z.string(),
  parts: z.array(zPart),
  tags: z.array(z.string()),
});
export type Song = z.infer<typeof zSong>;

export interface Project {
  title: string;
  songs: Song[];
}

export interface Collection {
  projects: Project[];
  scrapedAt: Date;
  version: 2;
}

export type PlayingSong = {
  songName: string;
  arrangementName: string;
  partName: string;
};
