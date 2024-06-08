import { BsArrowDown, BsArrowUp, BsFillTrashFill } from "react-icons/bs";

import "../css/ArrangementItem.css";

interface SongBookSectionRowProps {
  handleDelete: () => void;
  title: string;
}

const SongBookSectionRow = ({
  handleDelete,
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
          <BsFillTrashFill onClick={handleDelete} />
        </td>
      </tr>
    </>
  );
};

export { SongBookSectionRow };
