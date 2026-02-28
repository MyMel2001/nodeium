import re
from PyQt6.QtWebEngineCore import QWebEngineUrlRequestInterceptor
from core.config import TO_BLOCK, REGEX_PATTERNS, LOCALS

class NodeiumRequestInterceptor(QWebEngineUrlRequestInterceptor):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.block_patterns = [p.replace('*', '.*') for p in TO_BLOCK]
        self.regex_patterns = [re.compile(p) for p in REGEX_PATTERNS]

    def interceptRequest(self, info):
        url = info.requestUrl().toString()
        hostname = info.requestUrl().host()
        initiator = info.initiator().host() if not info.initiator().isEmpty() else ""

        # Ad blocking
        if self.contains_ad(url):
            info.block(True)
            return

        # 0.0.0.0 fix
        if self.is_local(hostname):
            if initiator and not self.is_local(initiator):
                print(f"[W] Local domain {hostname} accessed by external source {initiator}, blocking!")
                info.block(True)
                return

    def contains_ad(self, url):
        for pattern in self.block_patterns:
            if re.search(pattern, url):
                return True
        for regex in self.regex_patterns:
            if regex.search(url):
                return True
        return False

    def is_local(self, hostname):
        return any(local in hostname for local in LOCALS)
