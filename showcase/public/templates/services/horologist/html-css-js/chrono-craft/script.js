const canvas = document.getElementById('clockCanvas');
const ctx = canvas.getContext('2d');
const radius = canvas.height / 2;
ctx.translate(radius, radius);

function drawClock() {
    ctx.arc(0, 0, radius * 0.9, 0, 2 * Math.PI);
    ctx.fillStyle = '#14120e';
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.stroke();

    const now = new Date();
    document.getElementById('time').textContent = now.toLocaleTimeString();

    let hour = now.getHours() % 12;
    let minute = now.getMinutes();
    let second = now.getSeconds();

    // Hour hand
    hour = (hour*Math.PI/6)+(minute*Math.PI/(6*60))+(second*Math.PI/(360*60));
    drawHand(hour, radius*0.5, 4, '#d4af37');
    // Minute hand
    minute = (minute*Math.PI/30)+(second*Math.PI/(30*60));
    drawHand(minute, radius*0.7, 3, '#f3e5ab');
    // Second hand
    second = (second*Math.PI/30);
    drawHand(second, radius*0.8, 1, '#ff3333');
}

function drawHand(pos, length, width, color) {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.moveTo(0,0);
    ctx.rotate(pos);
    ctx.lineTo(0, -length);
    ctx.stroke();
    ctx.rotate(-pos);
}

setInterval(drawClock, 1000);
drawClock();

// Tick audio sound
let ticking = true;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTick() {
    if(!ticking) return;
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
}
setInterval(playTick, 1000);

document.getElementById('tickBtn').addEventListener('click', () => { ticking = !ticking; });