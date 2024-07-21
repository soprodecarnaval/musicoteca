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
} from "react-bootstrap";
import { useState } from "react";
import {
  Instrument,
  SongArrangement,
  SongArrangementSection,
  SongBookRow,
  isSongBookRowSection,
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
  "bombardino",
  "clarinete",
  "trombone pirata",
  "trompete pirata",
];

interface PdfGeneratorProps {
  songBookRows: SongBookRow[];
}

// GUS-TODO: persist songbook
const PDFGenerator = ({ songBookRows }: PdfGeneratorProps) => {
  const songArrangements = songBookRows.filter(
    (r: SongBookRow) => !isSongBookRowSection(r)
  ) as SongArrangement[];

  const [songbookTitle, setTitle] = useState("");

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

  const carnivalModeTooltip = (
    <Tooltip id="tooltip">
      <ListGroup>
        <ListGroup.Item>Capa automática</ListGroup.Item>
        <ListGroup.Item>Númeração no verso de cada música</ListGroup.Item>
        <ListGroup.Item>Índice com duas páginas</ListGroup.Item>
        <ListGroup.Item>Mensagem anti assédio no início</ListGroup.Item>
      </ListGroup>
    </Tooltip>
  );

  const [backSheetPageNumber, setBackSheetPageNumber] = useState(false);

  const onGeneratePdfClicked = (e: any, instrument: string = "all") => {
    e.preventDefault();
    let selectedInstruments = instruments;
    if (instrument != "all") {
      selectedInstruments = selectedInstruments.filter((i) => instrument == i);
    }
    if (songArrangements.length < 1) {
      alert("Selecione ao menos 1 arranjo!");
      return;
    }
    if (songbookTitle == "") {
      alert("Digite um título para o caderninho!");
      return;
    }

    // Create sections from songbook rows
    const sections: SongArrangementSection[] = [];
    let currentSection: SongArrangementSection | null = null;

    for (const row of songBookRows) {
      if (isSongBookRowSection(row)) {
        currentSection = {
          title: row,
          songArrangements: [],
        };
        sections.push(currentSection);
      } else {
        // Create empty section if no row exists
        if (!currentSection) {
          currentSection = {
            title: "",
            songArrangements: [],
          };
        }
        currentSection.songArrangements.push(row);
      }
    }

    console.log(sections);

    // TODO: add button to autogenerate sections in UI
    // songArrangements.forEach((sa: SongArrangement) => {
    //   const title = sa.song.style;
    //   if (sectionMap.has(title)) {
    //     const section = sectionMap.get(title);
    //     section?.songArrangements.push(sa);
    //   } else {
    //     sectionMap.set(title, {
    //       title,
    //       songArrangements: [sa],
    //     });
    //   }
    // });

    const songbooks: any[] = selectedInstruments.map((instrument) => {
      createSongBook({
        instrument,
        sections,
        title: songbookTitle,
        coverImageUrl: songbookImg.imgUrl,
        carnivalMode,
        backSheetPageNumber,
      });
    });
    Promise.all(songbooks).then(() => {
      console.log("Terminei");
    });
  };

  return (
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
        <OverlayTrigger placement="left" overlay={carnivalModeTooltip}>
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
  );
};

export { PDFGenerator };
