chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    console.log("Checking if content script is already injected...");
    chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => (!window.measureToolInjected),
    }, (results) => {
        if (results && results[0] && results[0].result) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content.js'],
            })
            .then(() => {
                chrome.scripting.insertCSS({
                    target: { tabId: tabs[0].id },
                    files: ['style.css'],
                });
            })
            .then(() => {
                console.log("Content script injected.");
            });
        } else {
            console.log("Content script already injected.");
        }
        
    });

});

document.getElementById("measureBtn")?.addEventListener("click", () => {
    console.log("Sending startMeasure message to content script...");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "startMeasure" });
        }
    });
});

document.getElementById("stopBtn")?.addEventListener("click", () => {
    console.log("Sending stopMeasure message to content script...");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "stopMeasure" });
        }
    });
});