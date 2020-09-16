const musicMetadata = require('music-metadata-browser');

let audio = new dAudio({
  repeat: false,
  autoplay: true,
  remaster: true,
  onstate: e => console.log(e.name, e.name == 'error' ? `: ${e.message}(${e.code})` : ''),
});

const input = document.querySelector('#file');
const canvas = document.querySelector('#analyser');
const ctx = canvas.getContext('2d');
const timer = document.querySelector('#timer');
const duration = document.querySelector('#duration');
const seekbar = document.querySelector('#seekbar');
const playPause = document.querySelector('#playPause');
const remaster = document.querySelector('#remaster');
const repeat = document.querySelector('#repeat');
const info = document.querySelector('#info');

function windowResize() {
  canvas.width = document.body.clientWidth - 40;
  canvas.height = canvas.width / 6;
}
windowResize();
window.onresize = e => windowResize();

function loadTrack(currentTrack) {
  audio.stop();
  audio.src = input.files[currentTrack];
  musicMetadata.parseBlob( input.files[currentTrack] ).then( metadata => {
    console.log(metadata);
    if (metadata.common.picture && metadata.common.picture.length) {
      const data = 'data:' + metadata.common.picture[0].format + ';base64,' + metadata.common.picture[0].data.toString('base64');
      document.querySelector('#cover').src = data;
      document.querySelector('#bg').style.backgroundImage = 'url(' + data + ')';
    }
    else {
      document.querySelector('#cover').src = 'img/album-placeholder.png';
      document.querySelector('#bg').src = 'img/album-placeholder.png';
    }
    document.querySelector('#title').innerText = metadata.common.title && metadata.common.title.length ? metadata.common.title : 'Unknown';
    document.querySelector('#artist').innerText = metadata.common.artist && metadata.common.artist.length ? metadata.common.artist : 'Unknown';
    info.innerText = '';
    function addBadge(text) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.innerText = text;
      info.appendChild(badge);
    }
    if (metadata.format.container && metadata.format.container.length) addBadge(metadata.format.container);
    if (metadata.format.codec && metadata.format.codec.length) addBadge(metadata.format.codec);
    if (metadata.format.numberOfChannels && typeof metadata.format.numberOfChannels == 'number') {
      let channels = 'Unknown';
      if (metadata.format.numberOfChannels == 1) channels = 'Mono';
      else if (metadata.format.numberOfChannels == 2) channels = 'Stereo';
      else if (metadata.format.numberOfChannels > 2) channels = metadata.format.numberOfChannels + 'Channels';
      addBadge(channels);
    }
    if (metadata.format.sampleRate && typeof metadata.format.sampleRate == 'number') addBadge(Math.round(metadata.format.sampleRate / 1000) + ' kHz');
    if (metadata.format.codecProfile && metadata.format.codecProfile.length) {
      if (metadata.format.codecProfile == 'CBR') addBadge('CBR');
      else addBadge('VBR')
    }
    if (metadata.format.bitrate && typeof metadata.format.bitrate == 'number') addBadge(Math.round(metadata.format.bitrate / 1000) + ' kbps');
    if (metadata.format.lossless) addBadge('Lossless');
  });
}

let currentTrack = 0;

input.onchange = e => {
  if (input.files.length) {
    currentTrack = 0;
    loadTrack(currentTrack);
    audio.onend = () => {
      if (input.files.length - 1 > currentTrack) {
        currentTrack++;
        loadTrack(currentTrack);
      }
    };
  }
}

playPause.onclick = e => {
  if (audio.src.length) audio.playPause();
  else input.click();
};

const playIcon = document.createElement('i');
playIcon.className = 'fas fa-play';
const pauseIcon = document.createElement('i');
pauseIcon.className = 'fas fa-pause';

audio.onplay = e => playPause.innerHTML = pauseIcon.outerHTML;
audio.onpause = e => playPause.innerHTML = playIcon.outerHTML;
audio.onstop = e => playPause.innerHTML = playIcon.outerHTML;

function nextTrack(){
  currentTrack = currentTrack != input.files.length - 1 ? currentTrack + 1 : 0;
  loadTrack(currentTrack);
}

function previousTrack(){
  currentTrack = currentTrack != 0 ? currentTrack - 1 : input.files.length - 1;
  loadTrack(currentTrack);
}

document.querySelector('#stop').onclick = e => audio.stop();
document.querySelector('#eject').onclick = e => input.click();
document.querySelector('#previous').onclick = e => previousTrack();
document.querySelector('#next').onclick = e => nextTrack();
document.querySelector('#backward').onclick = e => audio.currentTime = audio.currentTime - 10;
document.querySelector('#forward').onclick = e => audio.currentTime = audio.currentTime + 10;
remaster.onclick = e => {
  audio.remaster = !audio.remaster;
  remaster.classList.toggle('on');

};
repeat.onclick = e => {
  audio.repeat = !audio.repeat;
  repeat.classList.toggle('on');
}
seekbar.oninput = e => audio.currentTime = parseFloat(e.target.value);


function format(time){
  if (!time) return '0:00';
  const pad = (num, size) => { return ('000' + num).slice(size * -1) },
  hours = Math.floor(time / 3600),
  minutes = Math.floor(time / 60) % 60,
  seconds = Math.floor(time - minutes * 60);
  return `${hours ? pad(hours, 2)+':' : ''}${pad(minutes, minutes > 9 ? 2 : 1)}:${pad(seconds, 2)}`;
}

setInterval(() => {
  seekbar.max = audio.duration;
  seekbar.value = audio.currentTime;
  timer.innerText = format(audio.currentTime);
  duration.innerText = format(audio.duration);
  if (audio.currentTime > audio.duration) nextTrack(); 
}, 100);

function frameLooper() {
  window.requestAnimationFrame(frameLooper);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(1, "#808080");
  gradient.addColorStop(0, "#ffffff");
  ctx.fillStyle = gradient;
  const data = audio.specFreq; // Get frequency analysis for each frame
  const maxFreq = parseInt(data.length * 0.92); // Ignore frequencies higher than 16kHz
  const width = canvas.width / maxFreq;
  const barWidth = width - 1;
  for (var i = 0; i < maxFreq; i++) { // Loop through analyser data array
    const barHeight = canvas.height * (-data[i] / 256) - 1;
    const barX = i * width;
    ctx.fillRect(barX, canvas.height, barWidth, barHeight);
  }
}
frameLooper();