const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playShutter() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Quick mechanical snap
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    
    // Add white noise for the mechanical click
    const bufferSize = audioCtx.sampleRate * 0.05;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    noise.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
    noise.start();
}

document.querySelectorAll('.sound-hover').forEach(el => {
    el.addEventListener('mouseenter', () => {
        playShutter();
        document.body.classList.add('flash');
        setTimeout(() => document.body.classList.remove('flash'), 50);
    });
});

// Horizontal scroll with mouse wheel
const gallery = document.querySelector('.gallery');
gallery.addEventListener('wheel', (e) => {
    e.preventDefault();
    gallery.scrollLeft += e.deltaY;
});