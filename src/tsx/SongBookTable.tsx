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
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  type PlayingSong,
  type SongArrangement,
  type SongBookRow,
} from "../types";

import { SongBookArrangementRow } from "./SongBookArrangementRow";
import { SongBookSectionRow } from "./SongBookSectionRow";
import { useState } from "react";
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
  const [activeId, setActiveId] = useState<null | UniqueIdentifier>(null);
  const [newSection, setNewSection] = useState<string>("");

  const onInputNewSection = ({ target: { value } }: React.ChangeEvent) =>
    setNewSection(value);

  const onCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    const newRows = [...rows, newSection];
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active?.id && over?.id && active.id !== over.id) {
      const oldIndex = rows.findIndex((r) => r.id === active.id);
      const newIndex = rows.findIndex((r) => r.id === over.id);
      const newRows = arrayMove(rows, oldIndex, newIndex);
      setRows(newRows);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const activeRow = activeId ? rows.find((r) => r.id === activeId) : null;

  const renderRow = (row: SongBookRow) => {
    if (row.type === "section") {
      return (
        <SongBookSectionRow
          handleDelete={() => setRows(deleteRow(rows, row.id))}
          title={row.data.title}
          key={row.id}
        />
      );
    }
    return (
      <SongBookArrangementRow
        handleDelete={handleSelect}
        songArrangement={row.data}
        key={row.id}
        handlePlayingSong={handlePlayingSong}
      />
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
    >
      <Table>
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
          {rows.map((row) => renderRow(row))}
        </Table>
        <Row className="mt-4">
          <Col>
            <p>
              {rows.filter((r) => r.type == "section").length} seções e{" "}
              {rows.filter((r) => r.type === "arrangement").length} músicas
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
      </Table>
      <DragOverlay>
        {activeRow && <Table>{renderRow(activeRow)}</Table>}
      </DragOverlay>
    </DndContext>
  );
};

export { SongBookTable };
