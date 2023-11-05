import { useState } from "react";
import { BsTriangleFill } from "react-icons/bs";

import type { Arrangement, HydratedSong } from "../types";
import { PartItem } from "./PartItem";

import "../css/ArrangementItem.css";

interface ArrangementItemProps {
  handleCheck: (song: HydratedSong, checked: boolean) => void;
  song: HydratedSong;
  arrangement: Arrangement;
}

const ArrangementItem = ({
  handleCheck,
  song,
  arrangement,
}: ArrangementItemProps) => {
  const [expand, setExpand] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleOnChange = () => {
    handleCheck({ ...song, arrangements: [arrangement] }, !checked);
    setChecked(!checked);
  };

  return (
    <>
      <tr className="cursor">
        <td className="action-cell">
          <BsTriangleFill
            onClick={() => setExpand(!expand)}
            className={`arrow ${expand ? "arrow-down" : "arrow-right"}`}
          />
        </td>
        <td onClick={handleOnChange}>{song.title}</td>
        <td onClick={handleOnChange}>{arrangement.name}</td>
        <td onClick={handleOnChange}>{arrangement.tags}</td>
      </tr>
      {expand &&
        arrangement.parts.map((part) => (
          <PartItem part={part} key={part.name} />
        ))
      }
    </>
  );
};

export { ArrangementItem };
