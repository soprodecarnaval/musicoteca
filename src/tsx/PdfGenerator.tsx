import { Button } from "react-bootstrap";
// import { CanvasGenerator } from "./CanvasGenerator"
// Needed for calling PDFDocument from window variable
declare const window: any;

// const options = {}
// const dpi = 300
// const a5size = { width: 14.85 * (dpi / 2.54), height: 21 * (dpi / 2.54) }
// const cg = CanvasGenerator(options)


import songbook from './songs-example.json';

enum Instruments {
    FLUTE = "FLAUTA",
    TROMBONE = "BONE",
    TRUMPET = "PETE",
    ALTO_SAX = "SAX_ALTO",
    TENOR_SAX = "SAX_TENOR"
}

const documentOptions = { layout: "landscape", size: 'A5', bufferPages: true }

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

const createMusicSheet = (doc: any, instrument : string, song: { title: string, composer: string, sub: string, file_path: string }, page : number) => {
    doc.addPage()
    doc.fontSize(20).text(song.title, 50, 30);
    let img_url = `${song.file_path}${instrument}-1.png`
    return drawImage(doc,img_url,page)
    
}

const createFileName = (title: string, instrument: string) => {
    return `${title.replace(/[ -]/g, "_")}_${instrument}.pdf`
}

const createSongBook = (instrument: string) => {
    const doc = createDoc()
    doc.fontSize(25).text(songbook.title, 120, 100);
    doc.fontSize(22).text(instrument, 120, 125);
    let promises: any[] = []
    for (let i = 0; i < songbook.arrangements.length; i++) {
        const song = songbook.arrangements[i];
        promises = promises.concat(createMusicSheet(doc, instrument, song,i+1))
    }
    return Promise.all(promises).then(() => {
        download(doc, createFileName(songbook.title,instrument))
    })
}

const PDFGenerator = () => {

    const generatePdf = () => {
        let songbooks: any[] = []
        Object.values(Instruments).forEach((instrument) => {
            songbooks.push(createSongBook(instrument))
        })
        Promise.all(songbooks).then(()=>{console.log("Terminei")})
    }

    return (
        <Button onClick={generatePdf}>Gerar PDF</Button>
    )
}

export { PDFGenerator }


