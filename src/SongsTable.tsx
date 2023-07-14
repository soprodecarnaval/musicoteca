import { Table } from "react-bootstrap";

import type { Collection } from './types';

export const SongsTable = ({ songs } : Collection ) => {
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Título</th>
          <th>Compositor</th>
          <th>Arranjos</th>
        </tr>
      </thead>
      <tbody>
        {songs.map((song) => (
          <tr>
            <td>{song.title}</td>
            <td>{song.composer}</td>
            <td>{song.arrangements.map(a => a.name).join(", ")}</td>
          </tr>
        ))}
     </tbody>
    </Table>
  );
}

