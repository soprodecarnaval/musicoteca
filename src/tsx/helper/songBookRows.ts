import { SongArrangement, SongBookRow } from "../../types";
import { sortByColumn } from "./sorter";

let id = new Date().getTime();

export const createArrangementRow = (
  songArrangement: SongArrangement,
): SongBookRow => {
  return {
    id: id++,
    type: "arrangement",
    data: songArrangement,
  };
};

export const createSectionRow = (title: string): SongBookRow => {
  return {
    id: id++,
    type: "section",
    data: { title },
  };
};

export const deleteRow = (rows: SongBookRow[], id: number) => {
  const idx = rows.findIndex((r) => r.id === id);
  if (idx) {
    rows.splice(idx, 1);
  }
  return rows;
};

export const sortSongsWithinSections = (
  rows: SongBookRow[],
  column: string,
  direction: string,
) => {
  // sort slices of songs delimited by sections
  const sorted = [];
  let slice = [];
  for (const row of rows) {
    if (row.type == "section") {
      if (slice.length > 0) {
        sorted.push(...sortByColumn(slice, column, direction));
      }
      sorted.push(row);
      slice = [];
    } else {
      slice.push(row);
    }
  }
  // sort last slice
  if (slice.length > 0) {
    sorted.push(...sortByColumn(slice, column, direction));
  }

  return sorted;
};

export const generateSectionsByStyle = (rows: SongBookRow[]) => {
  // remove all sections
  const newRows = rows.filter((r) => r.type !== "section");

  // create sections
  const sections = new Map<string, SongBookRow[]>();
  for (const row of newRows) {
    if (row.type !== "arrangement") {
      continue;
    }
    const style = row.data.song.style;
    if (sections.has(style)) {
      sections.get(style)?.push(row);
    } else {
      sections.set(style, [row]);
    }
  }

  // regenerate rows
  const sorted: SongBookRow[] = [];
  for (const [key, value] of sections.entries()) {
    sorted.push(createSectionRow(key));
    sorted.push(...value);
  }
  return sorted;
};

export const carnivalSectionOrder = [
  "marchinhas", // 14
  "beagá", // 9
  "fanfarras", // 8
  "pagodes", // 6
  "odaras", // 7
  "marcha ranchos", // 7
  "latinas", // 5
  "piseiro",

  "axés", // 15
  "funks", // 14
  "sambas", // 13
  "brazukas", // 11
  "frevos", // 4
  "forrós", // 4
  "technohell", // 3
];

export const generateCarnivalSections = (rows: SongBookRow[]) => {
  rows = generateSectionsByStyle(rows);

  // pick only carnival sections, keeping their order
  // ignore sections not in the order
  const newRows = [];
  for (const section of carnivalSectionOrder) {
    // find section index
    const idx = rows.findIndex(
      (r) => r.type === "section" && r.data.title === section,
    );
    if (idx === -1) {
      continue;
    }
    // push style
    newRows.push(rows[idx]);

    // add all songs in section
    const slice: SongBookRow[] = [];
    for (let i = idx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.type == "section") {
        break;
      }
      slice.push(row);
    }
    // push sorted slice
    const sorted = sortByColumn(slice, "title", "asc");
    newRows.push(...sorted);
  }
  return newRows;
};
