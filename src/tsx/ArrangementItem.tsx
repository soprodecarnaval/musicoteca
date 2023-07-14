import { useState } from "react";
import { Form } from "react-bootstrap";
import { BsTriangleFill } from 'react-icons/bs';
import { AiFillEye } from 'react-icons/ai';

import type { Part, Arrangement } from '../types';

import { PreviewModal } from "./PreviewModal";

import '../css/ArrangementItem.css'

interface ArrangementProps {
    songTitle: string
    songComposer: string
    arrangement: Arrangement
}

const ArrangementItem = ({ songTitle, songComposer, arrangement } : ArrangementProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [expand, setExpand] = useState(false);
  const [checked, setChecked] = useState(false);

  const partItem = (part : Part, idx : number) => (
    <tr key={idx} className="instrument">
      <td onClick={() => setShowPreview(true)} colSpan={4}>
        <AiFillEye className="visualize-icon" />
        <label>{part.instrument}</label>
      </td>
      <PreviewModal show={showPreview} handleShow={setShowPreview} part={part} />
    </tr>
  )

  return (
    <>
      <tr key={Math.random()}>
        <td className="action-cell">
          <BsTriangleFill
            onClick={() => setExpand(!expand)}
            className={`arrow ${expand ? "arrow-down" : "arrow-right" }`}
          />
          <Form.Check
            checked={checked}
            onClick={() => setChecked(!checked)}
            className="arrangement-checkbox"
            type="checkbox"
            id="default-checkbox"
          />
        </td>
        <td>{songTitle}</td>
        <td>{songComposer}</td>
        <td>{arrangement.name}</td>
      </tr>
      {expand ? arrangement.parts.map((part, idx) => partItem(part, idx)) : <></>}
    </>
  )
}

export { ArrangementItem }
