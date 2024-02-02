import { fonts } from "pdfkit/js/page";
import SVGtoPDF from "svg-to-pdfkit";
import { Instrument, SongArrangement, SongArrangementSection } from "./types";

// Needed for calling PDFDocument from window variable
declare const window: any;

const cm2pt = 28.3465;

// A5 page dimensions in points
const pageWidth = 18 * cm2pt;
const pageHeight = 13 * cm2pt;

// TODO: use SongBook type instead of CreateSongBookOptions
export interface CreateSongBookOptions {
  title: string;
  instrument: Instrument;
  sections: SongArrangementSection[];
  coverImageUrl: string;
  backSheetPageNumber: boolean;
  carnivalMode: boolean;
}

export const createSongBook = async (opts: CreateSongBookOptions) => {
  const doc = createDoc();
  const { title, instrument, sections, coverImageUrl, carnivalMode } = opts;
  if (carnivalMode) {
    await drawImage(doc, "assets/capa_carnaval_2024.jpeg", 0);
    doc
      .font("Helvetica")
      .fontSize(14)
      // .rect(142, 213, 220, 15)
      // .fill("red")
      .text(instrument.toUpperCase(), 142, 208.5, {
        width: 220,
        align: "center",
      });
  } else if (coverImageUrl != "") {
    await drawImage(doc, coverImageUrl, 0);
    doc
      .fontSize(25)
      .text(title.toUpperCase(), 120, 100)
      .fontSize(22)
      .text(instrument.toUpperCase(), 120, 125);
  } else {
    doc
      .fontSize(25)
      .text(title.toUpperCase(), 120, 100)
      .fontSize(22)
      .text(instrument.toUpperCase(), 120, 125);
  }

  if (carnivalMode) doc.addPage();
  addIndexPage(doc, opts);

  if (carnivalMode) {
    doc.addPage();
    doc.addPage();
    doc.addPage();
    doc.addPage();
    doc.addPage();
    await drawImage(doc, "assets/anti_assedio_2024_1.png", 6);
    await drawImage(doc, "assets/anti_assedio_2024_2.png", 8);
    await drawImage(doc, "assets/anti_assedio_2024_3.png", 10);
  }

  const { outline } = doc;
  let promises: Promise<any>[] = [];
  let pageNumber = 0;
  for (const { title, songArrangements } of sections) {
    let topItem = outline.addItem(title.toUpperCase());
    sectionTitleOutlines.set(title, topItem);

    promises.push(
      ...songArrangements.map((song) => {
        pageNumber++;
        return addSongPage(doc, song, pageNumber, title, opts);
      })
    );
  }
  const nonNullPromises = promises.filter((promise) => promise !== null);
  if (nonNullPromises.length > 0) {
    await Promise.all(nonNullPromises);
    download(doc, createFileName(opts));
  }
};

let sectionTitleOutlines = new Map();

const a = document.createElement("a");
document.body.appendChild(a);

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

const drawSvg = async (
  doc: any,
  url: string,
  page: number,
  carnivalMode: boolean
) => {
  try {
    const resp = await fetch(url);
    const svg = await resp.text();
    let pdfPage = carnivalMode ? 2 * page + 10 : page + 1;
    console.log(pdfPage);
    doc.switchToPage(pdfPage);
    const width = 17.17 * cm2pt;
    const height = 9.82 * cm2pt;
    SVGtoPDF(doc, svg, 0.44 * cm2pt, 2.55 * cm2pt, {
      width: width,
      height: height,
      preserveAspectRatio: `${width}x${height}`,
    });
  } catch (e) {
    console.error(e);
  }
};

const loadImage = (url: string) => {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      // resolve(img)
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.height = img.naturalHeight;
      canvas.width = img.naturalWidth;
      ctx?.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL();
      resolve(dataUrl);
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image's URL: ${url}`));
    };
    img.src = url;
  });
};

const drawImage = (doc: any, imageUrl: any, pageNumber: number) => {
  return loadImage(imageUrl)
    .then((img: any) => {
      doc.switchToPage(pageNumber);
      doc.image(img, 0, 0, {
        fit: [pageWidth, pageHeight],
        align: "center",
        valign: "center",
      });
    })
    .catch((error) => {
      console.log(error);
    });
};

const createDoc = () => {
  return new window.PDFDocument({
    layout: "landscape",
    size: [pageHeight, pageWidth],
    bufferPages: true,
    margin: 0,
  });
};

const addSongPage = async (
  doc: any,
  { song, arrangement }: SongArrangement,
  page: number,
  sectionTitle: string,
  { instrument, backSheetPageNumber, carnivalMode }: CreateSongBookOptions
) => {
  if (backSheetPageNumber) {
    doc.addPage();
    drawImage(doc,'assets/patrocinio_verso.png',2 * page + 9);
    let fontSize = 9 * cm2pt
    if (page >= 100){
      fontSize = 5 * cm2pt
    } else if ( page >= 10) {
      fontSize = 8 * cm2pt
    }
    doc
      .font("Helvetica-Bold")
      .fontSize(fontSize)
      .text(page, 7.5 * cm2pt, 1.14 * cm2pt, {
        align: "center",
        width: 10.5 * cm2pt,
        height: fontSize,
      }); // Número do verso
    doc
      .font("Helvetica")
      .fontSize(1 * cm2pt)
      .text(song.title.toUpperCase(), 8.2 * cm2pt, 9.14 * cm2pt, {
        align: "center",
        width: 9.5 * cm2pt,
        height: 9 * cm2pt
      }); // Título do verso
  }
  doc.addPage();
  sectionTitleOutlines.get(sectionTitle).addItem(song.title.toUpperCase());
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
    .fontSize(9)
    .fillColor("white")
    .text(song.sub.toUpperCase(), 0.5 * cm2pt, 2.21 * cm2pt); // Trecho da letra
  doc.text(song.composer.toUpperCase(), 0.44 * cm2pt, 2.21 * cm2pt, {
    align: "right",
    width: 17.1 * cm2pt,
  }); // Compositor
  doc.rect(0.44 * cm2pt, 2.55 * cm2pt, 17.17 * cm2pt, 9.82 * cm2pt).stroke(); // Retângulo da partitura
  doc
    .fontSize(9)
    .fillColor("black")
    .text(instrument.toUpperCase(), 0.44 * cm2pt, 12.5 * cm2pt); // Nome do instrumento
  doc
    .fontSize(1.2*cm2pt)
    .text(
      `${page}`,
      0.44 * cm2pt,
      0.93 * cm2pt,
      {
        align: "right",
        width: 17.1 * cm2pt,
      }
    ); // Número topo página

  doc
    .fontSize(9)
    .text(
      `${sectionTitle.toUpperCase()}   ${page}`,
      0.44 * cm2pt,
      12.5 * cm2pt,
      {
        align: "right",
        width: 17.1 * cm2pt,
      }
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
  return drawSvg(doc, `/collection/${svgUrl}`, page, carnivalMode);
};

const createFileName = ({ title, instrument }: CreateSongBookOptions) => {
  return `${title.replace(/[ -]/g, "_")}_${instrument}.pdf`;
};

const addIndexPage = (
  doc: any,
  { sections, carnivalMode }: CreateSongBookOptions
) => {
  const totalSongCount = sections.reduce(
    (acc, { songArrangements }) => acc + songArrangements.length,
    0
  );
  const sectionCount = sections.length;
  const containerWidth = 17.17 * cm2pt;
  const containerHeight = 11 * cm2pt;
  let totalLineCount = carnivalMode ? 76 : totalSongCount + sectionCount * 2;

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
    Math.floor(containerHeight / maxLinesPerColumn) - 2,
    15
  );
  const columnWidth = Math.ceil(containerWidth / columnCount);

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
  };
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
  doc.addPage();
  // .fontSize(25)
  // .font("Helvetica-Bold")
  // .text("ÍNDICE", currentX + 0.3 * cm2pt, 1.2 * cm2pt);
  sections.forEach(({ title, songArrangements }, styleIdx) => {
    if (carnivalMode) {
      if (
        firstPage &&
        songCount + (styleIdx + 1) * 2 + songArrangements.length + 2 >
          totalLineCount
      ) {
        firstPage = false;
        resetCursorPosition();
        [currentX, currentY] = nextCursorPosition();
        doc.addPage().addPage();
      }
    }

    songArrangements.forEach((songArrangement, songIdx) => {
      reorderedSongs.push(songArrangement);
      if (songIdx == 0) {
        if (currentLine == maxLinesPerColumn)
          [currentX, currentY] = nextCursorPosition();
        doc
          .font("Helvetica-Bold")
          .fontSize(fontSize - 2)
          .text(`${title.toUpperCase()}`, currentX + 0.3 * cm2pt, currentY); // Título do estílo
        [currentX, currentY] = nextCursorPosition();
      }
      doc
        .font("Helvetica-Bold")
        .fontSize(fontSize - 2)
        .text(1 + songCount++, currentX - 0.5 * cm2pt, currentY, {
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
            width: columnWidth - 0.3 * cm2pt,
            height: fontSize,
            lineBreak: false,
          }
        );
      [currentX, currentY] = nextCursorPosition();
    });
    if (currentLine != 0) [currentX, currentY] = nextCursorPosition();
  });
  if (carnivalMode) doc.addPage();
  return reorderedSongs;
};
