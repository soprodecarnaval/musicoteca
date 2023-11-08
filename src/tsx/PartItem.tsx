import { AiFillEye } from "react-icons/ai";
import { useState } from "react";
import { BsFillPauseCircleFill, BsPlayCircleFill } from "react-icons/bs";

import { PreviewModal } from "./PreviewModal";
import { Part } from "../types";

import "../css/PartItem.css";
import { Col, Row } from "react-bootstrap";

interface PartItemProps {
  part: Part;
  handlePlayingSong: (info: any) => void;
  songName: string;
  arrangementName: string; 
}

const PartItem = ({ part, handlePlayingSong, songName, arrangementName }: PartItemProps) => {
  const [showPreview, setShowPreview] = useState(false);

  const isSvg = part.assets[0].extension === '.svg'

  const handlePlay = () => {
    handlePlayingSong({ partName: part.name, songName, arrangementName });
    // @ts-ignore
    playSong(part.name, `collection/${part.assets[0].path .replace('svg', 'midi')}`, '')
  }

  const handleStop = () => {
    // @ts-ignore
    Player.stop();
  }

  return (isSvg &&
    <tr className="instrument cursor">
      <td colSpan={4}>
        <Row>
          <Col sm={4} onClick={() => setShowPreview(true)}>
            <AiFillEye className="visualize-icon" />
            <label>{part.instrument}</label>
          </Col>
          <Col sm={8} className="text-end">
            <BsPlayCircleFill className="play-icon-part" onClick={handlePlay} />
            <BsFillPauseCircleFill className="pause-icon-part" onClick={handleStop} />
          </Col>
        </Row>
      </td>
      <PreviewModal
        show={showPreview}
        handleShow={setShowPreview}
        part={part}
      />
    </tr>
  );
};

export { PartItem }
