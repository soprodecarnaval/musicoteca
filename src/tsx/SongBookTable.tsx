import {
  Button,
  Col,
  Form,
  ListGroup,
  OverlayTrigger,
  Row,
  Table,
  Tooltip,
} from "react-bootstrap";

import {
  isSongBookRowSection,
  songBookRowSection,
  type PlayingSong,
  type Song,
  type SongBookRow,
} from "../../types";

import { SongBookArrangementRow } from "./SongBookArrangementRow";
import { SongBookSectionRow } from "./SongBookSectionRow";
import { ChangeEvent, FormEventHandler, useState } from "react";
import { Sort } from "./Sort";
import {
  carnivalSectionOrder,
  deleteRow,
  generateCarnivalSections,
  generateSectionsByStyle,
  moveRow,
  sortSongsWithinSections,
} from "./helper/songBookRows";

interface SongBookTableProps {
  rows: SongBookRow[];
  setRows: (rows: SongBookRow[]) => void;
  handleSelect: (song: Song, checked: boolean) => void;
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
  const [newSection, setNewSection] = useState<string>("");

  const onInputNewSection = (e: ChangeEvent<HTMLInputElement>) =>
    setNewSection(e.target.value);

  const onCreateSection = (e: FormEventHandler<HTMLFormElement>) => {
    e.preventDefault();
    const newRows = [...rows, songBookRowSection(newSection)];
    setRows(newRows);
    setNewSection("");
  };

  const carnivalSectionsTooltip = (
    <Tooltip id="tooltip">
      Reorganiza seções como no caderninho do carnaval:
      <ListGroup>
        {carnivalSectionOrder.map((section) => (
          <ListGroup.Item>{section}</ListGroup.Item>
        ))}
      </ListGroup>
    </Tooltip>
  );

  const renderRow = (row: SongBookRow, idx: number) => {
    if (isSongBookRowSection(row)) {
      return (
        <SongBookSectionRow
          handleDelete={() => setRows(deleteRow(rows, idx))}
          handleMove={(steps) => setRows(moveRow(rows, idx, steps))}
          title={row.title}
          key={row.title}
        />
      );
    }
    return (
      <SongBookArrangementRow
        handleDelete={handleSelect}
        songArrangement={row}
        key={row.song.id}
        handlePlayingSong={handlePlayingSong}
        handleMove={(steps) => setRows(moveRow(rows, idx, steps))}
      />
    );
  };

  return (
    <>
      <Row>
        <Col sm="4">
          <Sort
            onSortBy={(col, dir) => sortSongsWithinSections(rows, col, dir)}
          />
        </Col>
        <Col>
          <Form className="d-flex" onSubmit={onCreateSection}>
            <Col>
              <Form.Control
                type="text"
                onChange={onInputNewSection}
                value={newSection}
                placeholder="Adicionar seção"
              />
            </Col>
            <Col>
              <Button onClick={onCreateSection}>+ seção</Button>
            </Col>
          </Form>
        </Col>
      </Row>
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
        <Col>
          <p>
            {rows.filter(isSongBookRowSection).length} seções e{" "}
            {rows.filter((r: any) => !isSongBookRowSection(r)).length} músicas
          </p>
        </Col>
        <Col>
          <Button onClick={handleClear}>Limpar tudo</Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <Button onClick={() => setRows(generateSectionsByStyle(rows))}>
            Gerar seções por estilo
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <OverlayTrigger placement="left" overlay={carnivalSectionsTooltip}>
            <Button onClick={() => setRows(generateCarnivalSections(rows))}>
              Aplicar ordenação do carnaval
            </Button>
          </OverlayTrigger>
        </Col>
      </Row>
    </>
  );
};

export { SongBookTable };
