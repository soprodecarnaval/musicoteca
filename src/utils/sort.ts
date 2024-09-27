import { Score } from "../../types";

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

export type SortColumn = "title" | "projectTitle" | "style" | "carnivalStyle";

export type SortDirection = "asc" | "desc";

export const sortByColumn = (
  arrayToSort: Score[],
  columnToSort: SortColumn,
  directionToSort: SortDirection
): Score[] => {
  let sorted: Score[] = arrayToSort.sort((a: Score, b: Score) => {
    if (columnToSort === "title") {
      return a.title.localeCompare(b.title);
    } else if (columnToSort === "projectTitle") {
      return a.projectTitle.localeCompare(b.projectTitle);
    } else if (columnToSort === "style") {
      if (a.tags[0] === b.tags[0]) {
        return a.tags[0].localeCompare(b.tags[0]);
      }
    } else if (columnToSort === "carnivalStyle") {
      if (a.tags[0] === b.tags[0]) {
        return a.tags[0].localeCompare(b.tags[0]);
      }
      return (
        // TODO: use same fixed style array as in SongBook.tsx
        fixedStyleOrder.indexOf(a.tags[0]) - fixedStyleOrder.indexOf(b.tags[0])
      );
    }
    return 0;
  });

  if (directionToSort === "desc") sorted = sorted.reverse();

  return sorted;
};
