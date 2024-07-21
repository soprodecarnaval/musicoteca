import "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { DragHandle } from "./DragHandle";

interface SongBookDraggableRowProps {
  children: React.ReactNode;
}

export const SongBookDraggableRow = ({
  children,
}: SongBookDraggableRowProps) => {
  const {
    attributes,
    listeners,
    transform,
    transition,
    setNodeRef,
    isDragging,
  } = useSortable({
    id: row.original.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
  };
  return (
    <tr ref={setNodeRef} style={style} {...row.getRowProps()}>
      {isDragging ? (
        <div className="draggingRow">&nbsp;</div>
      ) : (
        row.cells.map((cell, i) => {
          if (i === 0) {
            return (
              <TableData {...cell.getCellProps()}>
                <DragHandle {...attributes} {...listeners} />
                {children}
              </TableData>
            );
          }
          return (
            <TableData {...cell.getCellProps()}>
              {cell.render("Cell")}
            </TableData>
          );
        })
      )}
    </tr>
  );
};
