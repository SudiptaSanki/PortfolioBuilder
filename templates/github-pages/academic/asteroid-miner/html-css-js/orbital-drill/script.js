const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

let rocks = Array.from({length: 30}, () => ({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*5+2, vx: Math.random()*0.4-0.2 }));
function drawRocks() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rocks.forEach(r => {
        r.x += r.vx; if(r.x<0||r.x>canvas.width) r.vx*=-1;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI*2);
        ctx.fillStyle = '#ffaa00'; ctx.fill();
    });
    requestAnimationFrame(drawRocks);
}
drawRocks();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playDrillSound() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.15);
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playDrillSound));