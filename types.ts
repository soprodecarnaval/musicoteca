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
  "tuba eb",
]);
export type Instrument = z.infer<typeof zInstrument>;

export const zPart = z.object({
  name: z.string(),
  instrument: zInstrument,
  svg: z.string(),
  midi: z.string(),
});
export type Part = z.infer<typeof zPart>;

export const zScore = z.object({
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
export type Score = z.infer<typeof zScore>;

export interface Project {
  title: string;
  scores: Score[];
}

export const zCollection = z.object({
  projects: z.array(z.object({ title: z.string(), scores: z.array(zScore) })),
  version: z.literal(2),
});

export type Collection = z.infer<typeof zCollection>;

export type PlayingPart = {
  score: Score;
  part: Part;
};

export type SongBookScore = {
  type: "score";
  score: Score;
};

export type SongBookSection = {
  type: "section";
  title: string;
};

export type SongBookItem = SongBookScore | SongBookSection;

export type SongBook = {
  items: SongBookItem[];
};

export const isSongBookSection = (row: SongBookItem): row is SongBookSection =>
  row.type === "section";

export const songBookScore = (score: Score): SongBookScore => ({
  type: "score",
  score: score,
});

export const songBookSection = (title: string): SongBookSection => ({
  type: "section",
  title,
});
