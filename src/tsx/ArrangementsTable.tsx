import { Table } from "react-bootstrap";

import type { HydratedSong } from "../types";

import { ArrangementItem } from "./ArrangementItem";

interface ArrangementsTableProps {
  songs: HydratedSong[];
  readOnly: boolean;
  handleCheck: (song: HydratedSong, checked: boolean) => void;
}

const ArrangementsTable = ({
  songs,
  readOnly,
  handleCheck,
}: ArrangementsTableProps) => {
  return (
    <Table striped borderless hover>
      <thead>
        <tr>
          <th></th>
          <th>Título</th>
          <th>Compositor</th>
          <th>Arranjo</th>
          <th>Tags</th>
        </tr>
      </thead>
      <tbody>
        {songs.map((song, songIdx) =>
          song.arrangements.map((arrangement) => (
            <ArrangementItem
              readOnly={readOnly}
              handleCheck={handleCheck}
              arrangement={arrangement}
              song={songs[songIdx]}
              key={arrangement.name}
            />
          ))
        )}
      </tbody>
    </Table>
  );
};

export { ArrangementsTable };
