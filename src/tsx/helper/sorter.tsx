import { SongBookRow } from "../../types";

const fixedStyleOrder = [
  "marchinhas",
  "ranchos",
  "beagá",
  "axés",
  "frevos",
  "sambas",
  "pagodes",
  "latinas",
  "funks",
  "brazukas",
  "odaras",
  "fanfarras",
  "technohell",
];

export const sortByColumn = (
  arrayToSort: SongBookRow[],
  columnToSort: string,
  directionToSort: string,
) => {
  let sorted = arrayToSort.sort((a: SongBookRow, b: SongBookRow) => {
    if (a.type != "arrangement" || b.type != "arrangement") {
      return 0;
    }
    if (columnToSort === "title") {
      return a.data.song.title.localeCompare(b.data.song.title);
    } else if (columnToSort === "arrangements") {
      return a.data.arrangement.name.localeCompare(b.data.arrangement.name);
    } else if (columnToSort === "tags") {
      return a.data.arrangement.tags[0].localeCompare(
        b.data.arrangement.tags[0],
      );
    } else if (columnToSort === "style") {
      if (a.data.song.style === b.data.song.style) {
        return a.data.song.title.localeCompare(b.data.song.title);
      }
      return (
        fixedStyleOrder.indexOf(a.data.song.style) -
        fixedStyleOrder.indexOf(b.data.song.style)
      );
    }
    return 0;
  });

  if (directionToSort === "desc") sorted = sorted.reverse();

  return sorted;
};
