const canvas = document.getElementById('paintWall');
const ctx = canvas.getContext('2d');
let drawing = false;
let color = '#ff0055';

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.querySelectorAll('.c-btn').forEach(btn => {
    btn.addEventListener('click', e => { color = e.target.dataset.color; });
});

window.addEventListener('mousedown', () => drawing = true);
window.addEventListener('mouseup', () => drawing = false);
window.addEventListener('mousemove', spray);

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function spray(e) {
    if(!drawing) return;
    playSpraySound();
    for (let i = 0; i < 20; i++) {
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetY = (Math.random() - 0.5) * 30;
        ctx.fillStyle = color;
        ctx.fillRect(e.clientX + offsetX, e.clientY + offsetY, 2, 2);
    }
}

function playSpraySound() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const bufferSize = audioCtx.sampleRate * 0.02;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.05;
    noise.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
}