import { Score } from "../../types";

export const carnivalSectionOrder = [
  "marchinha",
  "moments",
  "beagá",
  "fanfarra", // antiga
  "ebb",
  "odara",
  "marcha rancho", // antiga
  "rancho", // antiga
  "latina", // antiga
  "piseiro", // antiga
  "axé",
  "funk",
  "pagode",
  "samba",
  "brazuka",
  "frevo",
  "brega",
  "forrós", // antiga
  "technohell",
  "internacional", // antiga
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
      const cmpSection =
        carnivalSectionOrder.indexOf(a.tags[0]) -
        carnivalSectionOrder.indexOf(b.tags[0]);
      return cmpSection == 0 ? a.title.localeCompare(b.title) : cmpSection;
    }
    return 0;
  });

  if (directionToSort === "desc") sorted = sorted.reverse();

  return sorted;
};
