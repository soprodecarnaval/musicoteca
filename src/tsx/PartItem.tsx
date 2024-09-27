import { AiFillEye } from "react-icons/ai";
import { useState } from "react";
import { BsFillPauseCircleFill, BsPlayCircleFill } from "react-icons/bs";

import { PreviewModal } from "./PreviewModal";
import { Part, PlayingPart, Score } from "../../types";

import "../css/PartItem.css";
import { Col, Row } from "react-bootstrap";
import { SiMidi } from "react-icons/si";
import { midiPlayer, playMidiPart } from "../utils/playMidi";

interface PartItemProps {
  score: Score;
  part: Part;
  handlePlayingSong: (info: PlayingPart) => void;
}

const PartItem = ({ score, part, handlePlayingSong }: PartItemProps) => {
  const [showPreview, setShowPreview] = useState(false);

  const hasSvg = part.svg != "";

  const handlePlay = async () => {
    handlePlayingSong({ score, part });
    await playMidiPart(`collection/${part.midi}`, part.instrument);
  };

  const handleStop = () => {
    midiPlayer?.stop();
  };

  return (
    hasSvg && (
      <tr className="instrument cursor">
        <td colSpan={4}>
          <Row>
            <Col sm={4} onClick={() => setShowPreview(true)}>
              <AiFillEye className="visualize-icon" />
              <label>{part.instrument}</label>
            </Col>
            <Col sm={8} className="text-end">
              <BsPlayCircleFill
                className="play-icon-part"
                onClick={handlePlay}
              />
              <BsFillPauseCircleFill
                className="pause-icon-part"
                onClick={handleStop}
              />
              {part.midi != "" && (
                <a href={`collection/${part.midi}`} target="_blank">
                  <SiMidi />
                </a>
              )}
            </Col>
          </Row>
        </td>
        <PreviewModal
          show={showPreview}
          handleShow={setShowPreview}
          part={part}
        />
      </tr>
    )
  );
};

export { PartItem };
