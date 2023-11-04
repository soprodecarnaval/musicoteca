import { useState } from "react";

import { Row, Col, Form } from "react-bootstrap";

import collection from "../collection.json";
import { HydratedSong } from "../types";

import Fuse from "fuse.js";

interface SearchBarProps {
  handleResults: (results: HydratedSong[]) => void;
}

// index collection using Fuse.js
const hydratedSongs: HydratedSong[] = Object.values(collection.songs).map(
  (song) => ({
    ...song,
    arrangements: song.arrangementIds.map((arrangementId) => ({
      ...(collection.arrangements as any)[arrangementId],
    })),
  })
);

// TODO: move index creation to build step
const songIndex = Fuse.createIndex(
  ["title", "composer", "arrangements.name"],
  hydratedSongs
);

const fuse = new Fuse(
  hydratedSongs,
  {
    keys: ["title", "composer", "arrangements.name"],
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
    if (e.key !== "Enter") return;
    e.preventDefault();

    if (searchInput.length === 0) {
      handleResults([]);
      return;
    }

    const searchResult = fuse.search(searchInput);
    handleResults(searchResult.map((result) => result.item));
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
