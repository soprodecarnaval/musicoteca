import { useState } from 'react'
import { Col, Container, Navbar, Row } from "react-bootstrap";
import { SearchBar } from './SearchBar';
import { ArrangementsTable } from './ArrangementsTable';
import type { Song } from '../types';

import "bootstrap/dist/css/bootstrap.css";
import '../css/App.css'

function App() {
  const [results, setResults] = useState<Song[]>([]);
  const [checkedResults, setCheckedResults] = useState<Song[]>([]);

  const handleCheck = (song: Song, checked: boolean) => {
    if (checked) {
      setCheckedResults([...checkedResults, song])
      return
    } 

    const updatedRes = checkedResults.filter(r => r.arrangements[0].id !== song.arrangements[0].id)
    setCheckedResults(updatedRes)
  }

  return (
    <>
     <Navbar expand="lg" className="bg-body-tertiary" bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand className="nav-bar-title" href="#">
            Musicoteca
          </Navbar.Brand>
        </Container>
      </Navbar>
      <Container>
        <SearchBar handleResults={setResults} />
        <Row className="mt-4">
          <Col sm={6}>
            {(results.length > 0) &&
              <>
                <h3 className="results">Resultados</h3>
                <ArrangementsTable songs={results} handleCheck={handleCheck} readOnly={false} />
              </>
              }
          </Col>
          <Col sm={6}>
            {(results.length > 0) &&
              <>
                <h3 className="results">Resultados Selecionados</h3>
                <ArrangementsTable songs={checkedResults} handleCheck={handleCheck} readOnly={true} />
              </>
            }
          </Col>
        </Row>
        </Container>
    </>
  )
}

export default App
