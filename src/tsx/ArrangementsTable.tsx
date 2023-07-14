import { Table } from "react-bootstrap";

import type { Collection } from '../types';

import { ArrangementItem } from "./ArrangementItem";

const ArrangementsTable = ({ songs } : Collection ) => {
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
          song.arrangements.map(arrangement => (
            <ArrangementItem
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

export { ArrangementsTable }
