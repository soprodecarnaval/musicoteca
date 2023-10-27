import { Modal, Image, Carousel } from "react-bootstrap";
import { useState } from "react";
import { Part, File } from "../types";

import "../css/PreviewModal.css";

interface PreviewModalProps {
  show: boolean;
  handleShow: (show: boolean) => void;
  part: Part;
}

interface FilesCarouselProps {
  files: File[];
}

const FilesCarousel = ({ files }: FilesCarouselProps) => {
  const [index, setIndex] = useState(0);

  const handleSelect = (selectedIndex: number) => {
    setIndex(selectedIndex);
  };

  return (
    <Carousel activeIndex={index} onSelect={handleSelect}>
      {files.map((file) => (
        <Carousel.Item key={file.url}>
          <Image src={`/collection/${file.url}`} />
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

const PreviewModal = ({ show, handleShow, part }: PreviewModalProps) => {
  const handleClose = () => handleShow(false);
  return (
    <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>{part.instrument}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <FilesCarousel files={part.files} />
      </Modal.Body>
    </Modal>
  );
};

export { PreviewModal };
