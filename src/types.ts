export interface Song {
  id: number
  title: string
  composer: string
  sub: string
  tags: string[]
  arrangements: Arrangement[]
}

export interface Arrangement {
  id: number
  source: { url: string, type: string }
  name: string
  parts: Part[]
}

export interface Part {
  instrument: string
  files: File[]
}

export interface File {
  url: string
  type: "png" | "svg" 
}
