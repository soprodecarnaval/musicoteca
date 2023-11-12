import { Button, ButtonGroup, Col, Dropdown, Form, Row } from "react-bootstrap";
import SVGtoPDF from "svg-to-pdfkit";
import { useState } from "react";
import { Instrument, Song } from "../types";

// Needed for calling PDFDocument from window variable
declare const window: any;

const cm2pt = 28.3465

interface PdfGeneratorProps {
  songs: Song[];
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
  size: [13 * cm2pt, 18 * cm2pt], //"A5",
  bufferPages: true,
  margin: 0,
};

const a = document.createElement("a");
document.body.appendChild(a);

const PDFGenerator = ({ songs }: PdfGeneratorProps) => {
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
        doc.switchToPage(page);
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

  const createMusicSheet = (
    doc: any,
    instrument: string,
    song: Song,
    page: number
  ) => {
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(22).text(song.title.toUpperCase(), 0.39 * cm2pt, 1.2 * cm2pt); // Título x: 0.44*cm2pt, y: 10*cm2pt,
    doc.rect(0.44 * cm2pt, 2.14 * cm2pt, 17.17 * cm2pt, 0.41 * cm2pt).fillAndStroke(); // Retângulo do trecho da letra
    doc.fontSize(10).fillColor('white').text(song.sub.toUpperCase(), 0.5 * cm2pt, 2.2 * cm2pt); // Trecho da letra
    doc.text(song.composer.toUpperCase(), 0.44 * cm2pt, 2.2 * cm2pt, { align: 'right', width: 17.1 * cm2pt }); // Compositor
    doc.rect(0.44 * cm2pt, 2.55 * cm2pt, 17.17 * cm2pt, 9.82 * cm2pt).stroke(); // Retângulo da partitura
    doc.fontSize(9).fillColor('black').text(instrument.toUpperCase(), 0.82 * cm2pt, 12.5 * cm2pt); // Nome do instrumento
    doc.fontSize(9).text(`${song.style.toUpperCase()}   ${page}`, 0.44 * cm2pt, 12.5 * cm2pt, { align: 'right', width: 17.1 * cm2pt }); // Estilo + Número
    // TODO: Pensar em quando tiver mais de um arranjo
    let svgUrl = "";
    try {
      svgUrl = song.arrangements[0].parts
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

  const createSongBook = async (instrument: Instrument) => {
    const doc = createDoc();
    doc.fontSize(25).text(songbookTitle.toUpperCase(), 120, 100);
    doc.fontSize(22).text(instrument.toUpperCase(), 120, 125);
    const promises = songs.map((song, songIdx) => {
      return createMusicSheet(doc, instrument, song, songIdx + 1);
    });

    const nonNullPromises = promises.filter((promise) => promise !== null);
    if (nonNullPromises.length > 0) {
      await Promise.all(nonNullPromises);
      download(doc, createFileName(instrument));
    }
  };

  const generatePdf = (e: any, instrument: string = "all") => {
    e.preventDefault();
    let selectedInstruments = instruments
    if (instrument != "all") {
      selectedInstruments = selectedInstruments.filter((i) => instrument == i)
    }
    if (songs.length < 1) {
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
              {
                instruments.map((instrument) =>
                  <Dropdown.Item key={instrument} onClick={(event) => generatePdf(event, instrument)}>
                    {instrument.toUpperCase()}
                  </Dropdown.Item>)
              }
            </Dropdown.Menu>
          </Dropdown>
        </Col>
        <Col sm={3}>
          <Form.Check
            type="checkbox"
            id="back-number"
            label="Número no verso?"
          />
        </Col>
      </Form>
    </Row>
  );
};

export { PDFGenerator };
