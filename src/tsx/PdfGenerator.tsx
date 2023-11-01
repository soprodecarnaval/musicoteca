import { Button } from "react-bootstrap";
import SVGtoPDF from "svg-to-pdfkit";
import { Song, Instrument } from '../types';

// Needed for calling PDFDocument from window variable
declare const window: any;

// TODO: Remove static file and integrate with UI
// import songbook from './songs-example.json';

interface PdfGeneratorProps {
    songs: Song[],
    title: string
}

enum Instruments {
    FLUTE = "FLAUTA",
    TROMBONE = "BONE",
    TRUMPET = "PETE",
    ALTO_SAX = "SAX_ALTO",
    TENOR_SAX = "SAX_TENOR"
}

const instruments : Instrument[] = [ 
    "bombardino",
    "clarinete",
    "flauta",
    "sax alto",
    "sax soprano",
    "sax tenor",
    "trombone",
    "trombone pirata",
    "trompete",
    "trompete pirata",
    "tuba"
]
const documentOptions = { layout: "landscape", size: 'A5', bufferPages: true, margin: 0 }

const a = document.createElement("a");
document.body.appendChild(a);

const PDFGenerator = ({songs, title} : PdfGeneratorProps) => {
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

    const drawSvg = (doc : any, url: string, page : number) => {
        return fetch(url).
        then(r => r.text()).
        then(svg => {
            doc.switchToPage(page)
            let width = 550
            let height = 400
            SVGtoPDF(doc,svg,20,30,{
                width: width,
                height: height,
                preserveAspectRatio: `${width}x${height}`
            })
        })
        .catch(console.error.bind(console));
    }

    const loadImage = (url: string) => {
        return new Promise((resolve, reject) => {
            let img = new Image()
            img.crossOrigin = "Anonymous"

            img.onload = () => {
                // resolve(img)
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.height = 2409;
                canvas.width = 4208;
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

    const drawImage = (doc : any, img_url : string, page: number) => {
        return loadImage(img_url).then((img: any) => {
            doc.switchToPage(page)
            doc.image(img, 50, 100, {
                width: 500,
                height: 300
            });
        }).catch((error)=>{console.log(error)})   
    }

    const createDoc = () => {
        return new window.PDFDocument(documentOptions);
    }

    const createMusicSheet = (doc: any, instrument : string, song: Song, page : number) => {
        doc.addPage()
        doc.fontSize(20).text(song.title, 40, 35) // Título
        doc.fontSize(18).text(song.composer, 45, 55) // Compositor
        doc.fontSize(15).text(page, 550, 380) // Número de página
        // TODO: Pensar em quando tiver mais de um arranjo
        let svgUrl = song.arrangements[0].parts
                        .filter((part)=> part.instrument == instrument)[0]
                        .files
                        .filter((file) => file.extension == "svg")[0]
                        .url
        
        return drawSvg(doc,svgUrl,page)
        
    }

    const createFileName = (title: string, instrument: string) => {
        return `${title.replace(/[ -]/g, "_")}_${instrument}.pdf`
    }

    const createSongBook = async (instrument: Instrument) => {
        const doc = createDoc()
        doc.fontSize(25).text(title, 120, 100);
        doc.fontSize(22).text(instrument, 120, 125);
        let promises = songs.map((song, songIdx) => {
            return createMusicSheet(doc, instrument, song,songIdx+1).catch(()=>null)
        })
        
        await Promise.all(promises)
        download(doc, createFileName(title,instrument))
    }

    const generatePdf = () => {
        let songbooks: any[] = instruments.map(createSongBook)
        Promise.all(songbooks).then(()=>{console.log("Terminei")})
    }

    return (
        <Button onClick={generatePdf}>Gerar PDF</Button>
    )
}

export { PDFGenerator }


