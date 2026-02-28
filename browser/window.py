from PyQt6.QtWidgets import (
    QMainWindow, QTabWidget, QToolBar, QLineEdit,
    QPushButton, QVBoxLayout, QWidget, QProgressBar
)
from PyQt6.QtCore import QUrl, Qt
from PyQt6.QtGui import QAction
from browser.view import NodeiumWebView
from core.utils import normalize_url, get_search_url
from core.config import HOMEPAGE, HOMEPAGE_TITLE
from ai.sidebar import AISidebar

class NodeiumMainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Nodeium")
        self.resize(1220, 800)

        # Tabs
        self.tabs = QTabWidget()
        self.tabs.setTabsClosable(True)
        self.tabs.tabCloseRequested.connect(self.close_tab)
        self.tabs.currentChanged.connect(self.current_tab_changed)

        self.setCentralWidget(self.tabs)

        # Navigation Bar
        self.navbar = QToolBar("Navigation")
        self.addToolBar(self.navbar)

        self.back_btn = QAction("Back", self)
        self.back_btn.triggered.connect(lambda: self.current_view().back())
        self.navbar.addAction(self.back_btn)

        self.forward_btn = QAction("Forward", self)
        self.forward_btn.triggered.connect(lambda: self.current_view().forward())
        self.navbar.addAction(self.forward_btn)

        self.reload_btn = QAction("Reload", self)
        self.reload_btn.triggered.connect(lambda: self.current_view().reload())
        self.navbar.addAction(self.reload_btn)

        self.stop_btn = QAction("Stop", self)
        self.stop_btn.triggered.connect(lambda: self.current_view().stop())
        self.navbar.addAction(self.stop_btn)

        self.new_tab_btn = QAction("+", self)
        self.new_tab_btn.triggered.connect(lambda: self.create_tab(QUrl(HOMEPAGE)))
        self.navbar.addAction(self.new_tab_btn)

        self.url_bar = QLineEdit()
        self.url_bar.returnPressed.connect(self.navigate_to_url)
        self.navbar.addWidget(self.url_bar)

        # AI Sidebar
        self.sidebar = AISidebar(self)
        self.addDockWidget(Qt.DockWidgetArea.RightDockWidgetArea, self.sidebar)

        self.toggle_sidebar_btn = QAction("AI", self)
        self.toggle_sidebar_btn.triggered.connect(lambda: self.sidebar.setVisible(not self.sidebar.isVisible()))
        self.navbar.addAction(self.toggle_sidebar_btn)

        # Initial Tab
        self.create_tab(QUrl(HOMEPAGE))

    def create_tab(self, qurl=None):
        view = NodeiumWebView()
        if qurl:
            view.load(qurl)

        i = self.tabs.addTab(view, "New Tab")
        self.tabs.setCurrentIndex(i)

        view.urlChanged.connect(lambda qurl, view=view: self.update_url(qurl, view))
        view.titleChanged.connect(lambda title, view=view: self.update_title(title, view))
        view.loadFinished.connect(lambda _, view=view: self.load_finished(view))

        return view

    def close_tab(self, i):
        if self.tabs.count() < 2:
            return
        self.tabs.removeTab(i)

    def current_view(self):
        return self.tabs.currentWidget()

    def navigate_to_url(self):
        url_text = self.url_bar.text()
        normalized = normalize_url(url_text)
        self.current_view().load(QUrl(normalized))

    def update_url(self, qurl, view):
        if view == self.current_view():
            self.url_bar.setText(qurl.toString())

    def update_title(self, title, view):
        i = self.tabs.indexOf(view)
        if i != -1:
            self.tabs.setTabText(i, title)

    def load_finished(self, view):
        # Handle failed loads (simulating libbrowz logic)
        # In PyQt, we can check for errors, but simple redirection logic often handles it
        pass

    def current_tab_changed(self, i):
        view = self.tabs.widget(i)
        if view:
            self.url_bar.setText(view.url().toString())
            self.setWindowTitle(f"Nodeium - {view.title()}")
