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

const toJpg = (canvas : any) => {
    return new Promise(function (resolve, reject) {
      canvas.toBlob((blob: any) => {
        try{
          blob.name = canvas.filename
          resolve(blob)
        }catch(e){
          reject(e)
        }
      }, 'image/jpeg', canvas.quality);
    })
  }

const loadImage = (url: string) => {
    return new Promise((resolve, reject) => {
        let img = new Image()
        img.crossOrigin = "Anonymous"

        img.onload = () => {
            let canvas = document.createElement('canvas')
			let ctx = canvas.getContext('2d')
            ctx?.drawImage(img,0,0)
            resolve(img)
        }

        img.onerror = () => {
            reject(new Error(`Failed to load image's URL: ${url}`))
        }
        img.src = url
    })
}

const drawImage = (doc : any, img_url : string) => {
    return loadImage(img_url).then((img) => {
            doc.image(img,900,50,{width:500})
        }
    )
}

const createDoc = () => {
    return new window.PDFDocument({ layout: "landscape", size: 'A5' });
}

const addPage = (doc: any) => {
    doc.addPage({ layout: "landscape", size: 'A5' })
}
const createMusicSheet = (doc: any, instrument : string, song: { title: string, composer: string, sub: string, file_path: string }) => {
    doc.fontSize(20).text(song.title, 800, 50);
    let img_url = `${song.file_path}${instrument}-1.png`
    return drawImage(doc,img_url)
    
}

const createFileName = (title: string) => {
    return `${title.replace(/[ -]/g, "_")}.pdf`
}

const createSongBook = (instrument: Instruments) => {
    const doc = createDoc()
    doc.fontSize(25).text(songbook.title, 120, 100);
    doc.fontSize(22).text(instrument, 120, 125);
    let promises: any[] = []
    for (let i = 0; i < songbook.arrangements.length; i++) {
        const song = songbook.arrangements[i];
        addPage(doc)
        promises = promises.concat(createMusicSheet(doc, instrument, song))
    }
    return Promise.all(promises).then(() => {
        download(doc, createFileName(songbook.title))
    })
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


