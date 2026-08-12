// Clone marquee content for smooth infinite scrolling
const marqueeContent = document.querySelector('.marquee-content');
if (marqueeContent) {
    const clone = marqueeContent.innerHTML;
    marqueeContent.innerHTML += clone + clone;
}

// Glitch text effect on hover
const glitches = document.querySelectorAll('.glitch');
glitches.forEach(glitch => {
    setInterval(() => {
        if(Math.random() > 0.9) {
            glitch.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
            setTimeout(() => {
                glitch.style.transform = 'translate(0,0)';
            }, 50);
        }
    }, 100);
});