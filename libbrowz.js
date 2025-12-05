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
    	url = "https://vaiult.bitwarden.com"
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
        browserFrame.insertCSS(`
        ::-webkit-scrollbar {
          display: none;
        }

        `)
    })
    browserFrame.addEventListener("page-title-updated", (titleEvent) => { 
        let title = browserFrame.getTitle()
        tabGroup.getActiveTab().setTitle(title)
        console.log(title)
    })
    for (let i = 0; i < userscripts.length; i++) {
        fetch(userscripts[i]).then( r => r.text() ).then( t =>  userscripts.executeJavaScript(t)).catch(() => {
            console.log("Error loading userscripts! (Did you provide any?)")
        })
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
