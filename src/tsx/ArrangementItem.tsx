import { useState } from "react";
import { Form } from "react-bootstrap";
import { BsTriangleFill } from 'react-icons/bs';
import { AiFillEye } from 'react-icons/ai';

import type { Part, Arrangement } from '../types';

import { PreviewModal } from "./PreviewModal";

import '../css/ArrangementItem.css'

interface ArrangementItemProps {
    id: number,
    songTitle: string
    songComposer: string
    arrangement: Arrangement
}

interface PartItemProps {
  part: Part
}

const PartItem = ({ part } : PartItemProps) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
  <tr className="instrument">
    <td onClick={() => setShowPreview(true)} colSpan={4}>
      <AiFillEye className="visualize-icon" />
      <label>{part.instrument}</label>
    </td>
    <PreviewModal show={showPreview} handleShow={setShowPreview} part={part} />
  </tr>
  )
}

const ArrangementItem = ({ id, songTitle, songComposer, arrangement } : ArrangementItemProps) => {
  const [expand, setExpand] = useState(false);
  const [checked, setChecked] = useState(false);

  return (
    <>
      <tr key={id}>
        <td className="action-cell">
          <BsTriangleFill
            onClick={() => setExpand(!expand)}
            className={`arrow ${expand ? "arrow-down" : "arrow-right" }`}
          />
          <Form.Check
            checked={checked}
            onChange={() => setChecked(!checked)}
            className="arrangement-checkbox"
            type="checkbox"
            id="default-checkbox"
          />
        </td>
        <td>{songTitle}</td>
        <td>{songComposer}</td>
        <td>{arrangement.name}</td>
      </tr>
      {expand ? arrangement.parts.map(part => <PartItem part={part} />) : <></>}
    </>
  )
}

export { ArrangementItem }
