export type Tag = string;

export type Song = {
  type: "song";
  id: number;
  title: string;
  composer: string;
  sub: string;
  tags: Tag[];
  arrangements: Arrangement[];
};

export type Arrangement = {
  type: "arrangement";
  id: number;
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
  | "trompete"
  | "tuba";

export type Part = {
  type: "part";
  name: string;
  instrument: Instrument;
  files: CollectionFile[];
};
