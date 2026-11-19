const slide = document.querySelector('.slide');
const bgText = document.querySelector('.bg-text');
const shoe = document.querySelector('.shoe');
const addToCartBtn = document.querySelector('.add-to-cart');
const cartDisplay = document.querySelector('.cart');

// 3D Parallax Effect
document.addEventListener('mousemove', e => {
    let x = (window.innerWidth / 2 - e.pageX) / 20;
    let y = (window.innerHeight / 2 - e.pageY) / 20;
    
    bgText.style.transform = `translate(${x * 0.5}px, ${y * 0.5}px)`;
    shoe.style.transform = `rotate(-25deg) translate(${-x}px, ${-y}px) scale(1.05)`;
});

// Sound Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playCashSound() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

let cartCount = 0;
addToCartBtn.addEventListener('click', () => {
    cartCount++;
    cartDisplay.textContent = `CART [${cartCount}]`;
    cartDisplay.classList.add('shake-cart');
    playCashSound();
    setTimeout(() => cartDisplay.classList.remove('shake-cart'), 300);
});