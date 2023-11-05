import { useState } from "react";
import { Col, Container, Navbar, Row } from "react-bootstrap";
import { SearchBar } from "./SearchBar";
import { ArrangementsTable } from "./ArrangementsTable";
import { PDFGenerator } from "./PdfGenerator";
import type { HydratedSong } from "../types";

import "bootstrap/dist/css/bootstrap.css";
import "../css/App.css";
import { ChosenArrangementsTable } from "./ChosenArrangementsTable";

function App() {
  const [results, setResults] = useState<HydratedSong[]>([]);
  const [checkedResults, setCheckedResults] = useState<HydratedSong[]>([]);

  const handleCheck = (song: HydratedSong, checked: boolean) => {
    checked ? handleAdd(song) : handleRemove(song)
  };

  const handleAdd = (song: HydratedSong) => {
    setCheckedResults([...checkedResults, song]);
    const updatedRes = results.filter(
      (r) => r.arrangements[0].id !== song.arrangements[0].id
    );

    setResults(updatedRes);
  }

  const handleRemove = (song: HydratedSong) => {
    const updatedRes = checkedResults.filter(
      (r) => r.arrangements[0].id !== song.arrangements[0].id
    );
    setResults([ song, ...results]);
    setCheckedResults(updatedRes);
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
            Musicoteca
          </Navbar.Brand>
        </Container>
      </Navbar>
      <Container>
        <SearchBar handleResults={setResults} />
        <PDFGenerator songs={checkedResults}></PDFGenerator>
        <Row className="mt-4">
          <Col sm={6}>
            {results.length > 0 && (
              <>
                <h3 className="results">Resultados</h3>
                <ArrangementsTable
                  songs={results}
                  handleCheck={handleCheck}
                />
              </>
            )}
          </Col>
          <Col sm={6}>
            {checkedResults.length > 0 && (
              <>
                <h3 className="results">Resultados Selecionados</h3>
                <ChosenArrangementsTable
                  songs={checkedResults}
                  handleCheck={handleCheck}
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
