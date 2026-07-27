const canvas = document.getElementById('sparkCanvas');
const ctx = canvas.getContext('2d');
let sparks = [];

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function drawSparks() {
    ctx.fillStyle = 'rgba(12, 8, 6, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    sparks.forEach((s, i) => {
        s.x += s.vx; s.y += s.vy; s.vy += 0.1; s.alpha -= 0.02;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255, 69, 0, ' + s.alpha + ')'; ctx.fill();
    });
    sparks = sparks.filter(s => s.alpha > 0);
    requestAnimationFrame(drawSparks);
}
drawSparks();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
document.getElementById('anvilBtn').addEventListener('click', () => {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1500, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);

    for(let i=0; i<40; i++) {
        sparks.push({ x: canvas.width/2, y: canvas.height/2, r: Math.random()*3+1, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.8)*10, alpha: 1 });
    }
});