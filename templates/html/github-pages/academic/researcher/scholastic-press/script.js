// Scholastic Press Citation Generator Script
document.addEventListener('DOMContentLoaded', () => {
  console.log('Scholastic Press Engine initialized.');

  // Citation database
  const citations = {
    0: {
      APA: 'Rostova, E., & Chen, H. (2025). Decoupling Intent from Autocomplete: The Case for Deliberate Agency in LLM Research Interfaces. Journal of Human-Computer Interaction, 28(3), 145-162.',
      MLA: 'Rostova, Elena, and Herbert Chen. "Decoupling Intent from Autocomplete: The Case for Deliberate Agency in LLM Research Interfaces." Journal of Human-Computer Interaction, vol. 28, no. 3, 2025, pp. 145-162.',
      Chicago: 'Rostova, Elena, and Herbert Chen. "Decoupling Intent from Autocomplete: The Case for Deliberate Agency in LLM Research Interfaces." Journal of Human-Computer Interaction 28, no. 3 (2025): 145-162.'
    },
    1: {
      APA: 'Rostova, E. (2024). Tacit Scaffolding: How Human Investigators Co-construct Knowledge with Probabilistic Databases. Cognitive Science Quarterly, 14(2), 89-104.',
      MLA: 'Rostova, Elena. "Tacit Scaffolding: How Human Investigators Co-construct Knowledge with Probabilistic Databases." Cognitive Science Quarterly, vol. 14, no. 2, 2024, pp. 89-104.',
      Chicago: 'Rostova, Elena. "Tacit Scaffolding: How Human Investigators Co-construct Knowledge with Probabilistic Databases." Cognitive Science Quarterly 14, no. 2 (2024): 89-104.'
    }
  };

  // DOM Elements
  const pubSelect = document.getElementById('pub-select');
  const styleSelect = document.getElementById('style-select');
  const citationText = document.getElementById('citation-text');
  const copyBtn = document.getElementById('copy-citation-btn');

  // Update Citation Box
  function updateCitation() {
    const pubId = pubSelect.value;
    const styleId = styleSelect.value;
    
    if (citations[pubId] && citations[pubId][styleId]) {
      citationText.textContent = citations[pubId][styleId];
    }
  }

  // Event Listeners
  pubSelect.addEventListener('change', updateCitation);
  styleSelect.addEventListener('change', updateCitation);

  // Copy to Clipboard
  copyBtn.addEventListener('click', () => {
    const textToCopy = citationText.textContent;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      // Success feedback
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'COPIED!';
      copyBtn.style.backgroundColor = '#2f5233'; // Muted Green feedback
      
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.backgroundColor = ''; // Restore original
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  });

  // Initial load
  updateCitation();
});
