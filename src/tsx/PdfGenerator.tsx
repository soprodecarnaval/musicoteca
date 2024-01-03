import { Button, ButtonGroup, Col, Dropdown, Form, Row, OverlayTrigger, Tooltip, ListGroup, CloseButton } from "react-bootstrap";
import SVGtoPDF from "svg-to-pdfkit";
import { useState } from "react";
import { Instrument, SongArrangement } from "../types";

// Needed for calling PDFDocument from window variable
declare const window: any;

const cm2pt = 28.3465;

// A5 page dimensions in points
const pageWidth = 18 * cm2pt;
const pageHeight = 13 * cm2pt;

const stylesOrder = [
  'marchinhas',     // 14
  'beagá',          // 9
  'fanfarras',      // 8
  'pagodes',        // 6
  'odaras',         // 7
  'marcha ranchos',  // 7
  'latinas',        // 5
  'piseiro',
  
  'axés',           // 15
  'funks',          // 14
  'sambas',         // 13
  'brazukas',       // 11
  'frevos',         // 4
  'forrós',         // 4
  'technohell'      // 3
]

const sortStyles = (a : string,b : string) => {
  if(stylesOrder.indexOf(a) < stylesOrder.indexOf(b)){
    return -1
  } else if (stylesOrder.indexOf(a) > stylesOrder.indexOf(b)){
    return 1
  } else {
    return 0
  }
}

const sortSongs = (a : SongArrangement,b : SongArrangement) => {
  if(a.song.title < b.song.title){
    return -1
  } else if (a.song.title > b.song.title){
    return 1
  } else {
    return 0
  }
}

let stylesOutlines = new Map();

interface PdfGeneratorProps {
  songArrangements: SongArrangement[];
}

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
const documentOptions = {
  layout: "landscape",
  size: [pageHeight, pageWidth],
  bufferPages: true,
  margin: 0,
};

const a = document.createElement("a");
document.body.appendChild(a);

const PDFGenerator = ({ songArrangements }: PdfGeneratorProps) => {
  const download = (doc: any, file_name: string) => {
    const stream = doc.pipe(window.blobStream());
    stream.on("finish", function () {
      const url = stream.toBlobURL("application/pdf");
      a.href = url;
      a.download = file_name;
      a.click();
      window.URL.revokeObjectURL(url);
    });
    doc.end();
  };

  const drawSvg = (doc: any, url: string, page: number) => {
    return fetch(url)
      .then((r) => r.text())
      .then((svg) => {
        let pdfPage = carnivalMode ? 2 * page + 10 : page + 1;
        doc.switchToPage(pdfPage);
        const width = 17.17 * cm2pt;
        const height = 9.82 * cm2pt;
        SVGtoPDF(doc, svg, 0.44 * cm2pt, 2.55 * cm2pt, {
          width: width,
          height: height,
          preserveAspectRatio: `${width}x${height}`,
        });
      })
      .catch(console.error.bind(console));
  };

  const loadImage = (url: string) => {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.crossOrigin = "Anonymous";

      img.onload = () => {
        // resolve(img)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = img.naturalHeight;
        canvas.width = img.naturalWidth;
        ctx?.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL();
        resolve(dataUrl)
      }

      img.onerror = () => {
        reject(new Error(`Failed to load image's URL: ${url}`))
      }
      img.src = url
    })
  }

  const drawImage = (doc : any, imageUrl : any, pageNumber : number) => {
    return loadImage(imageUrl).then((img: any) => {
      doc.switchToPage(pageNumber);
      doc.image(img, 0, 0, { fit: [pageWidth,pageHeight], align: 'center', valign: 'center' })
    }).catch((error)=>{console.log(error)})
  }

  const createDoc = () => {
    return new window.PDFDocument(documentOptions);
  };

  const addSongPage = (
    doc: any,
    instrument: string,
    { song, arrangement }: SongArrangement,
    page: number
  ) => {
    if (backNumber) {
      doc.addPage();
      doc
        .font("Helvetica-Bold")
        .fontSize(9 * cm2pt)
        .text(page, 0, 2.14 * cm2pt, {
          align: "center",
          width: 18 * cm2pt,
          height: 9 * cm2pt,
        }); // Número do verso
      doc
        .font("Helvetica")
        .fontSize(1 * cm2pt)
        .text(song.title.toUpperCase(), 0 * cm2pt, 10.5 * cm2pt, {
          align: "center",
          width: 18 * cm2pt,
        }); // Título do verso
    }
    doc.addPage();
    stylesOutlines.get(song.style).addItem(song.title.toUpperCase());
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .text(song.title.toUpperCase(), 0.39 * cm2pt, 1.2 * cm2pt, {
        destination: page,
      }); // Título x: 0.44*cm2pt, y: 10*cm2pt,
    doc
      .rect(0.44 * cm2pt, 2.14 * cm2pt, 17.17 * cm2pt, 0.41 * cm2pt)
      .fillAndStroke(); // Retângulo do trecho da letra
    doc
      .fontSize(10)
      .fillColor("white")
      .text(song.sub.toUpperCase(), 0.5 * cm2pt, 2.2 * cm2pt); // Trecho da letra
    doc.text(song.composer.toUpperCase(), 0.44 * cm2pt, 2.2 * cm2pt, {
      align: "right",
      width: 17.1 * cm2pt,
    }); // Compositor
    doc.rect(0.44 * cm2pt, 2.55 * cm2pt, 17.17 * cm2pt, 9.82 * cm2pt).stroke(); // Retângulo da partitura
    doc
      .fontSize(9)
      .fillColor("black")
      .text(instrument.toUpperCase(), 0.44 * cm2pt, 12.5 * cm2pt); // Nome do instrumento
    doc
      .fontSize(9)
      .text(
        `${song.style.toUpperCase()}   ${page}`,
        0.44 * cm2pt,
        12.5 * cm2pt,
        { align: "right", width: 17.1 * cm2pt }
      ); // Estilo + Número
    // TODO: Pensar em quando tiver mais de um arranjo
    let svgUrl = "";
    try {
      svgUrl = arrangement.parts
        .filter((part) => part.instrument == instrument)[0]
        .assets.filter((file) => file.extension == ".svg")[0].path;
    } catch (error) {
      console.log(`No part for ${instrument} in ${song.title}.`);
      return null;
    }
    return drawSvg(doc, `/collection/${svgUrl}`, page);
  };

  const createFileName = (instrument: string) => {
    return `${songbookTitle.replace(/[ -]/g, "_")}_${instrument}.pdf`;
  };

  const addIndexPage = (doc: any) => {
    const songsCount = songArrangements.length;
    const styles = new Set(songArrangements.map(({ song }) => song.style));
    const stylesCount = styles.size;
    const containerWidth = 17.17 * cm2pt;
    const containerHeight = 11 * cm2pt;
    let totalLineCount = carnivalMode ? 76 : songsCount + stylesCount * 2;

    let columnCount = 1;
    if (totalLineCount > 80) {
      columnCount = 4;
    } else if (totalLineCount > 50) {
      columnCount = 3;
    } else if (totalLineCount > 20) {
      columnCount = 2;
    }

    const maxLinesPerColumn = Math.floor(totalLineCount / columnCount);
    const fontSize = Math.min(
      Math.floor(containerHeight / maxLinesPerColumn),
      15
    );
    const columnWidth = Math.floor(containerWidth / columnCount);

    let cursorStartPosition = [0.44 * cm2pt, 1.55 * cm2pt];
    let currentColumn = 0;
    let currentLine = 0;
    let itemCount = 0;
    let songCount = 0;
    let firstPage = true;
    const resetCursorPosition = () => {
      cursorStartPosition = [0.44 * cm2pt, 1.55 * cm2pt];
      currentColumn = 0;
      currentLine = 0;
      itemCount = 0;
    }
    const nextCursorPosition = () => {
      if (itemCount == 0) {
        itemCount++;
        return cursorStartPosition;
      }
      currentLine = itemCount % (maxLinesPerColumn + 1); //Math.max((itemCount+1)%(maxLinesPerColumn+1),1)
      currentColumn = Math.ceil((itemCount + 1) / (maxLinesPerColumn + 1)) - 1; //Math.max(Math.ceil((itemCount+1)/maxLinesPerColumn),1)
      itemCount++;
      return [
        cursorStartPosition[0] + currentColumn * columnWidth,
        cursorStartPosition[1] + currentLine * fontSize,
      ];
    };
    let [currentX, currentY] = nextCursorPosition();
    let reorderedSongs: SongArrangement[] = [];
    doc
      .addPage();
      // .fontSize(25)
      // .font("Helvetica-Bold")
      // .text("ÍNDICE", currentX + 0.3 * cm2pt, 1.2 * cm2pt);
    let sortStyleFunc = carnivalMode ? sortStyles : undefined;
    [...styles].sort(sortStyleFunc).forEach((style, styleIdx) => {
      let filteredSongs = songArrangements
        .filter(({ song }) => song.style == style)

      if(carnivalMode){
        if(firstPage && songCount + (styleIdx+1)*2 + filteredSongs.length + 2 > totalLineCount){
          firstPage = false
          resetCursorPosition();
          [currentX, currentY] = nextCursorPosition();
          doc.addPage().addPage()
        }
      }

      filteredSongs
        .sort(sortSongs)
        .forEach((songArrangement, songIdx) => {
          reorderedSongs.push(songArrangement);
          if (songIdx == 0) {
            if (currentLine == maxLinesPerColumn)
              [currentX, currentY] = nextCursorPosition();
            doc
              .font("Helvetica-Bold")
              .fontSize(fontSize - 2)
              .text(`${style.toUpperCase()}`, currentX + 0.3 * cm2pt, currentY); // Título do estílo
            [currentX, currentY] = nextCursorPosition();
          }
          doc
            .font("Helvetica-Bold")
            .fontSize(fontSize - 2)
            .text(1 + songCount++, 
              currentX - 0.5 * cm2pt, 
              currentY, 
              {
              align: "right",
              width: 0.6 * cm2pt,
              goTo: songCount,
            }) // Número da página
            .font("Helvetica")
            .text(
              `${songArrangement.song.title.toUpperCase()}`,
              currentX + 0.3 * cm2pt,
              currentY,
              {
                goTo: songCount,
                width: columnWidth - 0.3*cm2pt,
                height: fontSize,
                lineBreak: false
              }
            );
          [currentX, currentY] = nextCursorPosition();
        });
      if (currentLine != 0) [currentX, currentY] = nextCursorPosition();
    });
    if (carnivalMode) doc.addPage()
    return reorderedSongs;
  };

  const removeSongbookImg = () => (setImg({ imgName: "", imgSize: "", imgUrl: "" }))

  const formattedImgName = () => songbookImg.imgName.slice(0, -4).slice(0, 25).toLowerCase();

  const formattedImgSize = () => (parseInt(songbookImg.imgSize) * Math.pow(10, -6)).toFixed(2);

  const createSongBook = async (instrument: Instrument) => {
    const doc = createDoc();
    if (carnivalMode) {
      await drawImage(doc, 'assets/capa_2024.jpeg',0);
      doc
        .font("Helvetica")
        .fontSize(14)
        // .rect(142, 213, 220, 15)
        // .fill("red")
        .text(instrument.toUpperCase(), 142, 214, {
          width: 220,
          align: 'center'
        });
    } else if (songbookImg.imgUrl != "") {
      await drawImage(doc, songbookImg.imgUrl,0);
      doc
      .fontSize(25).text(songbookTitle.toUpperCase(), 120, 100)
      .fontSize(22).text(instrument.toUpperCase(), 120, 125);
    }

    if(carnivalMode) doc.addPage()
    let reorderedSongs = addIndexPage(doc);

    if (carnivalMode) { 
      doc.addPage()
      doc.addPage()
      doc.addPage()
      doc.addPage()
      doc.addPage()
      await drawImage(doc, 'assets/anti_assedio_2024_1.png',6)
      await drawImage(doc, 'assets/anti_assedio_2024_2.png',8)
      await drawImage(doc, 'assets/anti_assedio_2024_3.png',10)
    }

    let styles = new Set(songArrangements.map(({ song }) => song.style));
    const { outline } = doc;
    styles.forEach((style) => {
      let topItem = outline.addItem(style.toUpperCase());
      stylesOutlines.set(style, topItem);
    });
    const promises = reorderedSongs.map((song, songIdx) => {
      return addSongPage(doc, instrument, song, songIdx + 1);
    });

    const nonNullPromises = promises.filter((promise) => promise !== null);
    if (nonNullPromises.length > 0) {
      await Promise.all(nonNullPromises);
      download(doc, createFileName(instrument));
    }
  };

  const generatePdf = (e: any, instrument: string = "all") => {
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
    const songbooks: any[] = selectedInstruments.map((instrument) => {
      createSongBook(instrument);
    });
    Promise.all(songbooks).then(() => {
      console.log("Terminei");
    });
  };

  const [songbookTitle, setTitle] = useState("");

  const onInputSongbookTitle = ({ target: { value } }: any) => setTitle(value);

  const [songbookImg, setImg] = useState({ imgUrl: "", imgName: "", imgSize: "" });
  const onInputSongbookImg = ({ target: { files } }: any) => setImg({ imgUrl: URL.createObjectURL(files[0]), imgName: files[0].name , imgSize: files[0].size });

  const [carnivalMode, setCarnivalMode] = useState(false)
  const onCheckCarnivalMode = ({ target: { checked } }: any) => {
    setBackNumber(checked)
    setCarnivalMode(checked)
  }

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

  const [backNumber, setBackNumber] = useState(false);
  // const onCheckBackNumber = ({ target: { checked } }: any) =>
  //   setBackNumber(checked);

  return (
    <Row className="mt-4">
      <Form className="d-flex" onSubmit={generatePdf}>
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
                  onClick={(event: any) => generatePdf(event, instrument)}
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
                className={ songbookImg.imgUrl !== "" ? "btn btn-success w-100 container mb-0" : "btn btn-primary w-100 mb-0" }
                style={{ wordWrap: "break-word", display: "flex", justifyContent: "space-between", paddingRight: "5px" }}>
                {
                  songbookImg.imgUrl !== "" ?
                  <span>{`${ formattedImgName() } - ${ formattedImgSize() } MB`}</span> :
                  <span>Imagem da capa</span>
                }
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
