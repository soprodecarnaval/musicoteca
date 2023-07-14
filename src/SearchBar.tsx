import { useState, useEffect } from 'react'

import { Row, Col, Form } from "react-bootstrap";

import collection from '../collection.json'

const SearchBar = ({ handleResults }) => {
  const [searchInput, setSearchInput] = useState("");

  const handleChange = (e : any) => {
    e.preventDefault();
    setSearchInput(e.target.value);
  };

  useEffect(() => {
    if (searchInput.length > 0) {
      const res = collection.songs.filter((song) => {
        return song.title.match(searchInput) || song.composer.match(searchInput)
      });
      handleResults(res);
    } else if (searchInput.length === 0) {
      handleResults([]);
    }
  }, [searchInput])
 
return (
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
  )
}

export { SearchBar }
