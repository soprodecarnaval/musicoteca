import { AiFillEye } from "react-icons/ai";
import { useState } from "react";

import { PreviewModal } from "./PreviewModal";
import { Part } from "../types";

import "../css/PartItem.css";

interface PartItemProps {
  part: Part;
}

const PartItem = ({ part }: PartItemProps) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <tr className="instrument cursor">
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

export { PartItem }
