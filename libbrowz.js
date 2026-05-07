const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/128.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edg/120.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edg/98.0.0.0",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/128.0"
];

function getRandomUserAgent() {
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomIndex];
}

let currentUA = "" // We haven't loaded any websites yet. It should be blank.

let tabGroup = document.querySelector("tab-group");
function normalizeUrl(url) {
    // Define regex patterns for matching URL schemes and local addresses
    const httpPattern = /^http:\/\//i;
    const httpsPattern = /^https:\/\//i;
    const filePattern = /^file:\/\//i;
    const indexPattern = /^index\.html/i;
    const localPattern = /^(192\.168|127\.0|localhost)/i;

    // Check if the URL already has a valid scheme
    if (httpPattern.test(url) || httpsPattern.test(url) || filePattern.test(url) || indexPattern.test(url)) {
        return url;
    }

    // Determine if the URL starts with a local address or needs HTTPS
    if (localPattern.test(url)) {
        return `http://${url}`;
    } else {
        return `https://${url}`;
    }
}

let url = undefined
let urlRaw = undefined
let browserFrame = undefined



function go() {
    currentUA = getRandomUserAgent()
    browserFrame = tabGroup.getActiveTab().webview
    let browser = tabGroup.getActiveTab()
    url = normalizeUrl(document.getElementById("txtUrl").value)
    urlRaw = document.getElementById("txtUrl").value
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
    	url = url.replaceAll("youtube.com", "yewtu.be")
    	url = url.replaceAll("youtu.be", "yewtu.be")
    } else if (url.includes("google.com/search?q") || url.includes("google.com/?q")) {
        // Define the URL object
        const serachUrlObj = new URL(url);
        //Get query from old url
        const query = serachUrlObj.searchParams.get('q');
        // Define the pattern for URL replacement
        const searchPattern = `https://search.sparksammy.com/search.php?q=${query}&p=0&t=0`;
        url = searchPattern; // Apply the search pattern
    } else if (url.includes("https://news.google.com")) {
    	url = url.replaceAll("https://news.google.com", "https://osn.nodemixaholic.com")
    } else if (url == "https://passwd/") {
    	url = "https://vault.bitwarden.com"
    } else if (url == "https://newtab/" || url == "https://ai/") {
    	url = "https://personal-ai.nodemixaholic.com"
    } else if (url == "https://nm-jellyfin/") {
    	url = "https://jelly.nodemixaholic.com"
    } else if (url.includes("google.com") && !url.includes("maps") && !url.includes("news") && !url.includes("webstore") && !url.includes("drive") && !url.includes("docs") && !url.includes("sheets") && !url.includes("slides") && !url.includes("mail")) {
    	url = url.replaceAll("google.com", "search.sparksammy.com")
    }
    document.getElementById("txtUrl").value = ""


    browserFrame.loadURL(url, {userAgent: currentUA});
    
    // Add error handler for when name is not resolved
    browserFrame.addEventListener('did-fail-load', (event) => {
        if (event.errorCode === -105 || event.errorCode === -106) { // Name not resolved or connection failed
            console.log(`Failed to load ${url}, redirecting to search...`);
            
            // Extract the query from the original URL
            let query = urlRaw;
            // If it's a full URL, extract just the hostname or path
            if (urlRaw.includes('://')) {
                try {
                    const urlObj = new URL(urlRaw);
                    query = urlObj.hostname || urlObj.pathname || urlRaw;
                } catch (e) {
                    // If URL parsing fails, use the raw input
                    query = urlRaw;
                }
            }
            
            // Clean up the query (remove protocol, etc.)
            query = query.replace(/^https?:\/\//, '')
                        .replace(/^www\./, '')
                        .replace(/\/$/, '');
            
            // Redirect to search pattern
            const searchUrl = `https://search.sparksammy.com/search.php?q=${encodeURIComponent(query)}&p=0&t=0`;
            browserFrame.loadURL(searchUrl, {userAgent: currentUA});
        }
    });
    
    browserFrame.addEventListener('dom-ready', () => {
        try {
            browserFrame.insertCSS(`
            ::-webkit-scrollbar {
              display: none;
            }

            `)

            // Apply dark mode if enabled
            if (window.settings && window.settings.darkModeEnabled) {
                applyDarkModeToWebview(browserFrame);
            }
        } catch (error) {
            console.error('Error in dom-ready handler:', error);
        }
    })
    browserFrame.addEventListener("page-title-updated", (titleEvent) => { 
        let title = browserFrame.getTitle()
        tabGroup.getActiveTab().setTitle(title)
        console.log(title)
    })
    for (let i = 0; i < userscripts.length; i++) {
        const scriptUrl = userscripts[i];
        if (scriptUrl && scriptUrl.trim()) {
            fetch(scriptUrl).then( r => r.text() ).then( t => browserFrame.executeJavaScript(t)).catch(() => {
                console.log("Error loading userscripts! (Did you provide any?)")
            })
        }
    }
}

function stop() {
    let browserFrame = tabGroup.getActiveTab().webview
    browserFrame.stop()
}

function back() {
    let browserFrame = tabGroup.getActiveTab().webview
    browserFrame.goBack()
}

function forward() {
    let browserFrame = tabGroup.getActiveTab().webview
    browserFrame.goForward()
}

function refresh() {
    if (typeof url != undefined) {
        browserFrame.loadURL(browserFrame.getURL(), 
            {userAgent: currentUA});
    } else {
        window.location.reload()
    }
}

tabGroup.setDefaultTab({
    title: CONF.homepageTitle,
    src: CONF.homepage,
    active: true
});
tabGroup.addTab()

function clickPress(keyEvent) {
    if (keyEvent.keyCode == 13) {
        go()
    }
}

// Dark mode CSS injection
function applyDarkModeToWebview(webview) {
    if (!webview || !webview.insertCSS) {
        return;
    }
    const darkModeCSS = `
        html, body {
            background-color: #1a1a1a !important;
            color: #e0e0e0 !important;
        }

        /* Only apply to light backgrounds */
        :not([data-theme="dark"]):not(.dark-mode):not(.dark) {
            background-color: #1a1a1a !important;
            color: #e0e0e0 !important;
        }

        a {
            color: #64b5f6 !important;
        }

        input, textarea, select {
            background-color: #2d2d2d !important;
            color: #e0e0e0 !important;
            border-color: #444 !important;
        }

        button {
            background-color: #3d3d3d !important;
            color: #e0e0e0 !important;
        }

        img {
            filter: brightness(0.9) contrast(1.1);
        }

        /* Preserve dark mode elements */
        [data-theme="dark"],
        .dark-mode,
        .dark {
            background-color: inherit !important;
            color: inherit !important;
        }

        /* Detect and preserve existing dark mode */
        @media (prefers-color-scheme: dark) {
            html, body {
                background-color: inherit !important;
                color: inherit !important;
            }
        }
    `;

    webview.insertCSS(darkModeCSS);
}

// Check if site is already in dark mode
function isSiteDarkMode(webview) {
    if (!webview || !webview.executeJavaScript) {
        return Promise.resolve(false);
    }
    return webview.executeJavaScript(`
        (function() {
            const html = document.documentElement;
            const body = document.body;

            // Check for dark mode attributes
            if (html.getAttribute('data-theme') === 'dark' ||
                html.getAttribute('data-color-mode') === 'dark' ||
                html.classList.contains('dark-mode') ||
                html.classList.contains('dark') ||
                body.classList.contains('dark-mode') ||
                body.classList.contains('dark')) {
                return true;
            }

            // Check for dark mode via CSS variables
            const computedStyle = window.getComputedStyle(html);
            const bgVar = computedStyle.getPropertyValue('--color-bg') ||
                          computedStyle.getPropertyValue('--background-color') ||
                          computedStyle.getPropertyValue('--bg-color');
            if (bgVar && (bgVar.includes('#1') || bgVar.includes('#0') || bgVar.includes('rgb(0') || bgVar.includes('rgb(1'))) {
                return true;
            }

            // Check computed styles with a delay to ensure CSS is loaded
            const htmlStyle = window.getComputedStyle(html);
            const bodyStyle = window.getComputedStyle(body);

            const htmlBg = htmlStyle.backgroundColor;
            const bodyBg = bodyStyle.backgroundColor;

            // Parse RGB values
            function parseColor(color) {
                const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (match) {
                    return {
                        r: parseInt(match[1]),
                        g: parseInt(match[2]),
                        b: parseInt(match[3])
                    };
                }
                return null;
            }

            const htmlRgb = parseColor(htmlBg);
            const bodyRgb = parseColor(bodyBg);

            // Check if background is dark (luminance < 128)
            function isDark(rgb) {
                if (!rgb) return false;
                const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
                return luminance < 128;
            }

            // Also check if text color is light (indicates dark background)
            function isLight(rgb) {
                if (!rgb) return false;
                const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
                return luminance > 128;
            }

            const htmlColor = parseColor(htmlStyle.color);
            const bodyColor = parseColor(bodyStyle.color);

            // If background is dark OR text is light, it's likely dark mode
            return isDark(htmlRgb) || isDark(bodyRgb) || isLight(htmlColor) || isLight(bodyColor);
        })()
    `).catch(() => false);
}

// Smart dark mode that only applies to light mode sites
async function applySmartDarkMode(webview) {
    try {
        const isDark = await isSiteDarkMode(webview);

        if (!isDark) {
            // Site is in light mode, apply dark mode
            applyDarkModeToWebview(webview);
        }
        // If site is already dark, do nothing
    } catch (error) {
        console.error('Failed to apply smart dark mode:', error);
    }
}
