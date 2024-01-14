import { useState } from "react";
import { Col, Container, Navbar, Row } from "react-bootstrap";

import { Sort } from "./Sort";
import { SearchBar } from "./SearchBar";
import { ArrangementsTable } from "./ArrangementsTable";
import { SongBookTable } from "./SongBookTable";
import { PDFGenerator } from "./PdfGenerator";
import { sortByColumn } from "./helper/sorter";
import { SongBar } from "./SongBar";
import { AddAllSongsButton } from "./AddAllSongsButton";
import { BsFillSave2Fill } from "react-icons/bs";

import {
  isSongBookRowSection,
  SongBook,
  type PlayingSong,
  type SongArrangement,
  type SongBookRow,
} from "../types";

import "bootstrap/dist/css/bootstrap.css";
import "../css/App.css";
import SaveLoadModal from "./SaveLoadModal";

function App() {
  const [results, setResults] = useState<SongArrangement[]>([]);
  const [songBookRows, setSongBookRows] = useState<SongBookRow[]>([]);
  const [showSaveLoadModal, setShowSaveLoadModal] = useState(false);
  const [playingSong, setPlayingSong] = useState<PlayingSong>({
    songName: "",
    arrangementName: "",
    partName: "",
  });
  const handleSelectSong = (
    songArrangement: SongArrangement,
    checked: boolean
  ) => {
    checked
      ? handleAddSong(songArrangement)
      : handleRemoveSong(songArrangement);
  };

  const clearSelected = () => {
    setSongBookRows([]);
  };

  const handleAddSong = (songArrangement: SongArrangement) => {
    setSongBookRows([...songBookRows, songArrangement]);
    const updatedRes = results.filter(
      (r) => r.arrangement.id !== songArrangement.arrangement.id
    );

    setResults(updatedRes);
  };

  const handleRemoveSong = (songArrangement: SongArrangement) => {
    const updatedRes = songBookRows.filter(
      (r) =>
        isSongBookRowSection(r) ||
        r.arrangement.id !== songArrangement.arrangement.id
    );

    setResults([songArrangement, ...results]);
    setSongBookRows(updatedRes);
  };

  const handleResultsSortBy = (column: string, direction: string) => {
    const sorted = sortByColumn(results, column, direction);
    setResults(sorted.slice());
  };

  const handleAddAllSongs = () => {
    const newSongBookRows = [...songBookRows, ...results];
    const newUniqueSelectedResults = newSongBookRows.filter((row, index) => {
      return (
        // include sections
        isSongBookRowSection(row) ||
        // include first occurrence of song
        index ===
          newSongBookRows.findIndex(
            (o) =>
              !isSongBookRowSection(o) &&
              row.arrangement.id === o.arrangement.id
          )
      );
    });
    setSongBookRows(newUniqueSelectedResults);
    setResults([]);
  };

  // GUS-TODO: load all songbook fields (title, etc) instead of just rows
  const loadSongBook = (songBook: SongBook) => {
    // GUS-TODO: how to handle errors?
    // GUS-TODO: reset results from search bar?
    setSongBookRows(songBook.rows);
    return true;
  };

  const songBook = {
    rows: songBookRows,
  };

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
        <Row>
          <Col sm={6}>
            <SearchBar handleResults={setResults} />
          </Col>
          <Col sm={6}>
            <PDFGenerator songBookRows={songBookRows} />
          </Col>
        </Row>
        <SongBar info={playingSong} />
        <Row className="mt-4">
          <Col sm={6}>
            {results.length > 0 && (
              <>
                <h3 className="results">Resultados</h3>
                <Row>
                  <Col sm="6">
                    <Sort onSortBy={handleResultsSortBy} />
                  </Col>
                  <Col sm="2" />
                  <Col sm="4">
                    <AddAllSongsButton
                      count={results.length}
                      onAddAllSongs={handleAddAllSongs}
                    />
                  </Col>
                </Row>
                <ArrangementsTable
                  songArrangements={results}
                  handlePlayingSong={setPlayingSong}
                  handleSelect={handleSelectSong}
                />
              </>
            )}
          </Col>
          <Col sm={6}>
            <>
              <h3 className="results">
                Caderninho
                <BsFillSave2Fill onClick={() => setShowSaveLoadModal(true)} />
              </h3>
              <SongBookTable
                rows={songBookRows}
                setRows={setSongBookRows}
                handlePlayingSong={setPlayingSong}
                handleSelect={handleSelectSong}
                handleClear={clearSelected}
              />
            </>
          </Col>
        </Row>
      </Container>
      <SaveLoadModal
        songBook={songBook}
        onLoad={loadSongBook}
        onHide={() => setShowSaveLoadModal(false)}
        show={showSaveLoadModal}
      />
    </>
  );
}

export default App;
