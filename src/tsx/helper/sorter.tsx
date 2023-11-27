import { SongArrangement } from "../../types";

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
    }
  });

  if (directionToSort === "desc") sorted = sorted.reverse();

  return sorted;
};
