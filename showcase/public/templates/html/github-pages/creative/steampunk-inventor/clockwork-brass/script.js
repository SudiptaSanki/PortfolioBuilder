const canvas = document.getElementById('gearCanvas');
const ctx = canvas.getContext('2d');
let rot = 0;

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function drawGear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rot);
    
    ctx.strokeStyle = '#cd7f32';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 150, 0, Math.PI * 2);
    ctx.stroke();
    
    for(let i=0; i<12; i++) {
        ctx.rotate((Math.PI * 2) / 12);
        ctx.fillRect(140, -10, 30, 20);
    }
    ctx.restore();
    rot += 0.005;
    requestAnimationFrame(drawGear);
}
drawGear();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playGearClick() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 300;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
}
document.querySelectorAll('.sound-hover').forEach(el => el.addEventListener('mouseenter', playGearClick));