import { useState } from "react";
import { BsTriangleFill } from "react-icons/bs";

import type { PlayingSong, SongArrangement } from "../../types";
import { PartItem } from "./PartItem";

import "../css/ArrangementItem.css";
import { SiMidi, SiMusescore } from "react-icons/si";

interface ArrangementItemProps {
  handleSelect: (songArrnagement: SongArrangement, checked: boolean) => void;
  handlePlayingSong: (song: PlayingSong) => void;
  songArrangement: SongArrangement;
}

const ArrangementItem = ({
  handleSelect,
  songArrangement,
  handlePlayingSong,
}: ArrangementItemProps) => {
  const [expand, setExpand] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleOnChange = () => {
    handleSelect(songArrangement, !checked);
    setChecked(!checked);
  };

  const { song, arrangement } = songArrangement;

  const arrangementMidiAsset = arrangement.assets.find(
    (asset) => asset.extension == ".midi"
  );
  const arrangementMsczAsset = arrangement.assets.find(
    (asset) => asset.extension == ".mscz"
  );

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
        <td>
          {arrangementMidiAsset && (
            <a href={`collection/${arrangementMidiAsset.path}`} target="_blank">
              <SiMidi />
            </a>
          )}
        </td>
        <td>
          {arrangementMsczAsset && (
            <a href={`collection/${arrangementMsczAsset.path}`} target="_blank">
              <SiMusescore />
            </a>
          )}
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

export { ArrangementItem };
