document.addEventListener('DOMContentLoaded', async () => {
  const wordInput = document.getElementById('wordInput');
  const searchBtn = document.getElementById('searchBtn');
  const resultDiv = document.getElementById('result');
  const errorDiv = document.getElementById('error');
  const loader = document.getElementById('loader');
  
  const origWord = document.getElementById('origWord');
  const arMeaning = document.getElementById('arMeaning');
  const enDef = document.getElementById('enDef');
  const enExample = document.getElementById('enExample');
  const speakBtn = document.getElementById('speakBtn');

  const themeToggle = document.getElementById('themeToggle');
  const moonIcon = document.getElementById('moon-icon');
  const sunIcon = document.getElementById('sun-icon');

  // Load Theme
  const data = await chrome.storage.local.get('theme');
  if (data.theme === 'dark') {
    document.body.classList.replace('light', 'dark');
    moonIcon.classList.add('hidden');
    sunIcon.classList.remove('hidden');
  }

  // Theme Toggle
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    if (isDark) {
      document.body.classList.replace('dark', 'light');
      moonIcon.classList.remove('hidden');
      sunIcon.classList.add('hidden');
      chrome.storage.local.set({ theme: 'light' });
    } else {
      document.body.classList.replace('light', 'dark');
      moonIcon.classList.add('hidden');
      sunIcon.classList.remove('hidden');
      chrome.storage.local.set({ theme: 'dark' });
    }
  });

  wordInput.focus();

  speakBtn.addEventListener('click', () => {
    const word = origWord.textContent;
    if (word) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  });

  searchBtn.addEventListener('click', handleSearch);
  wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  async function handleSearch() {
    const word = wordInput.value.trim().toLowerCase();
    if (!word) return;

    resultDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    
    // Remove and re-add slide-up class for animation restart
    resultDiv.classList.remove('slide-up');
    errorDiv.classList.remove('slide-up');
    void resultDiv.offsetWidth; // trigger reflow
    void errorDiv.offsetWidth;

    loader.classList.remove('hidden');

    try {
      const response = await chrome.runtime.sendMessage({ action: "translate", word: word });
      loader.classList.add('hidden');

      if (response.error) {
        showError(response.error);
        return;
      }

      showResult(word, response.data);
    } catch (err) {
      loader.classList.add('hidden');
      showError("Connection problem occurred. Please make sure the extension is properly loaded.");
    }
  }

  function showResult(word, data) {
    origWord.textContent = word;
    arMeaning.textContent = data.arabic || "Not available in Egyptian slang.";
    enDef.textContent = data.definition || "No definition available.";
    enExample.textContent = data.example ? `"${data.example}"` : "No example available.";
    
    resultDiv.classList.remove('hidden');
    resultDiv.classList.add('slide-up');
  }

  function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.classList.remove('hidden');
    errorDiv.classList.add('slide-up');
  }
});
