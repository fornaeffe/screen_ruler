// Mantiene lo stato per ogni tab
const activeTabs = new Set();

chrome.action.onClicked.addListener((tab) => {
  const tabId = tab.id;

  if (activeTabs.has(tabId)) {
    // Già attivo → disattiva
    chrome.tabs.sendMessage(tabId, { action: "stopMeasure" });
    activeTabs.delete(tabId);
  } else {
    // Non attivo → attiva
    chrome.tabs.sendMessage(tabId, { action: "startMeasure" });
    activeTabs.add(tabId);
  }
});