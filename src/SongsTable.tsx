import { Table, Form } from "react-bootstrap";
import { BsTriangleFill } from 'react-icons/bs';

import type { Collection, Part } from './types';
import { useState } from "react";

const Arrangement = ({ songTitle, songComposer, arrangement }) => {
  const [expand, setExpand] = useState(false);
  const [checked, setChecked] = useState(false);

  const partItem = (part : Part) => {
    const label = part.instrument;
    return (
      <tr key={label} className="instrument">
        <td colSpan={4}>
          <Form.Check
            type="checkbox"
            id="default-checkbox"
            label={label}
          />
        </td>
      </tr>
    )
  }

  return (
    <>
      <tr key={Math.random()}>
        <td style={{ paddingRight: 0 }}>
          <BsTriangleFill
            onClick={() => setExpand(!expand)}
            style={{
              transition: "all 0.5s ease",
              transform: `rotate(${expand ? "0.5turn" : "0.25turn"})`
            }}
          />
          <Form.Check
            checked={checked}
            onClick={() => setChecked(!checked)}
            style={{ display: 'inline', marginLeft: '0.7em' }}
            type="checkbox"
            id="default-checkbox"
          />
        </td>
        <td>{songTitle}</td>
        <td>{songComposer}</td>
        <td>{arrangement.name}</td>
      </tr>
      {expand ? arrangement.parts.map(part => partItem(part)) : <></>}
    </>
  )
}

export const SongsTable = ({ songs } : Collection ) => {
  return (
    <Table striped borderless hover>
      <thead>
        <tr>
          <th style={{ paddingRight: 0 }}></th>
          <th>Título</th>
          <th>Compositor</th>
          <th>Arranjo</th>
        </tr>
      </thead>
      <tbody>
        {songs.map((song, songIdx) => (
          song.arrangements.map(arrangement => (
            <Arrangement
              arrangement={arrangement}
              songTitle={songs[songIdx].title}
              songComposer={songs[songIdx].composer}
            />
          ))
        ))}
     </tbody>
    </Table>
  );
}
