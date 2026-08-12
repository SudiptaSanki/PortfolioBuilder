const vinyl = document.getElementById('vinyl');
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const visualizer = document.querySelector('.audio-visualizer');

// Web Audio Synth for a beat
let audioCtx;
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}
let isPlaying = false;
let beatInterval;

function playKick() {
    const osc = getAudioContext().createOscillator();
    const gain = getAudioContext().createGain();
    osc.connect(gain);
    gain.connect(getAudioContext().destination);
    
    osc.frequency.setValueAtTime(150, getAudioContext().currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, getAudioContext().currentTime + 0.5);
    
    gain.gain.setValueAtTime(1, getAudioContext().currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, getAudioContext().currentTime + 0.5);
    
    osc.start(getAudioContext().currentTime);
    osc.stop(getAudioContext().currentTime + 0.5);
}

function playHihat() {
    const osc = getAudioContext().createOscillator();
    const gain = getAudioContext().createGain();
    
    // Create noise buffer for hihat
    const bufferSize = getAudioContext().sampleRate * 0.1;
    const buffer = getAudioContext().createBuffer(1, bufferSize, getAudioContext().sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = getAudioContext().createBufferSource();
    noise.buffer = buffer;
    
    const filter = getAudioContext().createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 10000;
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(getAudioContext().destination);
    
    gain.gain.setValueAtTime(0.3, getAudioContext().currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, getAudioContext().currentTime + 0.1);
    
    noise.start(getAudioContext().currentTime);
}

playBtn.addEventListener('click', () => {
    if(isPlaying) return;
    isPlaying = true;
    if(getAudioContext().state === 'suspended') getAudioContext().resume();
    
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
    if(getAudioContext().state === 'suspended') getAudioContext().resume();
    const osc = getAudioContext().createOscillator();
    const gain = getAudioContext().createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, getAudioContext().currentTime);
    
    gain.gain.setValueAtTime(0.1, getAudioContext().currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, getAudioContext().currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(getAudioContext().destination);
    
    osc.start();
    osc.stop(getAudioContext().currentTime + 0.1);
}

document.querySelectorAll('.sound-hover').forEach(el => {
    el.addEventListener('mouseenter', playPluck);
});

// Unlock Web Audio API on first user interaction (click/touch)
document.addEventListener('click', () => {
    if (typeof audioCtx !== 'undefined' && getAudioContext().state === 'suspended') {
        getAudioContext().resume();
    }
}, { once: true });
