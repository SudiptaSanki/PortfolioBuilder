const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d');
canvas.width = canvas.parentElement.clientWidth;
canvas.height = canvas.parentElement.clientHeight;

let candles = [];
for(let i=0; i<30; i++) {
    let open = 100 + Math.random() * 20;
    let close = open + (Math.random() - 0.5) * 15;
    let high = Math.max(open, close) + Math.random() * 5;
    let low = Math.min(open, close) - Math.random() * 5;
    candles.push({ open, close, high, low });
}

function drawChart() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let w = canvas.width / candles.length;
    candles.forEach((c, idx) => {
        let x = idx * w + w/2;
        let isGreen = c.close >= c.open;
        ctx.strokeStyle = isGreen ? '#089981' : '#f23645';
        ctx.fillStyle = isGreen ? '#089981' : '#f23645';
        
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - c.high * 3);
        ctx.lineTo(x, canvas.height - c.low * 3);
        ctx.stroke();
        
        ctx.fillRect(x - w*0.3, canvas.height - Math.max(c.open, c.close)*3, w*0.6, Math.abs(c.close - c.open)*3 || 2);
    });
}
drawChart();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
document.getElementById('tradeBtn').addEventListener('click', () => {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1500, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
    
    candles.shift();
    let last = candles[candles.length - 1].close;
    let nextClose = last + (Math.random() - 0.4) * 10;
    candles.push({ open: last, close: nextClose, high: Math.max(last, nextClose)+3, low: Math.min(last, nextClose)-3 });
    drawChart();
});