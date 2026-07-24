const input = document.getElementById('termInput');
const body = document.getElementById('termBody');

const commands = {
    help: "Commands: <span class='cmd-highlight'>about</span>, <span class='cmd-highlight'>skills</span>, <span class='cmd-highlight'>exploits</span>, <span class='cmd-highlight'>contact</span>, <span class='cmd-highlight'>clear</span>",
    about: "Senior Penetration Tester & Red Team Leader with 8+ years auditing Banking & Cloud Infrastructure.",
    skills: "Burp Suite, Metasploit, Reverse Engineering, Python/C Exploit Dev, AWS Security.",
    exploits: "CVE-2023-XXXX (Zero-Day RCE), Auth Bypass in Top-10 Fintech App.",
    contact: "PGP Key: 0x98F2A1C | Email: cypher@protonmail.com"
};

input.addEventListener('keydown', e => {
    playTypeTone();
    if(e.key === 'Enter') {
        const val = input.value.trim().toLowerCase();
        const pLine = document.createElement('p');
        pLine.innerHTML = `<span class="prompt">cypher@root:~$</span> ${val}`;
        body.insertBefore(pLine, input.parentElement);
        
        if(val === 'clear') {
            body.querySelectorAll('p').forEach(p => p.remove());
        } else if(commands[val]) {
            const rLine = document.createElement('p');
            rLine.innerHTML = commands[val];
            body.insertBefore(rLine, input.parentElement);
        } else if(val !== '') {
            const eLine = document.createElement('p');
            eLine.style.color = '#ff3344';
            eLine.innerHTML = `Command not found: '${val}'. Type 'help' for options.`;
            body.insertBefore(eLine, input.parentElement);
        }
        input.value = '';
        body.scrollTop = body.scrollHeight;
    }
});

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTypeTone() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = 800 + Math.random() * 200;
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
}