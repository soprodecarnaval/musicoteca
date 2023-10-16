export type Tag = string;

export type Song = {
  type: "song";
  id: string;
  title: string;
  composer: string;
  sub: string;
  tags: Tag[];
  arrangements: Arrangement[];
};

export type Arrangement = {
  type: "arrangement";
  id: string;
  files: CollectionFile[];
  name?: string;
  parts: Part[];
};

export type CollectionFile = {
  type: "file";
  url: string;
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
  type: "part";
  name: string;
  instrument: Instrument;
  files: CollectionFile[];
};
