import random
import re
from urllib.parse import urlparse, quote, parse_qs, urlunparse
from core.config import USER_AGENTS, SEARCH_PATTERN

def get_random_user_agent():
    return random.choice(USER_AGENTS)

def normalize_url(url):
    # Define regex patterns for matching URL schemes and local addresses
    http_pattern = re.compile(r'^http://', re.IGNORECASE)
    https_pattern = re.compile(r'^https://', re.IGNORECASE)
    file_pattern = re.compile(r'^file://', re.IGNORECASE)
    index_pattern = re.compile(r'^index\.html', re.IGNORECASE)
    local_pattern = re.compile(r'^(192\.168|127\.0|localhost)', re.IGNORECASE)

    # Check if the URL already has a valid scheme
    if http_pattern.match(url) or https_pattern.match(url) or file_pattern.match(url) or index_pattern.match(url):
        pass
    elif local_pattern.match(url):
        url = f"http://{url}"
    else:
        url = f"https://{url}"

    # Apply redirections and replacements from libbrowz.js
    if "youtube.com" in url or "youtu.be" in url:
        url = url.replace("youtube.com", "yewtu.be").replace("youtu.be", "yewtu.be")

    parsed = urlparse(url)

    # Google search redirection
    if "google.com" in parsed.netloc and ("/search" in parsed.path or "/?" in url):
        qs = parse_qs(parsed.query)
        if 'q' in qs:
            query = qs['q'][0]
            return SEARCH_PATTERN.format(query=quote(query))

    if url.startswith("https://news.google.com"):
        url = url.replace("https://news.google.com", "https://osn.nodemixaholic.com")
    elif url == "https://passwd/":
        url = "https://vaiult.bitwarden.com"
    elif url in ["https://newtab/", "https://ai/"]:
        url = "https://personal-ai.nodemixaholic.com"
    elif url == "https://nm-jellyfin/":
        url = "https://jelly.nodemixaholic.com"
    elif "google.com" in parsed.netloc:
        # Check for non-google-service exclusions
        exclusions = ["maps", "news", "webstore", "drive", "docs", "sheets", "slides", "mail"]
        if not any(ex in parsed.netloc for ex in exclusions):
            url = url.replace("google.com", "search.sparksammy.com")

    return url

def get_search_url(query):
    return SEARCH_PATTERN.format(query=quote(query))
