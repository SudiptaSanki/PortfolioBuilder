const canvas = document.getElementById('dnaCanvas');
const ctx = canvas.getContext('2d');
let t = 0;

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function drawDNA() {
    ctx.fillStyle = 'rgba(3, 10, 6, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let points = 25;
    for(let i=0; i<points; i++) {
        let y = (canvas.height / points) * i;
        let x1 = canvas.width / 2 + Math.sin(t + i * 0.3) * 120;
        let x2 = canvas.width / 2 - Math.sin(t + i * 0.3) * 120;
        
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.3)';
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x1, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#00ff66';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x2, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#00f0ff';
        ctx.fill();
    }
    t += 0.04;
    requestAnimationFrame(drawDNA);
}
drawDNA();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playGeneBeep() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

document.getElementById('geneBtn').addEventListener('click', playGeneBeep);