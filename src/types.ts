export type Collection = {
  arrangements: { [id: string]: Arrangement };
  songs: { [id: string]: Song };
  tags: Tag[];
};

export type Song = {
  id: string;
  title: string;
  composer: string;
  sub: string;
  arrangementIds: string[];
  style: Tag;
};

export type HydratedSong = Song & {
  arrangements: Arrangement[];
};

export type Arrangement = {
  id: string;
  files: File[];
  name: string;
  parts: Part[];
  tags: Tag[];
  songId: string;
};

export type Tag = string;
export type Style = Tag;

export type File = {
  path: string;
  extension: string;
};

export type Instrument =
  | "bombardino"
  | "clarinete"
  | "flauta"
  | "sax alto"
  | "sax soprano"
  | "sax tenor"
  | "trombone"
  | "trombone pirata"
  | "trompete"
  | "trompete pirata"
  | "tuba";

export type Part = {
  name: string;
  instrument: Instrument;
  files: File[];
};
