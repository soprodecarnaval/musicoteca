import { Button, Col, Row, Table } from "react-bootstrap";
import { useState } from "react";

import type { PlayingSong, SongArrangement } from "../types";

import { PaginationBar } from "./PaginationBar";
import { ChosenArrangementItem } from "./ChosenArrangementItem";

interface ArrangementsTableProps {
  songArrangements: SongArrangement[];
  handleSelect: (song: SongArrangement, checked: boolean) => void;
  handlePlayingSong: (song: PlayingSong) => void;
  handleClear: () => void;
}

const ChosenArrangementsTable = ({
  songArrangements: songs,
  handleSelect,
  handleClear,
  handlePlayingSong,
}: ArrangementsTableProps) => {
  const [currentPage, setCurrentPagee] = useState(1);

  const maxNumberPages = Math.ceil(songs.length / 10);

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
          {songs
            .slice((currentPage - 1) * 10, currentPage * 10)
            .map((songArrangement) => (
              <ChosenArrangementItem
                handleSelect={handleSelect}
                songArrangement={songArrangement}
                key={songArrangement.arrangement.name}
                handlePlayingSong={handlePlayingSong}
              />
            ))}
        </tbody>
      </Table>
      <Row className="mt-4">
        <Col sm={10}>
          <PaginationBar
            onChange={handlePageChange}
            currentPage={currentPage}
            maxNumberPages={maxNumberPages}
          />
        </Col>
        <Col sm={2}>
          <Button onClick={handleClear}>Limpar</Button>
        </Col>
      </Row>
    </>
  );
};

export { ChosenArrangementsTable };
