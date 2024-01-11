import { Button, Col, Form, Row, Table } from "react-bootstrap";

import {
  isSongBookRowSection,
  type PlayingSong,
  type SongArrangement,
  type SongBookRow,
} from "../types";

import { SongBookArrangementRow } from "./SongBookArrangementRow";
import { SongBookSectionRow } from "./SongBookSectionRow";
import { useState } from "react";

interface SongBookTableProps {
  rows: SongBookRow[];
  setRows: (rows: SongBookRow[]) => void;
  handleSelect: (song: SongArrangement, checked: boolean) => void;
  handlePlayingSong: (song: PlayingSong) => void;
  handleClear: () => void;
}

const SongBookTable = ({
  rows,
  setRows,
  handleSelect,
  handleClear,
  handlePlayingSong,
}: SongBookTableProps) => {
  const [newSection, setNewSection] = useState<string>("Adicionar seção");

  const onInputNewSection = ({ target: { value } }: any) =>
    setNewSection(value);

  const onCreateSection = (e: any) => {
    e.preventDefault();
    const newRows = [...rows, newSection];
    setRows(newRows);
    setNewSection("");
  };

  // moves a row up or down, swapping it with the row in the new position
  const moveRow = (idx: number, steps: number) => {
    if (idx + steps < 0 || idx + steps >= rows.length) {
      return;
    }

    // move the rows
    const newRows = [...rows];
    const temp = newRows[idx];
    newRows[idx] = newRows[idx + steps];
    newRows[idx + steps] = temp;
    setRows(newRows);
  };

  const deleteRow = (idx: number) => {
    const newRows = [...rows];
    newRows.splice(idx, 1);
    setRows(newRows);
  };

  const renderRow = (row: SongBookRow, idx: number) => {
    if (isSongBookRowSection(row)) {
      return (
        <SongBookSectionRow
          handleDelete={() => deleteRow(idx)}
          handleMove={(steps) => moveRow(idx, steps)}
          title={row}
          key={row}
        />
      );
    }
    return (
      <SongBookArrangementRow
        handleDelete={handleSelect}
        songArrangement={row}
        key={row.arrangement.name}
        handlePlayingSong={handlePlayingSong}
        handleMove={(steps) => moveRow(idx, steps)}
      />
    );
  };

  return (
    <>
      <Form className="d-flex" onSubmit={onCreateSection}>
        <Row>
          <Col>
            <Form.Control
              type="text"
              onChange={onInputNewSection}
              value={newSection}
              placeholder="Adicionar seção"
            />
          </Col>
        </Row>
      </Form>
      <Table striped borderless hover>
        <thead>
          <tr>
            <th></th>
            <th>Título</th>
            <th>Arranjo</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>{rows.map((row, idx) => renderRow(row, idx))}</tbody>
      </Table>
      <Row className="mt-4">
        <Col sm={2}>
          <Button onClick={handleClear}>Limpar</Button>
        </Col>
      </Row>
    </>
  );
};

export { SongBookTable };
