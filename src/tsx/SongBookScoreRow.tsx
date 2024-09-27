import { useState } from "react";
import {
  BsTriangleFill,
  BsArrowDown,
  BsArrowUp,
  BsFillTrashFill,
} from "react-icons/bs";
import { SiMidi, SiMusescore } from "react-icons/si";

import type { Part, Score, PlayingPart } from "../../types";
import { PartItem } from "./PartItem";

import "../css/ScoreRow.css";

interface Props {
  handleDelete: (score: Score, checked: boolean) => void;
  handlePlayingSong: (score: PlayingPart) => void;
  handleMove: (steps: number) => void;
  score: Score;
}

const SongBookScoreRow = ({
  handleDelete,
  score,
  handlePlayingSong,
  handleMove,
}: Props) => {
  const [expand, setExpand] = useState(false);

  const onDelete = () => {
    handleDelete(score, false);
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
        <td onClick={() => setExpand(!expand)}>{score.title}</td>
        <td onClick={() => setExpand(!expand)}>{score.projectTitle}</td>
        <td onClick={() => setExpand(!expand)}>{score.tags}</td>
        <td>
          <BsArrowUp onClick={() => handleMove(-1)} />
        </td>
        <td>
          <BsArrowDown onClick={() => handleMove(1)} />
        </td>
        <td>
          <BsFillTrashFill onClick={onDelete} />
        </td>
        <td>
          {score.midi != "" && (
            <a href={`collection/${score.midi}`} target="_blank">
              <SiMidi />
            </a>
          )}
        </td>
        <td>
          {score.mscz && (
            <a href={`collection/${score.mscz}`} target="_blank">
              <SiMusescore />
            </a>
          )}
        </td>
      </tr>
      {expand &&
        score.parts.map((part: Part) => (
          <PartItem
            score={score}
            part={part}
            handlePlayingSong={handlePlayingSong}
            key={part.name}
          />
        ))}
    </>
  );
};

export { SongBookScoreRow };
