import { useState } from "react";
import { BsTriangleFill, BsFillTrashFill } from "react-icons/bs";

import type { PlayingSong, SongArrangement } from "../types";
import { PartItem } from "./PartItem";

import "../css/ArrangementItem.css";

interface ArrangementItemProps {
  handleSelect: (song: SongArrangement, checked: boolean) => void;
  handlePlayingSong: (song: PlayingSong) => void;
  songArrangement: SongArrangement;
}

const ChosenArrangementItem = ({
  handleSelect,
  songArrangement: { song, arrangement },
  handlePlayingSong,
}: ArrangementItemProps) => {
  const [expand, setExpand] = useState(false);

  const handleDelete = () => {
    handleSelect({ song, arrangement }, false);
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
        <td onClick={() => setExpand(!expand)}>{song.title}</td>
        <td onClick={() => setExpand(!expand)}>{arrangement.name}</td>
        <td onClick={() => setExpand(!expand)}>{arrangement.tags}</td>
        <td>
          <BsFillTrashFill onClick={handleDelete} />
        </td>
      </tr>
      {expand &&
        arrangement.parts.map((part) => (
          <PartItem
            part={part}
            handlePlayingSong={handlePlayingSong}
            songName={song.title}
            arrangementName={arrangement.name}
          />
        ))}
    </>
  );
};

export { ChosenArrangementItem };
