import SVGtoPDF from "svg-to-pdfkit";
import { Instrument, Score } from "../types";
import { Section } from "./tsx/PdfGenerator";

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
  sections: Section[];
  coverImageUrl: string;
  backSheetPageNumber: boolean;
  carnivalMode: boolean;
}

export const createSongBook = async (opts: CreateSongBookOptions) => {
  const doc = createDoc();
  await loadFonts(doc);

  const { title, instrument, sections, coverImageUrl, carnivalMode } = opts;
  let pageNumber = 0;
  let promises: Promise<any>[] = [];

  if (carnivalMode) {
    promises.push(
      drawImage(
        doc,
        `assets/capa_carnaval_2025_${instrument.replace(/[ ]/g, "_")}.png`,
        pageNumber
      )
    );

    // doc
    //   .font("Roboto-Medium")
    //   .fontSize(14)
    //   // .rect(142, 213, 220, 15)
    //   // .fill("red")
    //   .text(instrument.toUpperCase(), 142, 203, {
    //     width: 220,
    //     align: "center",
    //   });

    doc.addPage();
    pageNumber++;
  } else if (coverImageUrl != "") {
    promises.push(drawImage(doc, coverImageUrl, 0));
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

  pageNumber += addIndexPage(doc, opts);

  if (carnivalMode) {
    doc.addPage();
    pageNumber++;
    promises.push(drawImage(doc, "assets/anti_assedio_2025_1.png", pageNumber));

    doc.addPage();
    pageNumber++;

    doc.addPage();
    pageNumber++;
    promises.push(drawImage(doc, "assets/anti_assedio_2025_2.png", pageNumber));

    doc.addPage();
    pageNumber++;

    doc.addPage();
    pageNumber++;
    promises.push(drawImage(doc, "assets/anti_assedio_2025_3.png", pageNumber));

    doc.addPage();
    pageNumber++;

    doc.addPage();
    pageNumber++;
    promises.push(drawImage(doc, "assets/anti_assedio_2025_4.png", pageNumber));

    // doc.addPage();
    // pageNumber++;
  }

  const { outline } = doc;

  let songPageIndex = 1;
  for (const { title, songs } of sections) {
    let topItem = outline.addItem(title.toUpperCase());
    sectionTitleOutlines.set(title, topItem);

    for (const song of songs) {
      // Check if this song has a part for the current instrument
      const hasInstrument = song.parts?.some((p) => p.instrument === instrument);
      
      if (hasInstrument) {
        // Add physical page only if the song has the instrument
        const [pageCount, addSongPagePromises] = await addSongPage(
          doc,
          song,
          pageNumber,
          songPageIndex,
          title,
          opts
        );
        pageNumber += pageCount;
        promises.push(...addSongPagePromises);
      }
      // Always advance the index number for consistent numbering
      songPageIndex++;
    }
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

const drawSvg = async (doc: any, url: string, page: number): Promise<void> => {
  try {
    const resp = await fetch(url);
    const svg = await resp.text();
    doc.switchToPage(page);
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

const drawImage = (
  doc: any,
  imageUrl: any,
  pageNumber: number
): Promise<void> => {
  return loadImage(imageUrl).then((img: any) => {
    doc.switchToPage(pageNumber);
    doc.image(img, 0, 0, {
      fit: [pageWidth, pageHeight],
      align: "center",
      valign: "center",
    });
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

const loadFonts = async (doc: any) => {
  const fonts = ["Roboto-Medium", "Roboto-Bold"];
  for (const font of fonts) {
    const resp = await fetch(`${font}.ttf`);
    const buffer = await resp.arrayBuffer();
    doc.registerFont(font, buffer);
  }
};

const addSongPage = async (
  doc: any,
  song: Score,
  currentPage: number,
  songPageIndex: number,
  sectionTitle: string,
  { instrument, backSheetPageNumber }: CreateSongBookOptions
): Promise<[number, Promise<void>[]]> => {
  const initialPage = currentPage;
  const promises: Promise<void>[] = [];

  // Guard: skip if the song has no part for this instrument
  const partForInstrument = song.parts?.find((part) => part.instrument === instrument);
  if (!partForInstrument) {
    console.log(`Skipping ${song.title} for ${instrument}: no part available.`);
    return [0, promises];
  }

  if (backSheetPageNumber) {
    const fontSize = 9 * cm2pt;
    const titleSpacing = 6 * cm2pt;
    const numberSpacing = 0;

    doc.addPage();
    currentPage++;

    // await drawImage(doc, `assets/patrocinio-2025.png`, currentPage);

    doc
      .font("Roboto-Bold")
      .fontSize(fontSize)
      .text(songPageIndex, 1 * cm2pt, 0.5 * cm2pt + numberSpacing, {
        align: "center",
        width: 16 * cm2pt,
        height: fontSize,
      }); // Número do verso
    doc
      .font("Roboto-Medium")
      .fontSize(1 * cm2pt)
      .text(song.title.toUpperCase(), 1 * cm2pt, 4 * cm2pt + titleSpacing, {
        align: "center",
        width: 16 * cm2pt,
        height: 9 * cm2pt,
      }); // Título do verso
  }

  doc.addPage();
  currentPage++;

  sectionTitleOutlines.get(sectionTitle).addItem(song.title.toUpperCase());
  doc.addNamedDestination(song.id);
  doc
    .font("Roboto-Bold")
    .fontSize(22)
    .text(song.title.toUpperCase(), 0.39 * cm2pt, 1.2 * cm2pt, {}); // Título x: 0.44*cm2pt, y: 10*cm2pt,
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
    .fontSize(1.2 * cm2pt)
    .text(`${songPageIndex}`, 0.44 * cm2pt, 0.93 * cm2pt, {
      align: "right",
      width: 17.1 * cm2pt,
    }); // Número topo página
  doc
    .font("Roboto-Medium")
    .fontSize(9)
    .text(song.title.toUpperCase(), 0, 12.5 * cm2pt, {
      align: "center",
    }); // Título pequeno no centro da página abaixo da partitura

  doc
    .fontSize(9)
    .text(
      `${sectionTitle.toUpperCase()}   ${songPageIndex}`,
      0.44 * cm2pt,
      12.5 * cm2pt,
      {
        align: "right",
        width: 17.1 * cm2pt,
      }
    ); // Estilo + Número

  // Use the discovered part for the instrument safely
  const svgUrl = partForInstrument.svg;
  promises.push(drawSvg(doc, `/collection/${svgUrl}`, currentPage));

  return [currentPage - initialPage, promises];
};

const createFileName = ({ title, instrument }: CreateSongBookOptions) => {
  return `${title.replace(/[ -]/g, "_")}_${instrument}.pdf`;
};

const addIndexPage = (
  doc: any,
  { sections, carnivalMode, instrument }: CreateSongBookOptions
): number => {
  let pageCount = 0;

  const totalSongCount = sections.reduce(
    (acc, { songs }) => acc + songs.length,
    0
  );
  const sectionCount = sections.length;
  const containerWidth = 17.17 * cm2pt;
  const containerHeight = 13 * cm2pt;
  let totalLineCount = totalSongCount + sectionCount * 2;

  let columnCount = 1;
  if (totalLineCount > 80) {
    columnCount = 4;
  } else if (totalLineCount > 50) {
    columnCount = 3;
  } else if (totalLineCount > 20) {
    columnCount = 2;
  }

  let maxLinesPerColumn = Math.floor(totalLineCount / columnCount) + 2;
  let fontSize = Math.min(
    Math.floor(containerHeight / maxLinesPerColumn) - 3,
    15
  );
  let columnWidth = Math.ceil(containerWidth / columnCount);

  console.log(
    `containerWidth: ${containerWidth}\n containerHeight: ${containerHeight}\n totalLineCount: ${totalLineCount}\n columnCount: ${columnCount}\n maxLinexPerColumn: ${maxLinesPerColumn}\n fontSize: ${fontSize}\n columnWidth: ${columnWidth}\n`
  );

  if (carnivalMode) {
    totalLineCount = 90;
    columnCount = 3;
    maxLinesPerColumn = 31;
    fontSize = 9;
    columnWidth = 163;
  }

  let cursorStartPosition = [1.44 * cm2pt, 1.55 * cm2pt];
  let currentColumn = 0;
  let currentLine = 0;
  let itemCount = 0;
  let songCount = 0;
  let firstPage = true;
  const resetCursorPosition = () => {
    cursorStartPosition = [1.44 * cm2pt, 1.55 * cm2pt];
    currentColumn = 0;
    currentLine = 0;
    itemCount = 0;
  };
  const nextCursorPosition = () => {
    if (itemCount == 0) {
      itemCount++;
      return cursorStartPosition;
    }
    currentColumn = Math.ceil((itemCount + 1) / (maxLinesPerColumn + 1)) - 1; //Math.max(Math.ceil((itemCount+1)/maxLinesPerColumn),1)
    currentLine = itemCount % (maxLinesPerColumn + 1); //Math.max((itemCount+1)%(maxLinesPerColumn+1),1)
    itemCount++;
    return [
      cursorStartPosition[0] + currentColumn * columnWidth + 1,
      cursorStartPosition[1] + currentLine * fontSize,
    ];
  };
  let [currentX, currentY] = nextCursorPosition();
  let reorderedSongs: Score[] = [];

  doc.addPage();
  pageCount++;

  // .fontSize(25)
  // .font("Roboto-Bold")
  // .text("ÍNDICE", currentX + 0.3 * cm2pt, 1.2 * cm2pt);
  
  sections.forEach(({ title, songs }, styleIdx) => {
    if (carnivalMode) {
      if (
        firstPage &&
        songCount + (styleIdx + 1) * 2 + songs.length + 2 > totalLineCount
      ) {
        firstPage = false;
        resetCursorPosition();
        [currentX, currentY] = nextCursorPosition();
        doc.addPage().addPage();
        pageCount += 2;
      }

      // gambiarra do carnaval 2025, força a quebra de coluna no índice para frevo e odara
      if (
        title.toLocaleLowerCase() == "frevo" ||
        title.toLocaleLowerCase() == "pagode"
      ) {
        itemCount = 2 * (maxLinesPerColumn + 1);
        [currentX, currentY] = nextCursorPosition();
      } else if (title.toLocaleLowerCase() == "moments") {
        itemCount = maxLinesPerColumn + 1;
        [currentX, currentY] = nextCursorPosition();
      }
    }

    songs.forEach((song, songIdx) => {
      reorderedSongs.push(song);
      if (songIdx == 0) {
        if (currentLine == maxLinesPerColumn)
          [currentX, currentY] = nextCursorPosition();
        doc
          .font("Roboto-Bold")
          .fontSize(fontSize - 2)
          .text(`${title.toUpperCase()}`, currentX + 0.3 * cm2pt, currentY);
        [currentX, currentY] = nextCursorPosition();
      }
      
      // Check if this song has a part for the current instrument
      const hasInstrument = song.parts?.some((p) => p.instrument === instrument);
      
      // Display song with consistent page number
      doc
        .font("Roboto-Bold")
        .fontSize(fontSize - 2)
        .text(1 + songCount++, currentX - 0.5 * cm2pt, currentY, {
          align: "right",
          width: 0.6 * cm2pt,
          goTo: hasInstrument ? song.id : undefined,
        });
      
      if (hasInstrument) {
        // Song is available - normal display
        doc
          .font("Roboto-Medium")
          .fillColor("black")
          .text(`${song.title.toUpperCase()}`, currentX + 0.3 * cm2pt, currentY, {
            goTo: song.id,
            width: columnWidth - 0.3 * cm2pt,
            height: fontSize,
            lineBreak: false,
          });
      } else {
        // Song is not available - show with strikethrough in gray color
        doc
          .font("Roboto-Medium")
          .fillColor("gray")
          .text(`${song.title.toUpperCase()}`, currentX + 0.3 * cm2pt, currentY, {
            width: columnWidth - 0.3 * cm2pt,
            height: fontSize,
            lineBreak: false,
            strike: true, // Strikethrough
          })
          .fillColor("black"); // Reset color for next items
      }
      
      [currentX, currentY] = nextCursorPosition();
    });
    if (currentLine != 0) [currentX, currentY] = nextCursorPosition();
  });
  if (carnivalMode) {
    doc.addPage();
    pageCount++;
  }

  return pageCount;
};
