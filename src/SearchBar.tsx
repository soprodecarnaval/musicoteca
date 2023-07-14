import { useState, useEffect } from 'react'

import { Row, Col, Form } from "react-bootstrap";

import collection from '../collection.json'

const SearchBar = ({ handleResults }) => {
  const [searchInput, setSearchInput] = useState("");

  const handleChange = (e : any) => {
    e.preventDefault();
    setSearchInput(e.target.value);
  };

  const handleKeyDown = (e : any) => {
    if (e.key !== 'Enter') return
    e.preventDefault();

    if (searchInput.length === 0) {
      handleResults([]);
      return
    }

    const res = collection.songs.filter((song) => {
      return song.title.match(searchInput) || song.composer.match(searchInput) ||
               song.arrangements.filter((a) => a.name.match(searchInput)).length > 0
    });
    handleResults(res);
  }
 
  return (
    <Row className="mt-4">
      <Col sm={6}>
        <Form className="d-flex">
          <Form.Control
            type="search"
            placeholder="Procurar por título, compositor, arranjos, partes..."
            className="me-2"
            aria-label="Search"
            onKeyDown={handleKeyDown}
            value={searchInput}
            onChange={handleChange}
          />
        </Form>
      </Col>
    </Row>
  )
}

export { SearchBar }
