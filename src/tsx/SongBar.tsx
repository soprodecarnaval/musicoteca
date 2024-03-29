import { ToastContainer, Toast } from 'react-bootstrap';
import '../css/SongBar.css';

import RangeSlider from 'react-bootstrap-range-slider';
import { BsFillPauseCircleFill, BsPlayCircleFill } from "react-icons/bs";
import { useState } from 'react';

interface SongBarProps {
  info: { songName: string, arrangementName: string, partName: string | undefined };
}

const SongBar = ({ info } : SongBarProps) => {
  const [value, setValue] = useState(0)

  const handlePlay = () => {
    // @ts-ignore
    Player.play();
  }

  const handlePause = () => {
    // @ts-ignore
    Player.pause();
  }

  const handleChange = (event : any) => {
    setValue(event.currentTarget.valueAsNumber)
    // @ts-ignore
    Player.skipToPercent(event.currentTarget.valueAsNumber)
    // @ts-ignore
    Player.play()
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
            {Object.keys(info).length > 0 && <>
              <strong className="me-auto">{info.songName} | {info.partName}</strong>
              <small>{info.arrangementName}</small>
            </>}
          </Toast.Header>
          <Toast.Body className="song">
            <RangeSlider className="slider" id="play-track" value={value} tooltip='off' onChange={handleChange} />
            <BsPlayCircleFill className="play-icon" size={18} onClick={handlePlay} />
            <BsFillPauseCircleFill className="pause-icon" size={18} onClick={handlePause} />
            <small id="song-time"></small>
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}

export { SongBar }
