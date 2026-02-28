# Nodeium

A privacy-focused web browser rewritten in **Python 3** using **PyQt6** and **QtWebEngine**.

Nodeium provides a lightweight browsing experience with built-in ad-blocking, privacy redirections, and an integrated AI assistant.

## Features

- **Ad-Blocking**: Built-in request interceptor with a comprehensive blocklist.
- **Privacy Redirection Technology (PRT)**: Automatically redirects trackers and non-private services (e.g., YouTube, Google Search) to privacy-friendly alternatives (e.g., Yewtu.be, SearXNG).
- **0.0.0.0 Day Fix**: Protection against remote sites attempting to access local network resources (local IPs/hostnames).
- **Integrated AI Assistant**: A sidebar assistant compatible with OpenAI and other OpenAI-compatible APIs (Ollama, LocalAI, etc.), configurable directly in the UI.
- **Tabbed Interface**: Simple and intuitive tab management.
- **Custom User Agents**: Randomly selected user agents to reduce browser fingerprinting.

## Installation

### Prerequisites

You will need **Python 3.9+** installed on your system.

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sparksammy/nodeium.git
   cd nodeium
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python3 main.py
   ```

## Configuration

- **AI Assistant**: Click the `⚙ Settings` button in the AI sidebar to configure your API Base URL, API Key, and Model.
- **Browser Defaults**: Core settings like the homepage and blocklists can be found in `core/config.py`.

## Project Structure

- `main.py`: Application entry point and initialization.
- `browser/`: UI components (Window, WebView, Tabs).
- `network/`: Request interception and ad-blocking logic.
- `ai/`: AI Assistant sidebar and settings.
- `core/`: Constants, utilities, and URL normalization.

## License

[SPL-R5](LICENSE.md)

## What is Privacy Redirection Technology (PRT)?

PRT is a core feature of Nodeium that replaces potentially invasive URLs with privacy-friendly alternatives. It ensures that even if ads aren't 100% blocked, your data is handled by services that respect your privacy.
