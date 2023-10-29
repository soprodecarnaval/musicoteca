import { Button } from "react-bootstrap";
import * as d3 from "d3";
import SVGtoPDF, * as svgToPdf from "svg-to-pdfkit";
// Needed for calling PDFDocument from window variable
declare const window: any;

// TODO: Remove static file and integrate with UI
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

const parseHTML = (html:string) => {
    let doc = document.implementation.createHTMLDocument("");
    doc.write(html);

    // You must manually set the xmlns if you intend to immediately serialize
    // the HTML document to a string as opposed to appending it to a
    // <foreignObject> in the DOM
    // doc.documentElement.setAttribute("xmlns", doc.documentElement.namespaceURI);

    // Get well-formed markup
    return (new XMLSerializer).serializeToString(doc.body);
}

const drawSvg = (doc : any, url: string, page : number) => {
    return fetch(url).
    then(r => r.text()).
    then(svg => {
        doc.switchToPage(page)
        let width = 500
        let height = 300
        SVGtoPDF(doc,svg,50,100,{
            width: width,
            height: height,
            preserveAspectRatio: `${width}x${height}`,
        })
        // let serializer = new XMLSerializer()
        // let div = document.createElement('div')
        // let svg_html = d3.select(div).html(svg).select('svg')
        // let svg_url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(serializer.serializeToString(svg_html.node()));
        // let img = document.createElement('img')
        // img.onload = (e) => {
        //     let canvas = document.createElement('canvas');
        //     let ctx = canvas.getContext('2d');
        //     canvas.height = 2409;
        //     canvas.width = 4208;
        //     ctx?.drawImage(img, 0, 0);
        //     let dataUrl = canvas.toDataURL();

        //     doc.switchToPage(page)
        //     doc.image(dataUrl, 50, 100, {
        //         width: 500,
        //         height: 300
        //       });
        //     URL.revokeObjectURL(svg_url);
        // }

        // img.onerror = () => {
        //     console.log(`Erro ao desenhar svg`)
        // }

        // img.src = svg_url
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

const createMusicSheet = (doc: any, instrument : string, song: { title: string, composer: string, sub: string, file_path: string }, page : number) => {
    doc.addPage()
    doc.fontSize(20).text(song.title, 50, 30);
    let svg_url = `${song.file_path}${instrument}-1.svg`
    return drawSvg(doc,svg_url,page)
    // let img_url = `${song.file_path}${instrument}-1.png`
    // return drawImage(doc,img_url,page)
    
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


