import { useState } from "react";
import { BsTriangleFill } from "react-icons/bs";
import { AiFillEye } from "react-icons/ai";

import type { Part, Arrangement, HydratedSong } from "../types";

import { PreviewModal } from "./PreviewModal";

import "../css/ArrangementItem.css";

interface ArrangementItemProps {
  handleCheck: (song: HydratedSong, checked: boolean) => void;
  song: HydratedSong;
  arrangement: Arrangement;
}

interface PartItemProps {
  part: Part;
}

const PartItem = ({ part }: PartItemProps) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <tr className="instrument">
      <td onClick={() => setShowPreview(true)} colSpan={4}>
        <AiFillEye className="visualize-icon" />
        <label>{part.instrument}</label>
      </td>
      <PreviewModal
        show={showPreview}
        handleShow={setShowPreview}
        part={part}
      />
    </tr>
  );
};

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
      <tr>
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
      {expand ? (
        arrangement.parts.map((part) => (
          <PartItem part={part} key={part.name} />
        ))
      ) : (
        <></>
      )}
    </>
  );
};

export { ArrangementItem };
