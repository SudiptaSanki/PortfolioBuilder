// Retro UI interaction
const menuItems = document.querySelectorAll('.menu-item');
let activeIndex = 0;

function updateMenu() {
    menuItems.forEach((item, index) => {
        if(index === activeIndex) {
            item.innerHTML = '> ' + item.innerHTML.replace('> ', '').trim();
            item.classList.add('active');
        } else {
            item.innerHTML = '  ' + item.innerHTML.replace('> ', '').trim();
            item.classList.remove('active');
        }
    });
}

// 8-bit blip sound
let audioCtx;
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}
function playBlip() {
    if(getAudioContext().state === 'suspended') getAudioContext().resume();
    const osc = getAudioContext().createOscillator();
    const gain = getAudioContext().createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, getAudioContext().currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, getAudioContext().currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, getAudioContext().currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, getAudioContext().currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(getAudioContext().destination);
    osc.start();
    osc.stop(getAudioContext().currentTime + 0.1);
}

menuItems.forEach((item, index) => {
    item.addEventListener('mouseenter', () => {
        activeIndex = index;
        updateMenu();
        playBlip();
    });
});

document.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowDown') {
        activeIndex = (activeIndex + 1) % menuItems.length;
        updateMenu();
        playBlip();
    } else if(e.key === 'ArrowUp') {
        activeIndex = (activeIndex - 1 + menuItems.length) % menuItems.length;
        updateMenu();
        playBlip();
    }
});

// Unlock Web Audio API on first user interaction (click/touch)
document.addEventListener('click', () => {
    if (typeof audioCtx !== 'undefined' && getAudioContext().state === 'suspended') {
        getAudioContext().resume();
    }
}, { once: true });
