import re

# Ad-blocking lists from main.js
AD_BLOCK_LISTS = [
    'https://easylist.to/easylist/easylist.txt',
    'https://secure.fanboy.co.nz/fanboy-annoyance.txt',
    'https://easylist.to/easylist/easyprivacy.txt',
    'https://easylist-downloads.adblockplus.org/antiadblockfilters.txt',
    'https://raw.githubusercontent.com/hoshsadiq/adblock-nocoin-list/master/nocoin.txt',
    'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/pro.plus.txt',
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/refs/heads/master/filters/filters.txt',
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/refs/heads/master/filters/quick-fixes.txt',
    'https://github.com/uBlockOrigin/uAssets/raw/refs/heads/master/filters/unbreak.txt'
]

# Blocked URL patterns from main.js
TO_BLOCK = [
    "*://*.doubleclick.*",
    "*://s.innovid.com/*",
    "*://partner.googleadservices.com/*",
    "*://*.googlesyndication.com/*",
    "*://*.google-analytics.com/*",
    "*://creative.ak.fbcdn.net/*",
    "*://*.adbrite.com/*",
    "*://*.exponential.com/*",
    "*://*.quantserve.com/*",
    "*://*.scorecardresearch.com/*",
    "*://*.zedo.com/*",
    "*://*.a-ads.com/*",
    "*://*.777partner.com/*",
    "*://*.77tracking.com/*",
    "*://*.abc-ads.com/*",
    "*://*.aaxads.com/*",
    "*://*.adizio.com/*",
    "*://*.adjix.com/*",
    "*://*.adjug.com/*",
    "*://*.adjuggler.com/*",
    "*://*.trafficjunky.net/*",
    "*://*.trafficleader.com/*",
    "*://*.trafficrouter.io/*",
    "*://*.monerominer.rocks/*",
    "*://*.2mdn.net/*",
    "*.exe",
    "*.vbs",
    "*://*.googlesyndication.*",
    "*pixels*",
    "*telemetry*",
    "*analytics*",
    "*://ads.*.com*",
    "*ae/us/audience*",
    "*/api/v*/science*",
    "*/api/v*/typing*"
]

REGEX_PATTERNS = [
    r"r[0-9]+---sn-.*\.googlevideo\.com$",
    r"r[0-9]+-sn-.*\.googlevideo\.com$"
]

# Local domains for 0.0.0.0 day fix
LOCALS = [
    '0.0.0.0', '127.0.0.1', '192.168', '.local', '.example', '.staging', 'fe80::', '::1'
]

# Browser Configuration
HOMEPAGE = "https://personal-ai.nodemixaholic.com"
HOMEPAGE_TITLE = "Personal AI"

# AI Assistant Configuration
AI_CONFIG = {
    'model': 'gpt-3.5-turbo',
    'max_tokens': 1000,
    'temperature': 0.7,
    'api_url': 'https://api.openai.com/v1'
}

# User Agents
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/128.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edg/120.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edg/98.0.0.0",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0"
]

# Search Engine Pattern
SEARCH_PATTERN = "https://search.sparksammy.com/search.php?q={query}&p=0&t=0"

# DOH Servers
DOH_SERVERS = [
    'https://dns9.quad9.net/dns-query',
    'https://cloudflare-dns.com/dns-query'
]
