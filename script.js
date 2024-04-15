import * as THREE from 'https://threejs.org/build/three.module.js';
import * as dat from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js';

let audioContext, analyser, audioElement, source, currentTimeController;

audioElement = new Audio('./2minuteAmbient.mp3');
audioElement.addEventListener('loadedmetadata', () => {
  currentTimeController.max(audioElement.duration);
});
audioElement.addEventListener('timeupdate', () => {
  audioControls.currentTime = audioElement.currentTime;
  currentTimeController.updateDisplay();
});

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

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setClearColor( 0x00264d, 1 );
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const texture = new THREE.CanvasTexture(createGradientCanvas());

const torus = new THREE.Mesh(
  new THREE.TorusGeometry(1, 0.2, 16, 100),
  new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
);
scene.add(torus);

torus.rotation.x = Math.PI / 2;
camera.position.set(0, 5, 5);
camera.lookAt(0, 0, 0);

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

function updateTorus() {
  if (analyser) {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    const scale = 1 + data[0] / 256;
    torus.scale.set(scale, scale, scale);

    const bassFrequency = data[0];
    torus.material.opacity = bassFrequency > 128 ? 0.5 + bassFrequency / 256 : 0.9;
  }
}

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
};

gui.add(audioControls, 'play');
gui.add(audioControls, 'pause');
currentTimeController = gui.add(audioControls, 'currentTime', 0, 1).step(0.1).onChange((value) => {
  audioElement.currentTime = value;
});

animate();