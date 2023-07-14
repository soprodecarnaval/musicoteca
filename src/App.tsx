import { useState } from 'react'
import { Col, Container, Navbar, Row } from "react-bootstrap";
import { SearchBar } from './SearchBar';
import { SongsTable } from './SongsTable';
import type { Song } from './types';

import "bootstrap/dist/css/bootstrap.css";
import './App.css'

function App() {
  const [results, setResults] = useState<Song[]>([]);

  return (
    <>
     <Navbar expand="lg" className="bg-body-tertiary" bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand className="nav-bar-title" href="#">Musicoteca</Navbar.Brand>
        </Container>
      </Navbar>
      <Container>
        <SearchBar handleResults={setResults} />
        <Row className="mt-4">
          <Col sm={6}>
            {results.length > 0 ? <SongsTable songs={results} /> : <></>}
          </Col>
          <Col sm={6}>
          </Col>
        </Row>
        </Container>
    </>
  )
}

export default App
