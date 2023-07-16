import { useState } from "react";
import { Form } from "react-bootstrap";
import { BsTriangleFill } from 'react-icons/bs';
import { AiFillEye } from 'react-icons/ai';

import type { Part, Arrangement, Song } from '../types';

import { PreviewModal } from "./PreviewModal";

import '../css/ArrangementItem.css'

interface ArrangementItemProps {
  handleCheck: (song: Song, checked: boolean) => void
  song: Song
  arrangement: Arrangement
  readOnly: boolean
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

const ArrangementItem = ({ handleCheck, readOnly, song, arrangement } : ArrangementItemProps) => {
  const [expand, setExpand] = useState(false);
  const [checked, setChecked] = useState(false);
  
  const handleOnChange = () => {
    handleCheck({ ...song, arrangements: [arrangement] }, !checked)
    setChecked(!checked)
  }

  return (
    <>
      <tr>
        <td className="action-cell">
          <BsTriangleFill
            onClick={() => setExpand(!expand)}
            className={`arrow ${expand ? "arrow-down" : "arrow-right" }`}
          />
          {!readOnly &&
            <Form.Check
              checked={checked}
              onChange={handleOnChange}
              className="arrangement-checkbox"
              type="checkbox"
              id="default-checkbox"
            />
          }
        </td>
        <td>{song.title}</td>
        <td>{song.composer}</td>
        <td>{arrangement.name}</td>
      </tr>
      {expand ? arrangement.parts.map(part => <PartItem part={part} />) : <></>}
    </>
  )
}

export { ArrangementItem }
