let slangDict = {};

// Load slang dictionary
fetch(chrome.runtime.getURL('slang.json'))
  .then(response => response.json())
  .then(data => {
    slangDict = data;
  })
  .catch(err => console.error("Error loading slang.json:", err));

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translateSlang",
    title: "Translate '%s' in EgyTranslat",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translateSlang" && info.selectionText) {
    const word = info.selectionText.trim().toLowerCase();
    
    // First, let the content script know we are loading
    chrome.tabs.sendMessage(tab.id, { action: "showLoader" }).catch(() => {});

    // Fetch the word
    fetchWordData(word).then(result => {
      chrome.tabs.sendMessage(tab.id, {
        action: "showResult",
        word: word,
        data: result
      }).catch(() => {});
    }).catch(err => {
      chrome.tabs.sendMessage(tab.id, {
        action: "showError",
        error: "Word not found."
      }).catch(() => {});
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate") {
    fetchWordData(request.word).then(result => {
      if (result.error) {
        sendResponse({ error: result.error });
      } else {
        sendResponse({ data: result });
      }
    });
    return true; // Keep message channel open for async response
  }
});

async function fetchWordData(word) {
  // Check cache first
  const cacheKey = `word_${word}`;
  const cached = await chrome.storage.local.get(cacheKey);
  if (cached[cacheKey]) {
    return cached[cacheKey];
  }

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!response.ok) {
      return { error: "Word not found." };
    }
    const data = await response.json();
    
    // Extract info
    let definition = "";
    let example = "";
    
    if (data[0] && data[0].meanings && data[0].meanings.length > 0) {
      const defObj = data[0].meanings[0].definitions[0];
      definition = defObj.definition || "";
      example = defObj.example || "";
    }

    // Attempt to convert definition to Egyptian Arabic
    let arabicMeaning = slangDict[word] || null;

    if (!arabicMeaning && definition) {
      // Basic fallback using Google Translate API (free tier) for the definition if word not in slang
      try {
        const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(definition)}`);
        const transData = await transRes.json();
        arabicMeaning = transData[0].map(item => item[0]).join("");
      } catch (e) {
        arabicMeaning = "Could not translate meaning.";
      }
    }

    const resultData = {
      definition,
      example,
      arabic: arabicMeaning
    };

    // Save to cache
    await chrome.storage.local.set({ [cacheKey]: resultData });

    return resultData;
  } catch (error) {
    return { error: "Dictionary connection error." };
  }
}
