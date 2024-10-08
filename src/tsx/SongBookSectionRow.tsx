import { BsArrowDown, BsArrowUp, BsFillTrashFill } from "react-icons/bs";

import "../css/ScoreRow.css";

interface SongBookSectionRowProps {
  handleDelete: () => void;
  handleMove: (steps: number) => void;
  title: string;
}

const SongBookSectionTableRow = ({
  handleDelete,
  handleMove,
  title,
}: SongBookSectionRowProps) => {
  return (
    <>
      <tr className="section-title">
        <td>{title}</td>
        <td></td>
        <td></td>
        <td></td>
        <td>
          <BsArrowUp onClick={() => handleMove(-1)} />
        </td>
        <td>
          <BsArrowDown onClick={() => handleMove(1)} />
        </td>
        <td>
          <BsFillTrashFill onClick={handleDelete} />
        </td>
      </tr>
    </>
  );
};

export { SongBookSectionTableRow as SongBookSectionRow };
