import { Button } from "react-bootstrap";
//import blobStream from 'blob-stream';

declare const window: any;

const doc = new window.PDFDocument();

const stream = doc.pipe(window.blobStream());
console.log(stream)
stream.on('finish', function() {
    // get a blob you can do whatever you like with
    const url = stream.toBlobURL('application/pdf');
    return fetch(url)
});

const PDFGenerator = () => {
    const test = () => {
        alert('cheguei')
       doc.end()
    }

    return (
        <Button onClick={test}>Gerar PDF</Button>
    )
}

export { PDFGenerator }
