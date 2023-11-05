import { useState } from "react";
import { Col, Container, Navbar, Row } from "react-bootstrap";

import { Sort } from "./Sort";
import { SearchBar } from "./SearchBar";
import { ArrangementsTable } from "./ArrangementsTable";
import { ChosenArrangementsTable } from "./ChosenArrangementsTable";
import { PDFGenerator } from "./PdfGenerator";
import { sortByColumn } from "./helper/sorter";

import type { HydratedSong } from "../types";

import "bootstrap/dist/css/bootstrap.css";
import "../css/App.css";

function App() {
  const [results, setResults] = useState<HydratedSong[]>([]);
  const [selectedResults, setSelectedResults] = useState<HydratedSong[]>([]);

  const handleSelectSong = (song: HydratedSong, checked: boolean) => {
    checked ? handleAddSong(song) : handleRemoveSong(song)
  };

  const clearSelected = () => {
    setSelectedResults([]);
  }

  const handleAddSong = (song: HydratedSong) => {
    setSelectedResults([...selectedResults, song]);
    const updatedRes = results.filter(
      (r) => r.arrangements[0].id !== song.arrangements[0].id
    );

    setResults(updatedRes);
  }

  const handleRemoveSong = (song: HydratedSong) => {
    const updatedRes = selectedResults.filter(
      (r) => r.arrangements[0].id !== song.arrangements[0].id
    );
    setResults([ song, ...results]);
    setSelectedResults(updatedRes);
  }

  const handleSelectedResultsSortBy = (column : string, direction: string) => {
    const sorted = sortByColumn(selectedResults, column, direction)
    setSelectedResults(sorted.slice())
  }

  const handleResultsSortBy = (column: string, direction: string) => {
    const sorted = sortByColumn(results, column, direction)
    setResults(sorted.slice())
  }

  return (
    <>
      <Navbar
        expand="lg"
        className="bg-body-tertiary"
        bg="dark"
        data-bs-theme="dark"
      >
        <Container>
          <Navbar.Brand className="nav-bar-title" href="#">
            Cadern.in
          </Navbar.Brand>
        </Container>
      </Navbar>
      <Container>
        <SearchBar handleResults={setResults} />
        <PDFGenerator songs={selectedResults}></PDFGenerator>
        <Row className="mt-4">
          <Col sm={6}>
            {results.length > 0 && (
              <>
                <h3 className="results">Resultados</h3>
                <Sort onSortBy={handleResultsSortBy} />
                <ArrangementsTable
                  songs={results}
                  handleSelect={handleSelectSong}
                />
              </>
            )}
          </Col>
          <Col sm={6}>
            {(selectedResults.length > 0 || results.length > 0) && (
              <>
                <h3 className="results">Resultados selecionados</h3>
                <Sort onSortBy={handleSelectedResultsSortBy} />
                <ChosenArrangementsTable
                  songs={selectedResults}
                  handleSelect={handleSelectSong}
                  handleClear={clearSelected}
                />
              </>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
