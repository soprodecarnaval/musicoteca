import { Table } from "react-bootstrap";

import type { Song } from "../types";

import { ArrangementItem } from "./ArrangementItem";
import { PaginationBar } from './PaginationBar';
import { useState } from "react";

interface ArrangementsTableProps {
  songs: Song[];
  handleSelect: (song: Song, checked: boolean) => void;
  handlePlayingSong: (song: Song) => void;
}

const ArrangementsTable = ({
  songs,
  handleSelect,
  handlePlayingSong,
}: ArrangementsTableProps) => {
  const [currentPage, setCurrentPagee] = useState(1);

  const maxNumberPages = Math.round(songs.length / 10) + 1;

  const handlePageChange = (pageNumber : number) => {
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
          {songs.slice((currentPage - 1) * 10, currentPage * 10).map((song, songIdx) =>
            song.arrangements.map((arrangement) => (
              <ArrangementItem
                handleSelect={handleSelect}
                arrangement={arrangement}
                song={songs[songIdx]}
                key={arrangement.name}
                handlePlayingSong={handlePlayingSong}
              />
            ))
          )}
        </tbody>
      </Table>
      <PaginationBar onChange={handlePageChange} currentPage={currentPage} maxNumberPages={maxNumberPages} />
    </>
  );
};

export { ArrangementsTable };
