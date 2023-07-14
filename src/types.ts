export interface Collection {
  songs: Song[]
}

export interface Song {
  title: string
  composer: string
  sub: string
  tags: string[]
  arrangements: Arrangement[]
}

export interface Arrangement {
  source: { url: string, type: string }
  name: string
  parts: Part[]
}

export interface Part {
  instrument: string
  files: { url: string, type: "png" | "svg" }[]
}
