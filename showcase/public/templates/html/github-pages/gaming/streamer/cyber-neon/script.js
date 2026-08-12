// 3D Card effect (runs only if card is present on the page)
const card = document.querySelector('.card3d');
if (card) {
    document.addEventListener('mousemove', (e) => {
        let xAxis = (window.innerWidth / 2 - e.pageX) / 25;
        let yAxis = (window.innerHeight / 2 - e.pageY) / 25;
        card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });
}

// Lazy AudioContext
let audioCtx;
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

// Sound effects on hover using Web Audio API
function playHoverSound() {
    try {
        const ctx = getAudioContext();
        if(ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
        console.log("AudioContext blocked or failed: ", e);
    }
}

document.querySelectorAll('.sound-hover').forEach(el => {
    el.addEventListener('mouseenter', playHoverSound);
});

// Unlock Web Audio API on first user interaction (click/touch)
document.addEventListener('click', () => {
    try {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
    } catch (e) {
        console.log("AudioContext resume failed: ", e);
    }
}, { once: true });


// --- SIMULATED CHAT ROOM LOGIC (runs only on stream.html) ---
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const chatBtn = document.getElementById('chatBtn');

if (chatBox) {
    const mockUsers = ["NinjaWannabe", "AimBot99", "FragLord", "GG_Ez", "LootGoblin", "TrollFace", "PwnedYou", "SpeedyGamer", "ValorantQueen", "ApexNoob"];
    const mockMessages = [
        "OMG WHAT A PLAY! 🔥",
        "Can you show your settings?",
        "LMAO NO WAY!",
        "!commands",
        "Is RTX 4090 worth it?",
        "Drop the sensitivity settings!",
        "HE IS AIMBOTING FOR SURE! 😡",
        "GG!",
        "EZ Clap",
        "How long have you been streaming?",
        "Drop your setup specs!",
        "Subscribing right now! 👑"
    ];

    function addChatMessage(username, message, isMod = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg';
        
        const userSpan = document.createElement('span');
        userSpan.className = isMod ? 'user mod' : 'user';
        userSpan.textContent = username + ':';
        
        msgDiv.appendChild(userSpan);
        msgDiv.appendChild(document.createTextNode(' ' + message));
        chatBox.appendChild(msgDiv);
        
        // Auto scroll to bottom
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Limit total messages in box
        if (chatBox.children.length > 25) {
            chatBox.removeChild(chatBox.firstChild);
        }
    }

    // Dynamic mock message loop
    function startSimulatedChat() {
        setInterval(() => {
            const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
            const randomMsg = mockMessages[Math.floor(Math.random() * mockMessages.length)];
            const isMod = Math.random() < 0.15; // 15% chance to be mod
            addChatMessage(randomUser, randomMsg, isMod);
        }, 3000);
    }

    startSimulatedChat();

    // User Message sending
    function handleUserSend() {
        const text = chatInput.value.trim();
        if (text === '') return;
        
        addChatMessage("You", text, false);
        chatInput.value = '';
        
        // Play click sound on chat send
        playHoverSound();
    }

    chatBtn.addEventListener('click', handleUserSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleUserSend();
        }
    });
}
