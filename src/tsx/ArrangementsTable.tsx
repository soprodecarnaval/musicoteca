import { Table } from "react-bootstrap";

import type { Song } from '../types';

import { ArrangementItem } from "./ArrangementItem";

interface ArrangementsTableProps {
  songs: Song[] 
  readOnly: boolean
  handleCheck: (song: Song, checked: boolean) => void
}

const ArrangementsTable = ({ songs, readOnly, handleCheck } : ArrangementsTableProps ) => {
  return (
    <Table striped borderless hover>
      <thead>
        <tr>
          <th></th>
          <th>Título</th>
          <th>Compositor</th>
          <th>Arranjo</th>
        </tr>
      </thead>
      <tbody>
        {songs.map((song, songIdx) => (
          song.arrangements.map((arrangement) => (
            <ArrangementItem
              readOnly={readOnly}
              handleCheck={handleCheck}
              arrangement={arrangement}
              song={songs[songIdx]}
            />
          ))
        ))}
     </tbody>
    </Table>
  );
}

export { ArrangementsTable }
