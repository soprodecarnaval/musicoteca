import { useState } from "react";
import { Row, Col, Form } from "react-bootstrap";

import { Score } from "../../types";
import collection from "../collection";

import Fuse from "fuse.js";
import dropDiacritics from "../utils/dropDiacritics";

interface SearchBarProps {
  handleResults: (results: Score[]) => void;
}

const allScores = collection.projects.flatMap((project) => {
  return project.scores;
});

const searchKeys = ["title", "composer", "tags", "projectTitle"];

// TODO: move index creation to build step
const scoreSearchIndex = Fuse.createIndex(searchKeys, allScores);
Fuse.config.getFn = (obj, path) => {
  var value = Fuse.config.getFn(obj, path);
  if (Array.isArray(value)) {
    return value.map((el) => dropDiacritics(el));
  } else if (typeof value === "string") {
    return dropDiacritics(value);
  }
  return value;
};

const fuse = new Fuse(
  allScores,
  {
    keys: searchKeys,
    includeScore: true,
    shouldSort: true,
    threshold: 0.1,
    useExtendedSearch: true,
  },
  scoreSearchIndex
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
    const results = searchResult.map((result) => result.item);

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
      <small>
        Para busca exata, use aspas e chapéuzinho (ex: "^carnaval bh 2024")
      </small>
    </Row>
  );
};

export { SearchBar };
