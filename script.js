import * as THREE from 'https://threejs.org/build/three.module.js';
import * as dat from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js';

let audioContext;
let analyser;
let audioElement;
let source;
audioElement = new Audio('./2minuteAmbient.mp3');
audioElement.addEventListener('loadedmetadata', () => {
  // Update the maximum value of the currentTime slider
  currentTimeController.max(audioElement.duration);
});
audioElement.addEventListener('timeupdate', () => {
  // Update the currentTime slider as the audio plays
  audioControls.currentTime = audioElement.currentTime;
  currentTimeController.updateDisplay();
});

let currentTimeController;


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
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(333, 1);
document.body.appendChild(renderer.domElement);

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

const texture = new THREE.CanvasTexture(canvas);

const geometry = new THREE.TorusGeometry(1, 0.2, 16, 100);

const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });

const torus = new THREE.Mesh(geometry, material);
scene.add(torus);

torus.rotation.x = Math.PI / 2;

camera.position.z = 5;
camera.position.set(0, 5, 5);
camera.lookAt(0, 0, 0);

function animate() {
  requestAnimationFrame(animate);

  if (analyser) {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    torus.scale.x = 1 + data[0] / 256;
    torus.scale.y = 1 + data[0] / 256;

    const bassFrequency = data[0];
    if (bassFrequency > 128) {
      const pulse = 1 + bassFrequency / 256;
      torus.material.opacity = 0.5 + pulse / 2;
    } else {
      torus.material.opacity = 0.9;
    }
  }

  renderer.render(scene, camera);
}

/// GUI
const gui = new dat.GUI({ autoPlace: false });
document.getElementById('gui-container').appendChild(gui.domElement);
const audioControls = {
  play: () => {
    startAudio();
  },
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

// Modify the toString method of the currentTime controller
currentTimeController.__li.getElementsByClassName('property-name')[0].innerHTML = 'currentTime';
currentTimeController.__li.getElementsByClassName('c')[0].style.width = '60%';
currentTimeController.toString = function() {
  const minutes = Math.floor(this.getValue() / 60);
  const seconds = Math.floor(this.getValue() % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

animate();