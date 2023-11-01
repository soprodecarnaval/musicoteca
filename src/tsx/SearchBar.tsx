import { useState } from "react";

import { Row, Col, Form } from "react-bootstrap";

import collection from '../collection.json'
import { Song } from '../types';

interface SearchBarProps {
  handleResults: (results: Song[]) => void;
}

const SearchBar = ({ handleResults }: SearchBarProps) => {
  const [searchInput, setSearchInput] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setSearchInput(e.target.value);
  };

  const searchByArrangement = (searchData : string) => (
    collection.map((song : any) => {
      const foundArrs = song.arrangements.filter(
        (arr:any) => arr.name.toUpperCase().match(searchData.toUpperCase())
      )

      return { ...song, arrangements: foundArrs };
    });

  const searchByTitleOrComposer = (searchData : string) => (
    collection.filter((song:any) => (
      song.title.toUpperCase().match(searchData.toUpperCase()) ||
        song.composer.toUpperCase().match(searchData.toUpperCase())
    );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    if (searchInput.length === 0) {
      handleResults([]);
      return;
    }

    const songsByArrangement = searchByArrangement(
      searchInput
    ) as unknown as Song[];
    const songsByTitleOrComposer = searchByTitleOrComposer(
      searchInput
    ) as unknown as Song[];

    handleResults([...songsByTitleOrComposer, ...songsByArrangement]);
  };

  return (
    <Row className="mt-4">
      <Col sm={6}>
        <Form className="d-flex">
          <Form.Control
            type="search"
            placeholder="Procurar por título, compositor ou arranjos"
            className="me-2"
            aria-label="Search"
            onKeyDown={handleKeyDown}
            value={searchInput}
            onChange={handleChange}
          />
        </Form>
      </Col>
    </Row>
  );
};

export { SearchBar };
