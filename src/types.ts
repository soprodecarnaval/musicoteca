export type Collection = {
  songs: Song[];
  tags: Tag[];
};

export type Song = {
  id: string;
  title: string;
  composer: string;
  sub: string;
  arrangements: Arrangement[];
  style: Tag;
};

export type Arrangement = {
  id: string;
  assets: Asset[];
  name: string;
  parts: Part[];
  tags: Tag[];
};

export type SongArrangement = {
  arrangement: Arrangement;
  song: Song;
};

export type SongArrangementSection = {
  title: string;
  songArrangements: SongArrangement[];
};

export type Tag = string;
export type Style = Tag;

export type Asset = {
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
  assets: Asset[];
};

export type PlayingSong = {
  songName: string;
  arrangementName: string;
  partName: string;
};

export type SongBookSection = { title: string };
export type SongBookRow =
  | {
      id: number;
      type: "arrangement";
      data: SongArrangement;
    }
  | { id: number; type: "section"; data: SongBookSection };

export type SongBook = {
  rows: SongBookRow[];
};
