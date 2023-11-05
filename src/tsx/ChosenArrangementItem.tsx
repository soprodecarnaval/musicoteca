import { useState } from "react";
import { BsTriangleFill, BsFillTrashFill } from "react-icons/bs";

import type { Arrangement, HydratedSong } from "../types";
import { PartItem } from "./PartItem";

import "../css/ArrangementItem.css";

interface ArrangementItemProps {
  handleCheck: (song: HydratedSong, checked: boolean) => void;
  song: HydratedSong;
  arrangement: Arrangement;
}

const ChosenArrangementItem = ({
  handleCheck,
  song,
  arrangement,
}: ArrangementItemProps) => {
  const [expand, setExpand] = useState(false);

  const handleDelete = () => {
    handleCheck({ ...song, arrangements: [arrangement] }, false);
  }

  return (
    <>
      <tr className="cursor">
        <td className="action-cell">
          <BsTriangleFill
            onClick={() => setExpand(!expand)}
            className={`arrow ${expand ? "arrow-down" : "arrow-right"}`}
          />
        </td>
        <td onClick={() => setExpand(!expand)}>{song.title}</td>
        <td onClick={() => setExpand(!expand)}>{arrangement.name}</td>
        <td onClick={() => setExpand(!expand)}>{arrangement.tags}</td>
        <td><BsFillTrashFill onClick={handleDelete} /></td>
      </tr>
      {expand &&
        arrangement.parts.map((part) => (
          <PartItem part={part} key={part.name} />
        ))
      }
    </>
  );
};

export { ChosenArrangementItem };
