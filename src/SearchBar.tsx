import { useState, useEffect } from 'react'

import { Table, Row, Col, Form } from "react-bootstrap";

import collection from '../collection.json'

interface Collection {
  songs: Song[]
}

interface Song {
  title: string
  composer: string
  sub: string
  tags: string[]
  arrangements: Arrangement[]
}

interface Arrangement {
  source: { url: string, type: string }
  name: string
  parts: Part[]
}

interface Part {
  instrument: string
  files: { url: string, type: "png" | "svg" }[]
}

const Songs = ({ songs } : Collection ) => {
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

const SearchBar = () => {
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState<Song[]>([]);

  const handleChange = (e : any) => {
    e.preventDefault();
    setSearchInput(e.target.value);
  };

  useEffect(() => {
    if (searchInput.length > 0) {
      const res = collection.songs.filter((song) => {
        return song.title.match(searchInput) || song.composer.match(searchInput)
      }) as Song[];
      console.log(res)
      setResults(res);
    } else if (searchInput.length === 0) {
      setResults([]);
    }
  }, [searchInput])
 

return (
    <>
      <Row className="mt-4">
        <Col sm={6}>
          <Form className="d-flex">
            <Form.Control
              type="search"
              placeholder="Procurar por título, compositor, partes..."
              className="me-2"
              aria-label="Search"
              value={searchInput}
              onChange={handleChange}
            />
          </Form>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col sm={6}>
          {results.length > 0 ? <Songs songs={results} /> : <></>}
        </Col>
        <Col sm={6}>
        </Col>
      </Row>
    </>
  )
}

export { SearchBar }
