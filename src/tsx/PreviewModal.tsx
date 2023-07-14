import Modal from 'react-bootstrap/Modal';
import Image from 'react-bootstrap/Image';

import '../css/PreviewModal.css'

const PreviewModal = ({ show, handleShow, part }) => {
  const handleClose = () => handleShow(false);

  return (
    <>
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
    </>
  );
}

export { PreviewModal };
