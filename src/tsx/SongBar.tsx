import { ToastContainer, Toast } from 'react-bootstrap';
import '../css/SongBar.css';

import RangeSlider from 'react-bootstrap-range-slider';
import { BsFillPauseCircleFill, BsPlayCircleFill, BsStopCircleFill } from "react-icons/bs";
import { Song } from '../types';

interface SongBarProps {
  song: Song | undefined;
}

const SongBar = ({ song } : SongBarProps) => {
  const handlePlay = () => {
    // @ts-ignore
    Player.play();
  }

  const handlePause = () => {
    // @ts-ignore
    Player.pause();
  }

  const handleStop = () => {
    // @ts-ignore
    Player.stop();
  }

  return (
    <div
      id="play-bar-container"
      className="bar-container"
    >
      <ToastContainer
        className="p-3"
        position={'bottom-center'}
        style={{ zIndex: 1 }}
      >
        <Toast>
          <Toast.Header>
            {song && <>
              <strong className="me-auto">{song.title}</strong>
              <small>{song.arrangements[0].name}</small>
            </>}
          </Toast.Header>
          <Toast.Body className="song">
            <RangeSlider className="slider" id="play-track" value={0} tooltip='off' />
            <BsPlayCircleFill className="play-icon" size={18} onClick={handlePlay} />
            <BsFillPauseCircleFill className="pause-icon" size={18} onClick={handlePause} />
            <BsStopCircleFill className="stop-icon" size={18} onClick={handleStop} />
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}

export { SongBar }
