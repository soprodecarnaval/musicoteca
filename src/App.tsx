import { useState } from 'react'
import { SearchBar } from './SearchBar';

import "bootstrap/dist/css/bootstrap.css"; // Import precompiled Bootstrap css
import { Container, Navbar } from "react-bootstrap";

import './App.css'

function App() {
  return (
    <>
     <Navbar expand="lg" className="bg-body-tertiary" bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand className="nav-bar-title" href="#">Musicoteca</Navbar.Brand>
        </Container>
      </Navbar>
      <Container>
        <SearchBar />
      </Container>
    </>
  )
}

export default App
