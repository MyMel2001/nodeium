/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

let tabGroup = document.querySelector("tab-group");

// In your main renderer.js or similar file (outside of ai-assistant.js)
function go() {
    const url = document.getElementById('txtUrl').value;
    const webview = tabGroup.getActiveTab().webview;
    if (webview && url) {
        webview.loadURL(url); // The actual Electron/Chromium webview method
    }
}

// Handle Enter key in URL bar
function clickPress(event) {
    if (event.key === 'Enter') {
        go();
    }
}

// The assistant code expects these to be defined globally
window.go = go; 
window.back = () => tabGroup.getActiveTab().webview.goBack();
window.forward = () => tabGroup.getActiveTab().webview.goForward();
window.refresh = () => tabGroup.getActiveTab().webview.reload();
window.stop = () => tabGroup.getActiveTab().webview.stop();
window.clickPress = clickPress;
