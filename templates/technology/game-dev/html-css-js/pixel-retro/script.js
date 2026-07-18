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
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBlip() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
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