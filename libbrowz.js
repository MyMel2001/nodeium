// --- Configuration & Globals ---
let tabGroup = document.querySelector("tab-group");
let currentUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const attachedWebviews = new WeakSet();


// Initialize the UA string in the background
async function getLatestChromeUA() {
    try {
        const response = await fetch('https://www.whatismybrowser.com/guides/the-latest-user-agent/chrome');
        const html = await response.text();
        const uaRegex = /Mozilla\/5.0 [^<]*Chrome\/[0-9.]*[^<]*/;
        const match = html.match(uaRegex);
        return match ? match[0] : currentUA;
    } catch (error) {
        console.error("Error fetching UA, using fallback:", error);
        return currentUA;
    }
}


getLatestChromeUA().then(ua => { currentUA = ua; });

// --- Helper Functions ---
function normalizeUrl(url) {
    const httpPattern = /^http:\/\//i;
    const httpsPattern = /^https:\/\//i;
    const filePattern = /^file:\/\//i;
    const indexPattern = /^index\.html/i;
    const localPattern = /^(192\.168|127\.0|localhost)/i;

    if (httpPattern.test(url) || httpsPattern.test(url) || filePattern.test(url) || indexPattern.test(url)) {
        return url;
    }
    return localPattern.test(url) ? `http://${url}` : `https://${url}`;
}

// --- Webview Setup (Prevents Listener Leaks) ---
function initWebview(browserFrame) {
    if (attachedWebviews.has(browserFrame)) return;

    browserFrame.addEventListener('did-fail-load', (event) => {
        if (event.errorCode === -105 || event.errorCode === -106) {
            let query = browserFrame.getURL() || "search";
            const searchUrl = `https://search.sparksammy.com/search.php?q=${encodeURIComponent(query)}&p=0&t=0`;
            browserFrame.loadURL(searchUrl, { userAgent: currentUA });
        }
    });

    browserFrame.addEventListener('dom-ready', () => {
        try {
            browserFrame.insertCSS(`::-webkit-scrollbar { display: none; }`);
            if (window.settings?.darkModeEnabled) {
                applyDarkModeToWebview(browserFrame);
            }
        } catch (e) { console.error('CSS error:', e); }
    });

    browserFrame.addEventListener("page-title-updated", () => {
        const title = browserFrame.getTitle();
        tabGroup.getActiveTab().setTitle(title);
    });

    attachedWebviews.add(browserFrame);
}

async function runUserscripts(browserFrame) {
    for (const scriptUrl of (window.userscripts || [])) {
        if (!scriptUrl?.trim()) continue;
        try {
            const r = await fetch(scriptUrl);
            const t = await r.text();
            await browserFrame.executeJavaScript(t);
        } catch (e) {
            console.error("Userscript failed:", scriptUrl, e);
        }
    }
}

// --- Main Navigation ---
function go() {
    const activeTab = tabGroup.getActiveTab();
    if (!activeTab) return;

    const browserFrame = activeTab.webview;
    const input = document.getElementById("txtUrl");
    let url = normalizeUrl(input.value);

    // Initial setup for this specific webview instance
    initWebview(browserFrame);

    // URL Routing Logic
    if (url.includes("google.com/search?q") || url.includes("google.com/?q")) {
        const query = new URL(url).searchParams.get('q');
        url = `https://search.sparksammy.com/search.php?q=${query}&p=0&t=0`;
    } else if (url.includes("youtube.com")) {
        url = url.replace("https://youtube.com", "https://boobtube.nodemixaholic.com");
    } else if (url.includes("youtu.be")) {
        url = url.replace("https://youtu.be", "https://boobtube.nodemixaholic.com");
    } else if (url.includes("https://news.google.com")) {
        url = url.replace("https://news.google.com", "https://cnn.com");
    } else if (url === "https://passwd/") {
        url = "https://vault.bitwarden.com";
    } else if (url === "https://newtab/" || url === "https://ai/") {
        url = "https://personal-ai.nodemixaholic.com";
    } else if (url === "https://media/") {
        url = "https://jelly.nodemixaholic.com";
    } else if (url.includes("google.com") && !/maps|news|webstore|drive|docs|sheets|slides|mail/.test(url)) {
        url = url.replace("google.com", "search.sparksammy.com");
    }

    input.value = "";
    browserFrame.loadURL(url, { userAgent: currentUA });
    runUserscripts(browserFrame);
}

// --- Control Functions ---
function stop() { tabGroup.getActiveTab()?.webview.stop(); }
function back() { tabGroup.getActiveTab()?.webview.goBack(); }
function forward() { tabGroup.getActiveTab()?.webview.goForward(); }

function refresh() {
    const browserFrame = tabGroup.getActiveTab()?.webview;
    if (browserFrame) {
        browserFrame.loadURL(browserFrame.getURL(), { userAgent: currentUA });
    } else {
        window.location.reload();
    }
}

// --- Initialization ---
tabGroup.setDefaultTab({
    title: window.CONF?.homepageTitle || "Home",
    src: window.CONF?.homepage || "about:blank",
    active: true
});
tabGroup.addTab();

function clickPress(keyEvent) {
    if (keyEvent.keyCode === 13) go();
}

// --- Styling ---
function applyDarkModeToWebview(webview) {
    const darkModeCSS = `
        html, body { background-color: #1a1a1a !important; color: #e0e0e0 !important; }
        a { color: #64b5f6 !important; }
        input, textarea, select { background-color: #2d2d2d !important; color: #e0e0e0 !important; }
    `;
    webview.insertCSS(darkModeCSS);
}