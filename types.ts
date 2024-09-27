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
  id: z.string(),
  title: z.string(),
  composer: z.string(),
  sub: z.string(),
  mscz: z.string(),
  metajson: z.string(),
  midi: z.string(),
  parts: z.array(zPart),
  tags: z.array(z.string()),
  projectTitle: z.string(),
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

export type SongBook = {
  rows: SongBookRow[];
};

export type SongBookRowSong = {
  type: "song";
  song: Song;
};

export type SongBookRowSection = {
  type: "section";
  title: string;
};

export type SongBookRow = SongBookRowSong | SongBookRowSection;

export const isSongBookRowSection = (
  row: SongBookRow
): row is SongBookRowSection => row.type === "section";

export const songBookRowSong = (song: Song): SongBookRowSong => ({
  type: "song",
  song,
});

export const songBookRowSection = (title: string): SongBookRowSection => ({
  type: "section",
  title,
});
