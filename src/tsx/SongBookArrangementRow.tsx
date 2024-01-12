import { useState } from "react";
import {
  BsTriangleFill,
  BsArrowDown,
  BsArrowUp,
  BsFillTrashFill,
} from "react-icons/bs";

import type { PlayingSong, SongArrangement } from "../types";
import { PartItem } from "./PartItem";

import "../css/ArrangementItem.css";

interface SongBookArrangementRowProps {
  handleDelete: (song: SongArrangement, checked: boolean) => void;
  handlePlayingSong: (song: PlayingSong) => void;
  handleMove: (steps: number) => void;
  songArrangement: SongArrangement;
}

const SongBookArrangementRow = ({
  handleDelete,
  songArrangement: { song, arrangement },
  handlePlayingSong,
  handleMove,
}: SongBookArrangementRowProps) => {
  const [expand, setExpand] = useState(false);

  const onDelete = () => {
    handleDelete({ song, arrangement }, false);
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
          <BsArrowUp onClick={() => handleMove(-1)} />
        </td>
        <td>
          <BsArrowDown onClick={() => handleMove(1)} />
        </td>
        <td>
          <BsFillTrashFill onClick={onDelete} />
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

export { SongBookArrangementRow };
