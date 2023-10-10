import { Button } from "react-bootstrap";

// Needed for calling PDFDocument from window variable
declare const window: any;
import SVGtoPDF from 'svg-to-pdfkit';

window.PDFDocument.prototype.addSVG = function(svg_path: any, instrument : any, x: any, y: any, options: any) {
    return SVGtoPDF(this, require(`${svg_path}${instrument}-1.svg`) as string, x, y, options), this;
};

import songbook from './songs-example.json';

enum Instruments {
    FLUTE = "FLAUTA",
    TROMBONE = "BONE",
    TRUMPET = "PETE",
    ALTO_SAX = "SAX_ALTO",
    TENOR_SAX = "SAX_TENOR"
}

const a = document.createElement("a");
document.body.appendChild(a);

const download = (doc: any, file_name: string) => {
    const stream = doc.pipe(window.blobStream());
    stream.on('finish', function () {
        const url = stream.toBlobURL('application/pdf');
        a.href = url;
        a.download = file_name;
        a.click();
        window.URL.revokeObjectURL(url);
    });
    doc.end()
}

const createDoc = () => {
    return new window.PDFDocument({ layout: "landscape", size: 'A5' });
}

const addPage = (doc: any) => {
    doc.addPage({ layout: "landscape", size: 'A5' })
}

const createMusicSheet = (doc: any, instrument : string, song: { title: string, composer: string, sub: string, file_path: string }) => {
    doc.fontSize(20).text(song.title, 800, 50);
    doc.addSVG(song.file_path,instrument,120,600)
}

const createFileName = (title: string) => {
    return `${title.replace(/[ -]/g, "_")}.pdf`
}

const createSongBook = (instrument: Instruments) => {
    const doc = createDoc()
    doc.fontSize(25).text(songbook.title, 120, 100);
    doc.fontSize(22).text(instrument, 120, 125);
    for (let i = 0; i < songbook.arrangements.length; i++) {
        const song = songbook.arrangements[i];
        addPage(doc)
        createMusicSheet(doc, instrument, song)
    }
    download(doc, createFileName(songbook.title))
}

const PDFGenerator = () => {

    const generatePdf = () => {
        createSongBook(Instruments.TRUMPET)
    }

    return (
        <Button onClick={generatePdf}>Gerar PDF</Button>
    )
}

export { PDFGenerator }
