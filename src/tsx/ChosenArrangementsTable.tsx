import { Table } from "react-bootstrap";

import type { HydratedSong } from "../types";

import { ChosenArrangementItem } from "./ChosenArrangementItem";

interface ArrangementsTableProps {
  songs: HydratedSong[];
  handleCheck: (song: HydratedSong, checked: boolean) => void;
}

const ChosenArrangementsTable = ({
  songs,
  handleCheck,
}: ArrangementsTableProps) => {
  return (
    <Table striped borderless hover>
      <thead>
        <tr>
          <th></th>
          <th>Título</th>
          <th>Arranjo</th>
          <th>Tags</th>
        </tr>
      </thead>
      <tbody>
        {songs.map((song, songIdx) =>
          song.arrangements.map((arrangement) => (
            <ChosenArrangementItem
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

export { ChosenArrangementsTable };
