import { Button, Col, Row, Table } from "react-bootstrap";
import { useState } from "react";

import type { HydratedSong } from "../types";

import { PaginationBar } from './PaginationBar';
import { ChosenArrangementItem } from "./ChosenArrangementItem";

interface ArrangementsTableProps {
  songs: HydratedSong[];
  handleCheck: (song: HydratedSong, checked: boolean) => void;
  handleClear: () => void;
}

const ChosenArrangementsTable = ({
  songs,
  handleCheck,
  handleClear,
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
              <ChosenArrangementItem
                handleCheck={handleCheck}
                arrangement={arrangement}
                song={songs[songIdx]}
                key={arrangement.name}
              />
            ))
          )}
        </tbody>
      </Table>
      <Row className="mt-4">
        <Col sm={10}>
          <PaginationBar onChange={handlePageChange} currentPage={currentPage} maxNumberPages={maxNumberPages} />
        </Col>
        <Col sm={2}>
          <Button onClick={handleClear}>Limpar</Button>
        </Col>
      </Row>
    </>
  );
};

export { ChosenArrangementsTable };
