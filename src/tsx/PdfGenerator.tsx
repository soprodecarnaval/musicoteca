import { Button, ButtonGroup, Col, Dropdown, Form, Row, OverlayTrigger, Tooltip, ListGroup } from "react-bootstrap";
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
  'marcha rancho',  // 7
  'marchinhas',     // 14
  'odaras',         // 7
  'beagá',          // 9
  'fanfarras',      // 8
  'latinas',        // 5
  'pagodes',        // 6
  'frevos',         // 4
  
  'axés',           // 15
  'brazukas',       // 11
  'funks',          // 14
  'sambas',         // 13
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
        let pdfPage = carnivalMode ? 2 * page + 5 : page + 1;
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

  // const loadImage = (url: string) => {
  //     return new Promise((resolve, reject) => {
  //         let img = new Image()
  //         img.crossOrigin = "Anonymous"

  //         img.onload = () => {
  //             // resolve(img)
  //             const canvas = document.createElement('canvas');
  //             const ctx = canvas.getContext('2d');
  //             canvas.height = 2409;
  //             canvas.width = 4208;
  //             ctx?.drawImage(img, 0, 0);
  //             const dataUrl = canvas.toDataURL();
  //             resolve(dataUrl)
  //         }

  //         img.onerror = () => {
  //             reject(new Error(`Failed to load image's URL: ${url}`))
  //         }
  //         img.src = url
  //     })
  // }

  // const drawImage = (doc : any, img_url : string, page: number) => {
  //     return loadImage(img_url).then((img: any) => {
  //         doc.switchToPage(page)
  //         doc.image(img, 50, 100, {
  //             width: 500,
  //             height: 300
  //         });
  //     }).catch((error)=>{console.log(error)})
  // }

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
          doc.addPage()
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
    return reorderedSongs;
  };

  const createSongBook = async (instrument: Instrument) => {
    const doc = createDoc();
    doc.fontSize(25).text(songbookTitle.toUpperCase(), 120, 100);
    doc.fontSize(22).text(instrument.toUpperCase(), 120, 125);
    if (backNumber) doc.addPage();
    if (carnivalMode) { 
      doc.addPage()
        .fontSize(16)
        .text(`Mussum Ipsum, cacilds vidis litro abertis.  Todo mundo vê os porris que eu tomo, mas ninguém vê os tombis que eu levo! Pra lá, depois divoltis porris, paradis. Viva Forevis aptent taciti sociosqu ad litora torquent. Pellentesque nec nulla ligula. Donec gravida turpis a vulputate ultricies.
        Detraxit consequat et quo num tendi nada. Posuere libero varius. Nullam a nisl ut ante blandit hendrerit. Aenean sit amet nisi. Per aumento de cachacis, eu reclamis. Interagi no mé, cursus quis, vehicula ac nisi.
        Mauris nec dolor in eros commodo tempor. Aenean aliquam molestie leo, vitae iaculis nisl. Vehicula non. Ut sed ex eros. Vivamus sit amet nibh non tellus tristique interdum. Nulla id gravida magna, ut semper sapien. A ordem dos tratores não altera o pão duris.`,
        1 * cm2pt,
        3 * cm2pt,
        {
          width: 16 * cm2pt,
          align: 'center'
        })
        .addPage();

    }
    let reorderedSongs = addIndexPage(doc);
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
  const onInput = ({ target: { value } }: any) => setTitle(value);

  const [carnivalMode, setCarnivalMode] = useState(false)
  const onCheckCarnivalMode = ({ target: { checked } }: any) => {
    setBackNumber(checked)
    setCarnivalMode(checked)
  }

  const carnivalModeTooltip = (
    <Tooltip id="tooltip">
      <ListGroup>
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
            onChange={onInput}
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
                  onClick={(event) => generatePdf(event, instrument)}
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
      </Form>
    </Row>
  );
};

export { PDFGenerator };
