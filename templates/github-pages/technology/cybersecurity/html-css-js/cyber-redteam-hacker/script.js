const input = document.getElementById('cmdInput');
const history = document.getElementById('terminalHistory');

const commands = {
    'help': 'AVAILABLE COMMANDS:\n  help      - Show this manual\n  bio       - View Red Team Engineer specs\n  cve       - List discovered vulnerability CVEs\n  projects  - Show security exploits & tools\n  contact   - Send encrypted PGP dispatch',
    'bio': 'OFFENSIVE SECURITY ENGINEER // RED TEAM LEAD\nCertifications: OSCP, OSEP, CISSP\nSpecialties: Kernel Exploitation, Zero-Day Research, Active Directory Pwn',
    'cve': 'DISCOVERED CVES:\n  - CVE-2025-9981: Linux Kernel Privilege Escalation\n  - CVE-2024-4412: OAuth2 Token Forgery Zero-Day',
    'projects': 'SECURITY TOOLS:\n  1. PwnKernel-x86_64: Automated exploit payload generator\n  2. NetGhost-Scanner: Stealthy port & protocol auditing daemon',
    'contact': 'ENCRYPTED CHANNEL:\n  PGP Key: 0x99F87A22B\n  Signal: @redteam_leader.sec'
};

if (input && history) {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value.trim().toLowerCase();
            const response = commands[cmd] || `COMMAND NOT RECOGNIZED: '${cmd}'. Type 'help' for commands.`;
            history.innerHTML += `\nroot@redteam-sec:~# ${cmd}\n${response}\n`;
            input.value = '';
            window.scrollTo(0, document.body.scrollHeight);
        }
    });
}
