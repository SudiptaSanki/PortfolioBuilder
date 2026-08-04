const cursor = document.querySelector('.cursor');
document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let buzzOsc;

function startBuzz() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    buzzOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    buzzOsc.type = 'sawtooth';
    buzzOsc.frequency.setValueAtTime(100, audioCtx.currentTime);
    
    // Tattoo machine buzz modulation
    const mod = audioCtx.createOscillator();
    mod.type = 'square';
    mod.frequency.value = 50;
    
    const modGain = audioCtx.createGain();
    modGain.gain.value = 50;
    
    mod.connect(modGain);
    modGain.connect(buzzOsc.frequency);
    
    gain.gain.value = 0.1;
    
    buzzOsc.connect(gain);
    gain.connect(audioCtx.destination);
    
    mod.start();
    buzzOsc.start();
    cursor.classList.add('buzzing');
}

function stopBuzz() {
    if(buzzOsc) {
        buzzOsc.stop();
        buzzOsc = null;
    }
    cursor.classList.remove('buzzing');
}

document.querySelectorAll('.buzz-hover').forEach(el => {
    el.addEventListener('mouseenter', startBuzz);
    el.addEventListener('mouseleave', stopBuzz);
});