const canvas = document.getElementById('solarCanvas');
const ctx = canvas.getContext('2d');
let angle = 0;

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function drawSolarRays() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let cx = canvas.width / 2, cy = canvas.height / 2;
    for(let i=0; i<16; i++) {
        let a = angle + (i * Math.PI / 8);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * 800, cy + Math.sin(a) * 800);
        ctx.strokeStyle = 'rgba(255, 204, 0, 0.08)';
        ctx.lineWidth = 20;
        ctx.stroke();
    }
    angle += 0.002;
    requestAnimationFrame(drawSolarRays);
}
drawSolarRays();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSolarHum() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 520;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playSolarHum));