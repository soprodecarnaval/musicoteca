import {
  SongArrangement,
  SongBookRow,
  isSongBookRowSection,
} from "../../types";
import { sortByColumn } from "./sorter";

// moves a row up or down, swapping it with the row in the new position
export const moveRow = (rows: SongBookRow[], idx: number, steps: number) => {
  if (idx + steps < 0 || idx + steps >= rows.length) {
    return rows;
  }

  // move the rows
  const newRows = [...rows];
  const temp = newRows[idx];
  newRows[idx] = newRows[idx + steps];
  newRows[idx + steps] = temp;
  return newRows;
};

export const deleteRow = (rows: SongBookRow[], idx: number) => {
  const newRows = [...rows];
  newRows.splice(idx, 1);
  return newRows;
};

export const sortSongsWithinSections = (
  rows: SongBookRow[],
  column: string,
  direction: string
) => {
  // sort slices of songs delimited by sections
  const sorted = [];
  let slice = [];
  for (const row of rows) {
    if (isSongBookRowSection(row)) {
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
  const newRows = rows.filter((r) => !isSongBookRowSection(r));

  // create sections
  const sections = new Map<string, SongBookRow[]>();
  for (const row of newRows) {
    // keep type system happy
    if (isSongBookRowSection(row)) {
      continue;
    }
    const style = row.song.style;
    if (sections.has(style)) {
      sections.get(style)?.push(row);
    } else {
      sections.set(style, [row]);
    }
  }

  // regenerate rows
  const sorted = [];
  for (const [key, value] of sections.entries()) {
    sorted.push(key);
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
    const idx = rows.findIndex((r) => isSongBookRowSection(r) && r === section);
    if (idx === -1) {
      continue;
    }
    // push style
    newRows.push(rows[idx]);

    // add all songs in section
    const slice: SongArrangement[] = [];
    for (let i = idx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (isSongBookRowSection(row)) {
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
