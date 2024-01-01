import { SongArrangement } from "../../types";

const fixedStyleOrder = [
  "marchinhas", "ranchos", "beagá", "axés", "frevos", "sambas", "pagodes",
  "latinas", "funks", "brazukas", "odaras", "fanfarras", "technohell"
]

export const sortByColumn = (
  arrayToSort: SongArrangement[],
  columnToSort: string,
  directionToSort: string
) => {
  let sorted = arrayToSort.sort((a: any, b: any) => {
    if (columnToSort === "title") {
      return a.song.title.localeCompare(b.song.title);
    } else if (columnToSort === "arrangements") {
      return a.arrangement.name.localeCompare(b.arrangement.name);
    } else if (columnToSort === "tags") {
      return a.arrangement.tags[0].localeCompare(b.arrangement.tags[0]);
    } else if (columnToSort === "style") {
      if (a.song.style === b.song.style) {
        return a.song.title.localeCompare(b.song.title);
      }
      return fixedStyleOrder.indexOf(a.song.style) - fixedStyleOrder.indexOf(b.song.style);
    }
  });

  if (directionToSort === "desc") sorted = sorted.reverse();

  return sorted;
};
