import {
  Button,
  ButtonGroup,
  Col,
  Dropdown,
  Form,
  Row,
  OverlayTrigger,
  Tooltip,
  ListGroup,
  CloseButton,
  Modal,
  Spinner,
} from "react-bootstrap";
import { useState } from "react";
import {
  Instrument,
  isSongBookSection,
  Score,
  SongBook,
  SongBookItem,
  SongBookScore,
} from "../../types";
import { createSongBook } from "../createSongBook";

const instruments: Instrument[] = [
  "trompete",
  "trombone",
  "sax alto",
  "sax soprano",
  "sax tenor",
  "flauta",
  "tuba",
  "tuba eb",
  "bombardino",
  "clarinete",
];

const carnivalInstruments: Instrument[] = [
  "trompete",
  "trombone",
  "sax alto",
  "sax tenor",
  "flauta",
];

interface PdfGeneratorProps {
  songBook: SongBook;
}

export type Section = {
  title: string;
  songs: Score[];
};

const CarnivalModeTooltip = () => (
  <Tooltip id="tooltip">
    <ListGroup>
      <ListGroup.Item>Capa automática</ListGroup.Item>
      <ListGroup.Item>Númeração no verso de cada música</ListGroup.Item>
      <ListGroup.Item>Índice com duas páginas</ListGroup.Item>
      <ListGroup.Item>Mensagem anti assédio no início</ListGroup.Item>
    </ListGroup>
  </Tooltip>
);

const PDFGenerator = ({ songBook }: PdfGeneratorProps) => {
  const scores = songBook.items.filter(
    (r: SongBookItem) => !isSongBookSection(r)
  ) as SongBookScore[];

  const [songbookTitle, setTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const onInputSongbookTitle = ({ target: { value } }: any) => setTitle(value);

  const [songbookImg, setImg] = useState({
    imgUrl: "",
    imgName: "",
    imgSize: "",
  });
  const onInputSongbookImg = ({ target: { files } }: any) =>
    setImg({
      imgUrl: URL.createObjectURL(files[0]),
      imgName: files[0].name,
      imgSize: files[0].size,
    });

  const [carnivalMode, setCarnivalMode] = useState(false);
  const onCheckCarnivalMode = ({ target: { checked } }: any) => {
    setBackSheetPageNumber(checked);
    setCarnivalMode(checked);
  };

  const removeSongbookImg = () =>
    setImg({ imgName: "", imgSize: "", imgUrl: "" });

  const formattedImgName = () =>
    songbookImg.imgName.slice(0, -4).slice(0, 25).toLowerCase();

  const formattedImgSize = () =>
    (parseInt(songbookImg.imgSize) * Math.pow(10, -6)).toFixed(2);

  const [backSheetPageNumber, setBackSheetPageNumber] = useState(false);

  const onGeneratePdfClicked = async (e: any, instrument: string = "all") => {
    e.preventDefault();
    let selectedInstruments = instruments;
    if (instrument != "all") {
      selectedInstruments = selectedInstruments.filter((i) => instrument == i);
    }
    if (carnivalMode && instrument == "all"){
      selectedInstruments = carnivalInstruments
    }
    if (scores.length < 1) {
      alert("Selecione ao menos uma música!");
      return;
    }
    if (songbookTitle == "") {
      alert("Digite um título para o caderninho!");
      return;
    }

    // Start generation process
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Create sections from songbook rows
      const sections: Section[] = [];
      let currentSection: Section | null = null;

      for (const item of songBook.items) {
        if (isSongBookSection(item)) {
          currentSection = {
            title: item.title,
            songs: [],
          };
          sections.push(currentSection);
        } else {
          if (!currentSection) {
            currentSection = {
              title: "",
              songs: [],
            };
            sections.push(currentSection);
          }
          currentSection.songs.push(item.score);
        }
      }

      const totalInstruments = selectedInstruments.length;
      const skippedInstruments: string[] = [];
      
      for (let i = 0; i < selectedInstruments.length; i++) {
        const instrument = selectedInstruments[i];

        // Check if this instrument has at least one song available
        const hasAnySong = sections.some((sec) =>
          sec.songs.some((song) =>
            song.parts?.some((p) => p.instrument === instrument)
          )
        );

        // Skip generating this instrument if no songs are available
        if (!hasAnySong) {
          // advance progress as if processed
          setGenerationProgress(((i + 1) / totalInstruments) * 100);
          skippedInstruments.push(instrument.toUpperCase());
          continue;
        }

        await createSongBook({
          instrument,
          sections, // Pass all sections so index can show all songs
          title: songbookTitle,
          coverImageUrl: songbookImg.imgUrl,
          carnivalMode,
          backSheetPageNumber,
          stripInstrumentFromPartLabel: false,
        });
        
        // Update progress
        setGenerationProgress(((i + 1) / totalInstruments) * 100);
      }

      if (skippedInstruments.length > 0) {
        alert(
          `Não foi gerado PDF para os seguintes instrumentos por falta de partituras: \n- ${skippedInstruments.join("\n- ")}`
        );
      }

      console.log("Terminei");
    } catch (error) {
      console.error("Error generating PDFs:", error);
      alert("Ocorreu um erro ao gerar os PDFs. Por favor, tente novamente.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  return (
    <>
      <Row className="mt-4">
        <Form className="d-flex" onSubmit={onGeneratePdfClicked}>
          <Col sm={6}>
            <Form.Control
              type="text"
              onChange={onInputSongbookTitle}
              value={songbookTitle}
              placeholder="Título do caderninho"
            />
          </Col>
          <Col sm={3}>
            <Dropdown as={ButtonGroup}>
              <Button type="submit">Gerar todos</Button>

              <Dropdown.Toggle split id="dropdown-split-basic" />

              <Dropdown.Menu>
                {instruments.map((instrument) => (
                  <Dropdown.Item
                    key={instrument}
                    onClick={(event: any) =>
                      onGeneratePdfClicked(event, instrument)
                    }
                  >
                    {instrument.toUpperCase()}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <OverlayTrigger placement="left" overlay={CarnivalModeTooltip}>
            <Col sm={4}>
              <Form.Check
                type="switch"
                id="back-number"
                label="Modo carnaval"
                onChange={onCheckCarnivalMode}
              />
            </Col>
          </OverlayTrigger>
          <Form.Group controlId="formFileImg" className="mb-1">
            <Form.Label
              className={
                songbookImg.imgUrl !== ""
                  ? "btn btn-success w-100 container mb-0"
                  : "btn btn-primary w-100 mb-0"
              }
              style={{
                wordWrap: "break-word",
                display: "flex",
                justifyContent: "space-between",
                paddingRight: "5px",
              }}
            >
              {songbookImg.imgUrl !== "" ? (
                <span>{`${formattedImgName()} - ${formattedImgSize()} MB`}</span>
              ) : (
                <span>Imagem da capa</span>
              )}
              <CloseButton
                hidden={songbookImg.imgUrl === ""}
                onClick={removeSongbookImg}
                variant="white"
              />
            </Form.Label>
            <Form.Control
              type="file"
              hidden={true}
              onChange={onInputSongbookImg}
              accept="image/png,image/jpeg"
            />
          </Form.Group>
        </Form>
      </Row>

      <Modal
        show={isGenerating}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header>
          <Modal.Title>Gerando PDFs</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p>Gerando caderninhos, por favor aguarde...</p>
          <div className="progress">
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${generationProgress}%` }}
              aria-valuenow={generationProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {Math.round(generationProgress)}%
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export { PDFGenerator };