import { Modal } from "react-bootstrap";
import { SongBook } from "../types";
import { useState } from "react";

// GUS-TODO: save whole songbook instead of just rows
interface SaveLoadModalProps {
  songBook: SongBook;
  // GUS-TODO: return type should hold error
  onLoad: (songBook: SongBook) => boolean;
  onHide: () => void;
  show: boolean;
}

const songBookToBase64 = (songBook: SongBook): string => {
  return btoa(JSON.stringify(songBook));
};

type Base64ToSongBookResult =
  | {
      songBook: SongBook;
      error?: undefined;
    }
  | {
      songBook?: undefined;
      error: any;
    };

const base64ToSongBook = (base64: string): Base64ToSongBookResult => {
  try {
    return { songBook: JSON.parse(atob(base64)) };
  } catch (e: any) {
    return { error: e };
  }
};

// A component with an input field and a button to save the songbook
// The component starts with the input field displaying the current songbook serialized as base64
// If the data is modified, the button is enabled
// If the data is not modified, the button is disabled
// If the button is clicked, the songbook is deserialized and passed to the onLoad callback
// An error message is displayed if the songbook is not valid
// The onLoad callback returns true if the songbook was loaded successfully
const SaveLoadModal = (props: SaveLoadModalProps) => {
  const { songBook, onLoad, onHide, show } = props;
  const initialSongBookData = songBookToBase64(songBook);

  const [songBookData, setSongBookData] = useState(initialSongBookData);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModified, setIsModified] = useState(false);

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSongBookData(event.target.value);
    setIsModified(true);
  };

  const handleLoad = () => {
    try {
      const result = base64ToSongBook(songBookData);
      if (result.error) {
        setErrorMessage(result.error.message);
      } else if (result.songBook && onLoad(result.songBook)) {
        setErrorMessage("");
        setIsModified(false);
        onHide();
      } else {
        // GUS-TODO: display error message
        setErrorMessage("Erro carregando caderninho");
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  const handleHide = () => {
    setSongBookData(initialSongBookData);
    setErrorMessage("");
    setIsModified(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleHide}>
      <Modal.Header closeButton>
        <Modal.Title>Save/Load</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <input
          className="form-control"
          type="text"
          value={isModified ? songBookData : initialSongBookData}
          onChange={handleInput}
        />
        {errorMessage && (
          <div className="alert alert-danger mt-2" role="alert">
            {errorMessage}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button
          className="btn btn-primary"
          onClick={handleLoad}
          disabled={!isModified}
        >
          Load
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default SaveLoadModal;
