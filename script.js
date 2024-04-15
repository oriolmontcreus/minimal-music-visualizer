import * as THREE from 'https://threejs.org/build/three.module.js';
import * as dat from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js';

// Audio variables
let audioContext, analyser, audioElement, source, currentTimeController;

// Scene variables
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setClearColor( 0x00264d, 1 );
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// GUI
const gui = new dat.GUI({ autoPlace: false });
document.getElementById('gui-container').appendChild(gui.domElement);
const audioControls = {
  play: startAudio,
  pause: () => {
    if (!audioElement.paused) {
      audioElement.pause();
    }
  },
  currentTime: 0,
  audioUrl: '',
};

// Audio setup
audioElement = new Audio('./audio1.mp3');
audioElement.addEventListener('loadedmetadata', () => {
  currentTimeController.max(audioElement.duration);
});
audioElement.addEventListener('timeupdate', () => {
  audioControls.currentTime = audioElement.currentTime;
  currentTimeController.updateDisplay();
});

// Audio functions
async function startAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    source.connect(audioContext.destination);
  }
  if (audioElement.paused) {
    audioElement.play();
  }
}

// Scene setup
const texture = new THREE.CanvasTexture(createGradientCanvas());
const torus = new THREE.Mesh(
  new THREE.TorusGeometry(1, 0.2, 16, 100),
  new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
);
scene.add(torus);
torus.rotation.x = Math.PI / 2;
camera.position.set(0, 5, 5);
camera.lookAt(0, 0, 0);

// Scene functions
function animate() {
  requestAnimationFrame(animate);
  updateTorus();
  renderer.render(scene, camera);
}

function createGradientCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;

  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2
  );
  gradient.addColorStop(0.5, 'blue');
  gradient.addColorStop(1, 'darkblue');

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  return canvas;
}

// Create stats element
const statsElement = document.createElement('div');
statsElement.style.position = 'absolute';
statsElement.style.top = '10px';
statsElement.style.right = '10px';
statsElement.style.color = 'white';
statsElement.style.width = '100px';
statsElement.style.textAlign = 'right';
document.body.appendChild(statsElement);

// Update stats
function updateTorus() {
  if (analyser) {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    const scale = 1 + data[0] / 256;
    torus.scale.set(scale, scale, scale);

    const bassFrequency = data[0];
    torus.material.opacity = bassFrequency > 128 ? 0.5 + bassFrequency / 256 : 0.9;

    // Update stats element
    statsElement.innerHTML = `
      <p>Frequency: ${bassFrequency.toFixed(2)}</p>
      <p>Scale: ${scale.toFixed(2)}</p>
      <p>Opacity: ${torus.material.opacity.toFixed(2)}</p>
    `;
  }
}

// GUI setup
gui.add(audioControls, 'play');
gui.add(audioControls, 'pause');
currentTimeController = gui.add(audioControls, 'currentTime', 0, 1).step(0.1).onChange((value) => {
  audioElement.currentTime = value;
});

//Drag&Drop

const audioUrls = [];

const audioMenu = createAudioMenu();

// Load the audio files
loadAudioFiles(['audio1.mp3', 'audio2.mp3'], audioMenu);

// Handle the 'change' event
audioMenu.addEventListener('change', handleAudioMenuChange);

// Handle the 'dragover' event
document.addEventListener('dragover', event => event.preventDefault());

// Handle the 'drop' event
document.addEventListener('drop', handleDropEvent);

// Start animation
animate();

function createAudioMenu() {
  const audioMenu = document.createElement('select');
  audioMenu.style.position = 'absolute';
  audioMenu.style.top = '10px';
  audioMenu.style.left = '500px';
  document.body.appendChild(audioMenu);
  return audioMenu;
}

function loadAudioFiles(files, audioMenu) {
  for (const file of files) {
    fetch(file)
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const option = document.createElement('option');
        option.value = url;
        option.text = file;
        audioMenu.appendChild(option);
      });
  }
}

function attachAudioEventListeners() {
  audioElement.addEventListener('loadedmetadata', () => {
    currentTimeController.max(audioElement.duration);
  });
  audioElement.addEventListener('timeupdate', () => {
    audioControls.currentTime = audioElement.currentTime;
    currentTimeController.updateDisplay();
  });
}

// Attach event listeners to the initial audioElement
attachAudioEventListeners();

function handleAudioMenuChange(event) {
  if (audioContext) audioContext.close();

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  
  audioElement = new Audio(event.target.value);
  audioElement.load();
  
  // Attach event listeners to the new audioElement
  attachAudioEventListeners();
  
  source = audioContext.createMediaElementSource(audioElement);
  source.connect(analyser);
  source.connect(audioContext.destination);
  
  audioControls.currentTime = 0;
  currentTimeController.updateDisplay();
}

async function handleDropEvent(event) {
  event.preventDefault();
  
  if (audioContext) audioContext.close();
  
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  
  const file = event.dataTransfer.files[0];
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });
  const url = URL.createObjectURL(blob);
  
  audioElement = new Audio(url);
  audioElement.load();
  
  // Attach event listeners to the new audioElement
  attachAudioEventListeners();
  
  source = audioContext.createMediaElementSource(audioElement);
  source.connect(analyser);
  source.connect(audioContext.destination);
  
  const option = document.createElement('option');
  option.value = url;
  option.text = file.name;
  audioMenu.appendChild(option);
  
  // Set the new option as the selected option
  option.selected = true;
  
  audioControls.currentTime = 0;
  currentTimeController.updateDisplay();
}