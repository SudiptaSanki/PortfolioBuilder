// Show sticky player on play button click
const playBtns = document.querySelectorAll('.play-btn, .play-circle');
const player = document.querySelector('.sticky-player');
const mainPlayIcon = document.querySelector('.main-play');
let isPlaying = false;

playBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        player.classList.add('active');
        isPlaying = true;
        mainPlayIcon.classList.remove('ph-play-circle');
        mainPlayIcon.classList.add('ph-pause-circle');
    });
});

mainPlayIcon.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
        mainPlayIcon.classList.remove('ph-play-circle');
        mainPlayIcon.classList.add('ph-pause-circle');
    } else {
        mainPlayIcon.classList.remove('ph-pause-circle');
        mainPlayIcon.classList.add('ph-play-circle');
    }
});