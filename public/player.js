var MidiPlayer = MidiPlayer;
var loadFile, loadDataUri, Player;
var AudioContext = window.AudioContext || window.webkitAudioContext || false; 
var ac = new AudioContext || new webkitAudioContext;

var changeTempo = function(tempo) {
  Player.tempo = tempo;
}

async function getFileFromUrl(url, name, defaultType = 'image/jpeg'){
  const response = await fetch(url);
  const data = await response.blob();
  return new File([data], name, {
    type: data.type,
  });
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  const t = [h, m > 9 ? m : h ? '0' + m : m || '0', s > 9 ? s : '0' + s]
    .filter(Boolean)
    .join(':')
  return t
}

const baseUrlInstrument = 'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FatBoy'

const urlInstrument = {
  'sax alto' : `${baseUrlInstrument}/alto_sax-mp3.js`,
  'sax tenor' : `${baseUrlInstrument}/tenor_sax-mp3.js`,
  'flauta' : `${baseUrlInstrument}/flute-mp3.js`,
  'trombone' : `${baseUrlInstrument}/trombone-mp3.js`,
  'trompete' : `${baseUrlInstrument}/trumpet-mp3.js`,
  'tuba': `${baseUrlInstrument}/tuba-mp3.js`,
}

const instrumentObj = {
  'sax alto' : null,
  'sax tenor' : null,
  'flauta' : null,
  'trombone' : null,
  'trompete' : null,
  'tuba': null,
}

const playSong = async (instrument, url, suffixId) => {
  if (Player) Player.stop()

  const file = await getFileFromUrl(url, instrument);

  var reader = new FileReader();
  if (file) reader.readAsArrayBuffer(file);

  reader.addEventListener('load', function () {
    Player = new MidiPlayer.Player(function(event) {
      if (event.name == 'Note on') {
        instrumentObj[instrument].play(event.noteName, ac.currentTime, {gain:event.velocity/100});
      }

      document.getElementById(`song-time${suffixId}`).innerHTML =  formatTime(Player.getSongTime() - Player.getSongTimeRemaining());
      document.getElementsByClassName('btn-close')[0].addEventListener('click', function() {
        Player.stop();
        if (suffixId === '') document.getElementById(`play-bar-container${suffixId}`).style.visibility = 'hidden';
      })
    });

    Player.on('playing', (currentTick) => {
      document.getElementById(`play-track${suffixId}`).value = 100 - Player.getSongPercentRemaining()
    });

    if (suffixId === '') document.getElementById(`play-bar-container${suffixId}`).style.visibility = 'visible';

    document.getElementById(`play-track${suffixId}`).max = Player.getSongTime();
    Player.loadArrayBuffer(reader.result);
    Player.play()
  }, false);
}

const removeToastPlayer = () => {
  if (Player) Player.stop()
  const el = document.getElementById(`play-bar-container`)
  if (el) el.style.visibility = 'hidden';  
}

Soundfont.instrument(ac, urlInstrument['sax alto']).then((instrument) => {
  instrumentObj['sax alto'] = instrument
})
Soundfont.instrument(ac, urlInstrument['sax tenor']).then((instrument) => {
  instrumentObj['sax tenor'] = instrument
})
Soundfont.instrument(ac, urlInstrument['flauta']).then((instrument) => {
  instrumentObj['flauta'] = instrument
})
Soundfont.instrument(ac, urlInstrument['trombone']).then((instrument) => {
  instrumentObj['trombone'] = instrument
})
Soundfont.instrument(ac, urlInstrument['trompete']).then((instrument) => {
  instrumentObj['trompete'] = instrument
})
Soundfont.instrument(ac, urlInstrument['tuba']).then((instrument) => {
  instrumentObj['tuba'] = instrument
})

// Soundfont.instrument(ac, 'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/MusyngKite/xylophone-mp3.js').then(function (instrument) {
//   playSong = async function(instrument, url) {
//     if (Player) Player.stop()

//     const file = await getFileFromUrl(url, 'example-midi');

//     var reader = new FileReader();
//     if (file) reader.readAsArrayBuffer(file);

//     reader.addEventListener('load', function () {
//       Player = new MidiPlayer.Player(function(event) {
//         if (event.name == 'Note on') {
//           instrument.play(event.noteName, ac.currentTime, {gain:event.velocity/100});
//         }

//         document.getElementById('song-time').innerHTML =  formatTime(Player.getSongTime() - Player.getSongTimeRemaining());
//         document.getElementsByClassName('btn-close')[0].addEventListener('click', function() {
//           document.getElementById('play-bar-container').style.visibility = 'hidden';
//           Player.stop();
//         })
//       });

//       Player.on('playing', (currentTick) => {
//         document.getElementById('play-track').value = 100 - Player.getSongPercentRemaining()
//       });

//       document.getElementById('play-bar-container').style.visibility = 'visible';
//       document.getElementById('play-track').max = Player.getSongTime();
//       Player.loadArrayBuffer(reader.result);
//       Player.play()
//     }, false);
//   }
// });
