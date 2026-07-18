const vinyl = document.getElementById('vinyl');
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const visualizer = document.querySelector('.audio-visualizer');

// Web Audio Synth for a beat
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isPlaying = false;
let beatInterval;

function playKick() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.5);
}

function playHihat() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Create noise buffer for hihat
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 10000;
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    noise.start(audioCtx.currentTime);
}

playBtn.addEventListener('click', () => {
    if(isPlaying) return;
    isPlaying = true;
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    vinyl.classList.add('spin');
    visualizer.classList.add('playing');
    
    let step = 0;
    beatInterval = setInterval(() => {
        if(step % 4 === 0 || step % 4 === 2) playKick();
        if(step % 2 !== 0) playHihat();
        step++;
    }, 250);
});

stopBtn.addEventListener('click', () => {
    isPlaying = false;
    vinyl.classList.remove('spin');
    visualizer.classList.remove('playing');
    clearInterval(beatInterval);
});

// Pluck sound for UI hover
function playPluck() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

document.querySelectorAll('.sound-hover').forEach(el => {
    el.addEventListener('mouseenter', playPluck);
});