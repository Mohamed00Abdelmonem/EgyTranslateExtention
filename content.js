let modal = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showLoader") {
    createModal();
    showLoader();
  } else if (request.action === "showResult") {
    createModal();
    showResult(request.word, request.data);
  } else if (request.action === "showError") {
    createModal();
    showError(request.error);
  }
});

function createModal() {
  if (document.getElementById('egytranslat-modal')) {
    modal = document.getElementById('egytranslat-modal');
    return;
  }

  modal = document.createElement('div');
  modal.id = 'egytranslat-modal';
  
  // Check if page prefers dark mode
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (isDark) modal.classList.add('dark-mode');
  
  modal.innerHTML = `
    <div id="egy-header">
      <div id="egy-title-container">
        <img src="${chrome.runtime.getURL('icon.png')}" alt="Logo" class="egy-logo">
        <h3 id="egy-title">EgyTranslat</h3>
        <button id="egy-speak" class="egy-icon-btn hidden" aria-label="Listen">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        </button>
      </div>
      <button id="egy-close">&times;</button>
    </div>
    <div id="egy-content"></div>
  `;

  document.body.appendChild(modal);

  document.getElementById('egy-close').addEventListener('click', () => {
    modal.classList.remove('egy-show');
    setTimeout(() => {
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
        modal = null;
      }
    }, 300);
  });

  document.getElementById('egy-speak').addEventListener('click', () => {
    const word = document.getElementById('egy-title').textContent;
    if (word && word !== 'EgyTranslat' && word !== 'Error') {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  });
}

function showLoader() {
  document.getElementById('egy-speak').classList.add('hidden');
  const content = document.getElementById('egy-content');
  content.innerHTML = `
    <div id="egy-loader">
      <div class="egy-spinner"></div>
      <span>Translating...</span>
    </div>
  `;
  setTimeout(() => modal.classList.add('egy-show'), 10);
  
  // Auto dismiss after 10s if stuck
  setTimeout(() => {
    if (modal && document.getElementById('egy-loader')) {
      showError("Search took too long.");
    }
  }, 10000);
}

function showResult(word, data) {
  document.getElementById('egy-title').textContent = word;
  document.getElementById('egy-speak').classList.remove('hidden');
  const content = document.getElementById('egy-content');
  
  const arMeaning = data.arabic || "Not available in Egyptian slang.";
  const enDef = data.definition || "No definition available.";
  const enExample = data.example ? `"${data.example}"` : "No example available.";

  content.innerHTML = `
    <div id="egy-body">
      <div class="egy-card">
        <span class="egy-label">Egyptian Meaning</span>
        <p id="egy-ar" dir="rtl">${arMeaning}</p>
      </div>
      <div class="egy-card secondary">
        <div class="egy-group">
          <span class="egy-label">Definition</span>
          <p>${enDef}</p>
        </div>
        <div class="egy-group">
          <span class="egy-label">Example</span>
          <p class="egy-example">${enExample}</p>
        </div>
      </div>
    </div>
  `;
  setTimeout(() => modal.classList.add('egy-show'), 10);
}

function showError(msg) {
  document.getElementById('egy-title').textContent = 'Error';
  document.getElementById('egy-speak').classList.add('hidden');
  const content = document.getElementById('egy-content');
  content.innerHTML = `<div id="egy-error">${msg}</div>`;
  setTimeout(() => modal.classList.add('egy-show'), 10);
  
  // Auto dismiss error after 3 seconds
  setTimeout(() => {
    if (modal && document.getElementById('egy-error')) {
      document.getElementById('egy-close').click();
    }
  }, 3000);
}
