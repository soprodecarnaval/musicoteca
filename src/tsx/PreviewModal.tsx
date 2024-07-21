import { Modal, Image, Carousel } from "react-bootstrap";
import { useEffect, useState } from "react";
import { Part, Asset } from "../../types";

import "../css/PreviewModal.css";
import RangeSlider from "react-bootstrap-range-slider";
import { BsFillPauseCircleFill, BsPlayCircleFill } from "react-icons/bs";

interface PreviewModalProps {
  show: boolean;
  handleShow: (show: boolean) => void;
  part: Part;
}

interface FilesCarouselProps {
  files: Asset[];
}

const FilesCarousel = ({ files }: FilesCarouselProps) => {
  const [index, setIndex] = useState(0);

  const handleSelect = (selectedIndex: number) => {
    setIndex(selectedIndex);
  };
  return (
    <Carousel activeIndex={index} onSelect={handleSelect}>
      {files.map((file) => (
        <Carousel.Item key={file.path}>
          <Image src={`/collection/${file.path}`} />
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

const PreviewModal = ({ show, handleShow, part }: PreviewModalProps) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    // @ts-ignore
    removeToastPlayer();
  });

  const handleClose = () => {
    handleShow(false);
    // @ts-ignore
    Player.stop();
  };

  const handlePlay = () => {
    // @ts-ignore
    playSong(
      part.name,
      `collection/${part.assets[0].path.replace("svg", "midi")}`,
      "-preview"
    );
  };

  const handlePause = () => {
    // @ts-ignore
    Player.pause();
  };

  const handleChange = (event: any) => {
    setValue(event.currentTarget.valueAsNumber);
    // @ts-ignore
    Player.skipToPercent(event.currentTarget.valueAsNumber);
    // @ts-ignore
    Player.play();
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>{part.instrument}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <RangeSlider
          className="slider"
          id="play-track-preview"
          value={value}
          tooltip="off"
          onChange={handleChange}
        />
        <BsPlayCircleFill
          className="play-icon"
          size={18}
          onClick={handlePlay}
        />
        <BsFillPauseCircleFill
          className="pause-icon"
          size={18}
          onClick={handlePause}
        />
        <small id="song-time-preview"></small>
        <FilesCarousel files={part.assets} />
      </Modal.Body>
    </Modal>
  );
};

export { PreviewModal };
