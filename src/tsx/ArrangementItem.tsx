import { useState } from "react";
import { BsTriangleFill } from "react-icons/bs";

import type { Arrangement, PlayingSong, Song } from "../types";
import { PartItem } from "./PartItem";

import "../css/ArrangementItem.css";

interface ArrangementItemProps {
  handleSelect: (song: Song, checked: boolean) => void;
  handlePlayingSong: (song: PlayingSong) => void;
  song: Song;
  arrangement: Arrangement;
}

const ArrangementItem = ({
  handleSelect,
  song,
  arrangement,
  handlePlayingSong,
}: ArrangementItemProps) => {
  const [expand, setExpand] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleOnChange = () => {
    handleSelect({ ...song, arrangements: [arrangement] }, !checked);
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
          <PartItem
            part={part}
            handlePlayingSong={handlePlayingSong}
            songName={song.title}
            arrangementName={arrangement.name}
          />
        ))
      }
    </>
  );
};

export { ArrangementItem };
