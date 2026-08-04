const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let i=0; i<30; i++) {
        let x = Math.sin(Date.now()*0.001 + i)*200 + canvas.width/2;
        let y = Math.cos(Date.now()*0.001 + i*0.5)*200 + canvas.height/2;
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2);
        ctx.fillStyle = '#38bdf8'; ctx.fill();
    }
    requestAnimationFrame(drawParticles);
}
drawParticles();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playGlassSound() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.15);
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playGlassSound));