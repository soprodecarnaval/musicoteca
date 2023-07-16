import { Modal, Image } from 'react-bootstrap';

import { Part } from '../types';

import '../css/PreviewModal.css'

interface PreviewModalProps {
  show: boolean
  handleShow: (show: boolean) => void
  part: Part
}

const PreviewModal = ({ show, handleShow, part } : PreviewModalProps) => {
  const handleClose = () => handleShow(false);

  return (
    <Modal
      show={show}
      onHide={handleClose}
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>{part.instrument}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Image src={part.files[0].url} />
      </Modal.Body>
    </Modal>
  );
}

export { PreviewModal };
