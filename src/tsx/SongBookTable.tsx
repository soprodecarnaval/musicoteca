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
  isSongBookSection,
  songBookSection,
  PlayingPart,
  SongBookItem,
  Score,
} from "../../types";

import { SongBookScoreRow } from "./SongBookScoreRow";
import { SongBookSectionRow } from "./SongBookSectionRow";
import { ChangeEvent, useState } from "react";
import { Sort } from "./Sort";
import {
  carnivalSectionOrder,
  deleteRow,
  generateCarnivalSections,
  generateSectionsByStyle,
  moveRow,
  sortSongsWithinSections as sortScoreWithSections,
} from "../utils/songBookRows";

interface SongBookTableProps {
  rows: SongBookItem[];
  setItems: (rows: SongBookItem[]) => void;
  handleSelect: (song: Score, checked: boolean) => void;
  onSetPlayingPart: (song: PlayingPart) => void;
  handleClear: () => void;
}

interface SongBookTableRowProps {
  row: SongBookItem;
  idx: number;
}

const SongBookTable = ({
  rows,
  setItems: setRows,
  handleSelect,
  handleClear,
  onSetPlayingPart: handlePlayingSong,
}: SongBookTableProps) => {
  const [newSection, setNewSection] = useState<string>("");

  const onInputNewSection = (e: ChangeEvent<HTMLInputElement>) =>
    setNewSection(e.target.value);

  const onSubmitNewSection = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    createNewSection();
  };

  const createNewSection = () => {
    const newRows = [...rows, songBookSection(newSection)];
    setRows(newRows);
    setNewSection("");
  };

  const CarnivalSectionsToolTip = () => (
    <Tooltip id="tooltip">
      Reorganiza seções como no caderninho do carnaval:
      <ListGroup>
        {carnivalSectionOrder.map((section) => (
          <ListGroup.Item key={`section-${section}`}>{section}</ListGroup.Item>
        ))}
      </ListGroup>
    </Tooltip>
  );

  const SongBookTableRow = ({ row, idx }: SongBookTableRowProps) => {
    if (isSongBookSection(row)) {
      return (
        <SongBookSectionRow
          handleDelete={() => setRows(deleteRow(rows, idx))}
          handleMove={(steps) => setRows(moveRow(rows, idx, steps))}
          title={row.title}
        />
      );
    }
    return (
      <SongBookScoreRow
        score={row.score}
        handleDelete={handleSelect}
        key={row.score.id}
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
            onSortBy={(col, dir) => sortScoreWithSections(rows, col, dir)}
          />
        </Col>
        <Col>
          <Form className="d-flex" onSubmit={onSubmitNewSection}>
            <Col>
              <Form.Control
                type="text"
                onChange={onInputNewSection}
                value={newSection}
                placeholder="Adicionar seção"
              />
            </Col>
            <Col>
              <Button onClick={createNewSection}>+ seção</Button>
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
        <tbody>
          {rows.map((row, idx) => (
            <SongBookTableRow key={idx} row={row} idx={idx} />
          ))}
        </tbody>
      </Table>
      <Row className="mt-4">
        <Col>
          <p>
            {rows.filter(isSongBookSection).length} seções e{" "}
            {rows.filter((r: any) => !isSongBookSection(r)).length} músicas
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
          <OverlayTrigger placement="left" overlay={CarnivalSectionsToolTip}>
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
