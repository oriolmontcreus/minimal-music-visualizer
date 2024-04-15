import * as THREE from 'https://threejs.org/build/three.module.js';
import * as dat from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js';

//Minified three.js setup ----------
let audioContext, analyser, audioElement = new Audio('./media/audio1.mp3'), source, currentTimeController;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000), renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }), gui = new dat.GUI({ autoPlace: false }), audioControls = { play: startAudio, pause: () => audioElement.paused || audioElement.pause(), currentTime: 0, audioUrl: '' }, texture = new THREE.CanvasTexture(createGradientCanvas()), torus = new THREE.Mesh(new THREE.TorusGeometry(1, 0.2, 16, 100), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })), statsElement = document.createElement('div'), audioMenu = createAudioMenu();

renderer.setClearColor(0x00264d, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
document.getElementById('gui-container').appendChild(gui.domElement);
scene.add(torus);
torus.rotation.x = Math.PI / 2;
camera.position.set(0, 5, 5);
camera.lookAt(0, 0, 0);
statsElement.style = 'position: absolute; top: 10px; right: 10px; color: white; width: 100px; text-align: right;';
document.body.appendChild(statsElement);
gui.add(audioControls, 'play');
gui.add(audioControls, 'pause');
currentTimeController = gui.add(audioControls, 'currentTime', 0, 1).step(0.1).onChange((value) => audioElement.currentTime = value);
loadAudioFiles(['./media/audio1.mp3', './media/audio2.mp3'], audioMenu);
audioMenu.addEventListener('change', handleAudioMenuChange);
document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('drop', handleDropEvent);
attachAudioEventListeners();
animate();
//End of minified three.js setup ----------

//Starts audio playback and initializes the audio context if not already done
function startAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    source.connect(audioContext.destination);
  }
  if (audioElement.paused) audioElement.play();
}

//Continuously updates the scene and renders it
function animate() {
  requestAnimationFrame(animate);
  updateTorus();
  renderer.render(scene, camera);
}

// Creates a canvas with a radial gradient from blue to dark blue
function createGradientCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;

  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);

  gradient.addColorStop(0.5, 'blue');
  gradient.addColorStop(1, 'darkblue');

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  return canvas;
}

//Updates scale/opacity of the torus based on the bass frequency of the audio
function updateTorus() {
  if (analyser) {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const scale = 1 + data[0] / 256, bassFrequency = data[0];
    torus.scale.set(scale, scale, scale);
    torus.material.opacity = bassFrequency > 128 ? 0.5 + bassFrequency / 256 : 0.9;
    statsElement.innerHTML = `<p>Frequency: ${bassFrequency.toFixed(2)}</p><p>Scale: ${scale.toFixed(2)}</p><p>Opacity: ${torus.material.opacity.toFixed(2)}</p>`;
  }
}

//Creates a dropdown menu for selecting audio files
function createAudioMenu() {
  const audioMenu = document.createElement('select');
  audioMenu.style = 'position: absolute; top: 10px; left: 500px;';
  document.body.appendChild(audioMenu);
  return audioMenu;
}

//Fetches the provided audio files and adds them as options to the audio menu (the audios hardcoded in the repo, so audio1.mp3 and audio2.mp3)
function loadAudioFiles(files, audioMenu) {
  files.forEach(file => fetch(file).then(response => response.blob()).then(blob => {
    const url = URL.createObjectURL(blob), option = document.createElement('option');
    option.value = url;
    option.text = file;
    audioMenu.appendChild(option);
  }));
}

//Attaches event listeners to the audio element to update the current time controller
function attachAudioEventListeners() {
  audioElement.addEventListener('loadedmetadata', () => currentTimeController.max(audioElement.duration));
  audioElement.addEventListener('timeupdate', () => {
    audioControls.currentTime = audioElement.currentTime;
    currentTimeController.updateDisplay();
  });
}

//Logic to handle the event when a different audio file is selected from the menu
function handleAudioMenuChange(event) {
  if (audioContext) audioContext.close();
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  audioElement = new Audio(event.target.value);
  audioElement.load();
  attachAudioEventListeners();
  source = audioContext.createMediaElementSource(audioElement);
  source.connect(analyser);
  source.connect(audioContext.destination);
  audioControls.currentTime = 0;
  currentTimeController.updateDisplay();
}

//Logic to handle the event when an audio file is dropped onto the page
async function handleDropEvent(event) {
  event.preventDefault();
  if (audioContext) audioContext.close();
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  const file = event.dataTransfer.files[0], arrayBuffer = await file.arrayBuffer(), blob = new Blob([arrayBuffer], { type: file.type }), url = URL.createObjectURL(blob), option = document.createElement('option');
  audioElement = new Audio(url);
  audioElement.load();
  attachAudioEventListeners();
  source = audioContext.createMediaElementSource(audioElement);
  source.connect(analyser);
  source.connect(audioContext.destination);
  option.value = url;
  option.text = file.name;
  audioMenu.appendChild(option);
  option.selected = true;
  audioControls.currentTime = 0;
  currentTimeController.updateDisplay();
}