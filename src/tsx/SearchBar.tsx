import { useState } from "react";
import { Row, Col, Form } from "react-bootstrap";

import { Song } from "../types";
import collection from "../collection";

import Fuse from "fuse.js";

interface SearchBarProps {
  handleResults: (results: Song[]) => void;
}

// index collection using Fuse.js

// TODO: move index creation to build step
const songIndex = Fuse.createIndex(
  ["title", "composer", "arrangements.name", "arrangements.tags"],
  collection.songs
);

const fuse = new Fuse(
  collection.songs,
  {
    keys: ["title", "composer", "arrangements.name", "arrangements.tags"],
    includeScore: true,
    shouldSort: true,
    threshold: 0.1,
  },
  songIndex
);

const SearchBar = ({ handleResults }: SearchBarProps) => {
  const [searchInput, setSearchInput] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setSearchInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      return;
    }

    if (searchInput === "") {
      handleResults([]);
      return;
    }

    const searchResult = fuse.search(searchInput);
    const results = searchResult
      .map((result) =>
        result.item.arrangements.map((arrangement) => ({
          ...result.item,
          arrangements: [arrangement],
        }))
      )
      .flat();

    handleResults(results);
  };

  return (
    <Row className="mt-4">
      <Col sm={6}>
        <Form className="d-flex">
          <Form.Control
            type="search"
            placeholder="Procurar por título, arranjo ou tags"
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
