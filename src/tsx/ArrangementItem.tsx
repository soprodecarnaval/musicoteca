import { Form } from "react-bootstrap";
import { BsTriangleFill } from 'react-icons/bs';

import type { Part, Arrangement } from '../types';
import { useState } from "react";

import '../css/ArrangementItem.css'

interface ArrangementProps {
    songTitle: string
    songComposer: string
    arrangement: Arrangement
}

const ArrangementItem = ({ songTitle, songComposer, arrangement } : ArrangementProps) => {
  const [expand, setExpand] = useState(false);
  const [checked, setChecked] = useState(false);

  const partItem = (part : Part, idx : number) => (
    <tr key={idx} className="instrument">
      <td colSpan={4}>
        <Form.Check
          className="instrument-checkbox"
          type="checkbox"
          id="default-checkbox"
          label={part.instrument}
        />
      </td>
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
