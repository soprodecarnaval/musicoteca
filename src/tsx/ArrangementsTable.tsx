import { Table } from "react-bootstrap";

import type { PlayingSong, SongArrangement } from "../types";

import { ArrangementItem } from "./ArrangementItem";
import { PaginationBar } from "./PaginationBar";
import { useState } from "react";

interface ArrangementsTableProps {
  songArrangements: SongArrangement[];
  handleSelect: (songArrangement: SongArrangement, checked: boolean) => void;
  handlePlayingSong: (info: PlayingSong) => void;
}

const ArrangementsTable = ({
  songArrangements,
  handleSelect,
  handlePlayingSong,
}: ArrangementsTableProps) => {
  const [currentPage, setCurrentPagee] = useState(1);

  const maxNumberPages = Math.round(songArrangements.length / 10) + 1;

  const handlePageChange = (pageNumber: number) => {
    setCurrentPagee(pageNumber);
  };

  return (
    <>
      <Table striped borderless hover>
        <thead>
          <tr>
            <th></th>
            <th>Título</th>
            <th>Arranjo</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {songArrangements
            .slice((currentPage - 1) * 10, currentPage * 10)
            .map((songArrangement) => (
              <ArrangementItem
                handleSelect={handleSelect}
                songArrangement={songArrangement}
                key={songArrangement.arrangement.name}
                handlePlayingSong={handlePlayingSong}
              />
            ))}
        </tbody>
      </Table>
      <PaginationBar
        onChange={handlePageChange}
        currentPage={currentPage}
        maxNumberPages={maxNumberPages}
      />
    </>
  );
};

export { ArrangementsTable };
