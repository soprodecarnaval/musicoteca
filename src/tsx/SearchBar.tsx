import { useState } from "react";

import { Row, Col, Form } from "react-bootstrap";

import collection from "../collection.json";
import { HydratedSong } from "../types";

import Fuse from "fuse.js";
import { ArrangementItem } from "./ArrangementItem";

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
  ["title", "composer", "arrangements.name",  "arrangements.tags"],
  hydratedSongs
);

const fuse = new Fuse(
  hydratedSongs,
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
      return
    }

    if (searchInput === '') {
      handleResults([]);
      return
    }

    const searchResult = fuse.search(searchInput);
    const results = searchResult.map(result => result.item.arrangements.map(
      arrangement => ({ ...result.item, arrangements: [arrangement] })
    )).flat();

    handleResults(results);
  };

  return (
    <Row className="mt-4">
      <Col sm={6}>
        <Form className="d-flex">
          <Form.Control
            type="search"
            placeholder="Procurar por título ou arranjos"
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
