import { useEffect, useState } from "react";
import { BsTriangleFill, BsFillPauseCircleFill, BsPlayCircleFill } from "react-icons/bs";

import type { Arrangement, HydratedSong } from "../types";
import { PartItem } from "./PartItem";

import "../css/ArrangementItem.css";

interface ArrangementItemProps {
  handleSelect: (song: HydratedSong, checked: boolean) => void;
  handlePlayingSong: (song: HydratedSong) => void;
  song: HydratedSong;
  arrangement: Arrangement;
}

const url = "/documents/A BANDA TÁ COM SEDE/CARNAVAL BH 2023 - A BANDA TÁ COM SEDE /media/A_BANDA_TA_COM_SEDE.midi"

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
        <td onClick={handleOnChange}>{song.title}</td>
        <td onClick={handleOnChange}>{arrangement.name}</td>
        <td onClick={handleOnChange}>{arrangement.tags}</td>
        <td><BsPlayCircleFill onClick={handlePlay} /></td>
        <td><BsFillPauseCircleFill onClick={handleStop} /></td>
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
