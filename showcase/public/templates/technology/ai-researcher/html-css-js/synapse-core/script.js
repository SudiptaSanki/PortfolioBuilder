const canvas = document.getElementById('synapseCanvas');
const ctx = canvas.getContext('2d');
let nodes = [];

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

for(let i=0; i<45; i++) {
    nodes.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*0.8, vy: (Math.random()-0.5)*0.8 });
}

function drawSynapses() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes.forEach((n, i) => {
        n.x += n.vx; n.y += n.vy;
        if(n.x<0||n.x>canvas.width) n.vx*=-1;
        if(n.y<0||n.y>canvas.height) n.vy*=-1;
        
        ctx.beginPath(); ctx.arc(n.x, n.y, 3, 0, Math.PI*2); ctx.fillStyle = '#00f0ff'; ctx.fill();
        
        for(let j=i+1; j<nodes.length; j++) {
            let n2 = nodes[j];
            let dist = Math.hypot(n.x - n2.x, n.y - n2.y);
            if(dist < 130) {
                ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n2.x, n2.y);
                ctx.strokeStyle = 'rgba(0, 240, 255, ' + (1 - dist/130)*0.3 + ')';
                ctx.stroke();
            }
        }
    });
    requestAnimationFrame(drawSynapses);
}
drawSynapses();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playNeuralSpike() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

document.getElementById('spikeBtn').addEventListener('click', () => {
    playNeuralSpike();
    nodes.forEach(n => { n.vx *= 2.5; n.vy *= 2.5; });
    setTimeout(() => { nodes.forEach(n => { n.vx /= 2.5; n.vy /= 2.5; }); }, 800);
});