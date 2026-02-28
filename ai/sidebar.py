import json
import requests
import threading
from PyQt6.QtWidgets import (
    QDockWidget, QWidget, QVBoxLayout, QTextEdit,
    QLineEdit, QPushButton, QHBoxLayout, QLabel,
    QDialog, QFormLayout, QComboBox
)
from PyQt6.QtCore import Qt, pyqtSignal, pyqtSlot
from core.config import AI_CONFIG

class AISettingsDialog(QDialog):
    def __init__(self, current_key, current_model, current_url, parent=None):
        super().__init__(parent)
        self.setWindowTitle("AI Assistant Settings")
        self.layout = QFormLayout(self)

        self.url_input = QLineEdit()
        self.url_input.setText(current_url)
        self.url_input.setPlaceholderText("https://api.openai.com/v1")
        self.layout.addRow("API Base URL:", self.url_input)

        self.key_input = QLineEdit()
        self.key_input.setText(current_key)
        self.key_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.layout.addRow("API Key:", self.key_input)

        self.model_input = QComboBox()
        self.model_input.setEditable(True)
        self.model_input.addItems(["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o"])
        self.model_input.setCurrentText(current_model)
        self.layout.addRow("Model:", self.model_input)

        self.save_btn = QPushButton("Save")
        self.save_btn.clicked.connect(self.accept)
        self.layout.addRow(self.save_btn)

    def get_values(self):
        return self.key_input.text(), self.model_input.currentText(), self.url_input.text()

class AISidebar(QDockWidget):
    message_received = pyqtSignal(str, str) # role, message

    def __init__(self, parent=None):
        super().__init__("AI Assistant", parent)
        self.setAllowedAreas(Qt.DockWidgetArea.RightDockWidgetArea | Qt.DockWidgetArea.LeftDockWidgetArea)

        self.container = QWidget()
        self.layout = QVBoxLayout(self.container)

        self.chat_display = QTextEdit()
        self.chat_display.setReadOnly(True)
        self.layout.addWidget(self.chat_display)

        self.settings_btn = QPushButton("⚙ Settings")
        self.settings_btn.clicked.connect(self.open_settings)
        self.layout.addWidget(self.settings_btn)

        self.input_layout = QHBoxLayout()
        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText("Ask AI...")
        self.input_field.returnPressed.connect(self.send_message)

        self.send_btn = QPushButton("Send")
        self.send_btn.clicked.connect(self.send_message)

        self.input_layout.addWidget(self.input_field)
        self.input_layout.addWidget(self.send_btn)
        self.layout.addLayout(self.input_layout)

        self.setWidget(self.container)

        self.message_received.connect(self.display_message)
        self.history = []
        self.api_key = "" # User should set this in settings (TODO)
        self.model = AI_CONFIG['model']
        self.api_url = AI_CONFIG['api_url']

    def open_settings(self):
        dialog = AISettingsDialog(self.api_key, self.model, self.api_url, self)
        if dialog.exec():
            self.api_key, self.model, self.api_url = dialog.get_values()
            self.display_message("system", f"Settings updated. Model: {self.model}")

    def send_message(self):
        text = self.input_field.text().strip()
        if not text:
            return

        self.display_message("user", text)
        self.input_field.clear()

        if not self.api_key:
            self.display_message("assistant", "Please set an API key in core/config.py or settings.")
            return

        self.history.append({"role": "user", "content": text})

        # Run API call in a thread to avoid freezing UI
        threading.Thread(target=self._query_ai, args=(text,), daemon=True).start()

    def _query_ai(self, text):
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": self.model,
                "messages": self.history,
                "max_tokens": AI_CONFIG['max_tokens'],
                "temperature": AI_CONFIG['temperature']
            }

            response = requests.post(
                f"{self.api_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                reply = data['choices'][0]['message']['content']
                self.history.append({"role": "assistant", "content": reply})
                self.message_received.emit("assistant", reply)
            else:
                self.message_received.emit("assistant", f"Error: {response.status_code} - {response.text}")
        except Exception as e:
            self.message_received.emit("assistant", f"Exception: {str(e)}")

    @pyqtSlot(str, str)
    def display_message(self, role, message):
        if role == "user":
            color = "blue"
        elif role == "assistant":
            color = "green"
        else:
            color = "gray"
        self.chat_display.append(f"<b style='color: {color}'>{role.capitalize()}:</b> {message}<br>")
