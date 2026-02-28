from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEngineProfile
from core.utils import get_random_user_agent

class NodeiumWebView(QWebEngineView):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.custom_user_agent = get_random_user_agent()

    def createWindow(self, type):
        # Handle target="_blank" links by returning a new view which the window will handle
        return self.window().create_tab()

    def load_with_ua(self, url):
        self.page().profile().setHttpUserAgent(self.custom_user_agent)
        self.load(url)
