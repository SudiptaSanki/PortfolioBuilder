const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const notes = {
    'c4': 261.63,
    'e4': 329.63,
    'g4': 392.00,
    'b4': 493.88
};

function playTone(freq) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}
}

document.querySelectorAll('.pad').forEach(pad => {
    pad.addEventListener('click', () => {
        const note = pad.getAttribute('data-note');
        if (notes[note]) playTone(notes[note]);
    });
});
