import { useState } from "react";
import { BsTriangleFill, BsFillTrashFill, BsFillPauseCircleFill, BsPlayCircleFill } from "react-icons/bs";

import type { Arrangement, HydratedSong } from "../types";
import { PartItem } from "./PartItem";

import "../css/ArrangementItem.css";

const url = "/documents/A BANDA TÁ COM SEDE/CARNAVAL BH 2023 - A BANDA TÁ COM SEDE /media/A_BANDA_TA_COM_SEDE.midi"

interface ArrangementItemProps {
  handleSelect: (song: HydratedSong, checked: boolean) => void;
  handlePlayingSong: (song: HydratedSong) => void;
  song: HydratedSong;
  arrangement: Arrangement;
}

const ChosenArrangementItem = ({
  handleSelect,
  song,
  arrangement,
  handlePlayingSong,
}: ArrangementItemProps) => {
  const [expand, setExpand] = useState(false);

  const handleDelete = () => {
    handleSelect({ ...song, arrangements: [arrangement] }, false);
  }

  const handlePlay = () => {
    handlePlayingSong({ ...song, arrangements: [arrangement] });
    // @ts-ignore
    playSong(url)
  }

  const handleStop = () => {
    // @ts-ignore
    Player.stop();
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
        <td><BsPlayCircleFill onClick={handlePlay} /></td>
        <td><BsFillPauseCircleFill onClick={handleStop} /></td>
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
