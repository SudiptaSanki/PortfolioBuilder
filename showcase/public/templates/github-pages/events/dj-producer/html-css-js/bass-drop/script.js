const btn = document.querySelector('.sound-trigger');
const title = document.querySelector('h1');
const bars = document.querySelectorAll('.bar');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playHardBass() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.8);
    
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    
    // add distortion
    const distortion = audioCtx.createWaveShaper();
    function makeDistortionCurve(amount) {
        let k = typeof amount === 'number' ? amount : 50,
        n_samples = 44100, curve = new Float32Array(n_samples), deg = Math.PI / 180, i = 0, x;
        for ( ; i < n_samples; ++i ) {
            x = i * 2 / n_samples - 1;
            curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
        }
        return curve;
    }
    distortion.curve = makeDistortionCurve(400);
    distortion.oversample = '4x';
    
    osc.connect(distortion);
    distortion.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
}

function triggerEffect() {
    playHardBass();
    document.body.classList.add('boom');
    document.body.classList.add('flash');
    
    let intervals = 0;
    const eqInt = setInterval(() => {
        bars.forEach(bar => {
            bar.style.height = (Math.random() * 100) + 'px';
        });
        intervals++;
        if(intervals > 15) {
            clearInterval(eqInt);
            bars.forEach(bar => bar.style.height = '10px');
            document.body.classList.remove('boom');
            document.body.classList.remove('flash');
        }
    }, 50);
}

btn.addEventListener('click', triggerEffect);
title.addEventListener('click', triggerEffect);