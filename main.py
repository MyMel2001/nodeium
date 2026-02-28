import sys
import os
from PyQt6.QtWidgets import QApplication
from PyQt6.QtWebEngineCore import QWebEngineProfile
from browser.window import NodeiumMainWindow
from network.interceptor import NodeiumRequestInterceptor

def main():
    # Set Chromium flags (e.g. for proxy, etc)
    # os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = "--force-dark-mode"

    app = QApplication(sys.argv)
    app.setApplicationName("Nodeium")
    app.setOrganizationName("Nodeium")

    # Set up global request interceptor
    interceptor = NodeiumRequestInterceptor()
    QWebEngineProfile.defaultProfile().setUrlRequestInterceptor(interceptor)

    window = NodeiumMainWindow()
    window.show()

    sys.exit(app.exec())

if __name__ == "__main__":
    main()
