import { Button } from "react-bootstrap";
import { CanvasGenerator } from "./CanvasGenerator"
// Needed for calling PDFDocument from window variable
declare const window: any;

const options = {}
const cg = CanvasGenerator(options)


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
