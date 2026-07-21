// Matrix background
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const letters = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const fontSize = 16;
const columns = canvas.width / fontSize;
const drops = Array.from({length: columns}).map(() => 1);

function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0F0';
    ctx.font = fontSize + 'px monospace';
    
    for(let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    }
}
setInterval(drawMatrix, 50);

// Typewriter
const text = ">> Initializing neural pathways... Connection established.";
const typeTarget = document.querySelector('.typewriter');
let i = 0;
function typeWriter() {
    if (i < text.length) {
        typeTarget.innerHTML += text.charAt(i);
        i++;
        setTimeout(typeWriter, 50);
    }
}
setTimeout(typeWriter, 1000);

// Data sound
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playDataSound() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1500, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

document.querySelectorAll('.sound-hover').forEach(el => {
    el.addEventListener('mouseenter', () => {
        playDataSound();
        document.body.classList.add('shake-active');
        setTimeout(() => document.body.classList.remove('shake-active'), 100);
    });
});