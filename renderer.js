/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

let tabGroup = document.querySelector("tab-group");

// The assistant code expects these to be defined globally
// These functions are already defined in libbrowz.js, so we just ensure they're available
// and add any additional functionality if needed

// Ensure tabGroup is properly initialized for AI assistant
document.addEventListener('DOMContentLoaded', function() {
    // Wait for tabGroup to be fully initialized
    setTimeout(() => {
        if (typeof window.initAIAssistant === 'function') {
            window.initAIAssistant();
        }
    }, 100);
});
