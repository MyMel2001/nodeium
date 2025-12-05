# Nodeium AI Assistant

Nodeium now includes an AI-powered assistant that can help you browse the web using natural language commands and OpenAI-compatible APIs.

## Features

### 🤖 AI Assistant Sidebar
- **Chat Interface**: Clean, modern sidebar with chat history
- **Natural Language Commands**: Talk to the AI naturally
- **Browser Control**: AI can navigate, search, and interact with web pages
- **Context Aware**: AI knows current page URL and title
- **Typing Indicators**: Visual feedback when AI is thinking

### 🔧 Configuration
- **OpenAI Compatible**: Works with OpenAI API and compatible endpoints
- **Custom API Keys**: Users bring their own API keys
- **Custom Endpoints**: Support for custom API URLs (e.g., local models)
- **Secure Storage**: API keys stored locally in browser

### 🎯 Browser Actions
The AI can perform these browser operations:
- **Navigate**: Go to any website
- **Search**: Search the web for information
- **Navigation**: Back, forward, refresh
- **Scroll**: Scroll pages (up, down, top, bottom)
- **Find**: Search for text on current page
- **Context**: Provides information about current page

## Getting Started

### 1. Access the AI Assistant
Click the 🤖 button in the navigation bar to open the AI sidebar.

### 2. Configure Settings
Click the ⚙️ (settings) button in the AI sidebar to open the settings menu. Here you can configure:

- **API Key**: Your OpenAI API key (stored locally and securely)
- **API Endpoint**: OpenAI-compatible endpoint URL
- **Model**: Choose from preset models or enter a custom model name
- **Temperature**: Control response creativity (0.0-2.0)
- **Max Tokens**: Maximum response length (100-4000)
- **Context Awareness**: Let AI see current page URL and title

### 3. Test Connection
Use the "Test Connection" button in settings to verify your API configuration works.

### 4. Alternative Configuration Commands
You can also use chat commands for basic configuration:
- `set api key YOUR_OPENAI_API_KEY`
- `set api url YOUR_API_ENDPOINT`
- `clear chat`
- `help`

#### Example API Endpoints
Default: `https://api.openai.com/v1/chat/completions`

For local models or custom endpoints:
- `http://localhost:1234/v1/chat/completions` (Llama.cpp)
- `http://localhost:8080/v1/chat/completions` (Ollama)
- Your custom OpenAI-compatible endpoint

#### Supported Models
**OpenAI Models:**
- GPT-3.5 Turbo (default)
- GPT-4
- GPT-4 Turbo

**Anthropic Models:**
- Claude 3 Haiku
- Claude 3 Sonnet

**Local Models:**
- Llama 3 8B
- Llama 3 70B
- Any custom model name

## Usage Examples

### Basic Navigation
```
You: Go to wikipedia.org
AI: ACTION: NAVIGATE: https://wikipedia.org
```

### Web Search
```
You: Search for JavaScript tutorials
AI: ACTION: SEARCH: JavaScript tutorials
```

### Page Interaction
```
You: Scroll down on this page
AI: ACTION: SCROLL: down

You: Find the word "tutorial" on this page
AI: ACTION: FIND: tutorial
```

### Information Queries
```
You: What website am I on right now?
AI: You're currently on Wikipedia's main page. The URL is https://www.wikipedia.org/

You: Go back to the previous page
AI: ACTION: BACK
```

## Commands

### Configuration Commands
- `set api key YOUR_KEY` - Configure OpenAI API key
- `set api url YOUR_URL` - Configure custom API endpoint
- `clear chat` - Clear chat history
- `help` - Show help message

### Natural Language Commands
You can use natural language for most operations:
- "Go to google.com"
- "Search for cute cat videos"
- "Scroll up"
- "Go back"
- "Refresh this page"
- "Find contact information"
- "Take me to youtube"

## Technical Details

### API Integration
- Uses browser's built-in `fetch()` API for HTTP requests
- Supports OpenAI Chat Completions API format
- Default model: gpt-3.5-turbo
- Configurable: max tokens, temperature, model selection

### Security
- API keys stored in localStorage (encrypted if browser supports)
- No API keys sent to external servers except configured endpoint
- Content Security Policy restricts external connections

### Browser Control
The AI assistant integrates with Nodeium's existing browser functions:
- `go()` - Navigate to URL
- `back()` - Go back in history
- `forward()` - Go forward in history
- `refresh()` - Refresh current page
- `stop()` - Stop page loading
- `webview.executeJavaScript()` - Execute scripts in webview

## Troubleshooting

### Common Issues

**"Please set your OpenAI API key first"**
- Run: `set api key YOUR_API_KEY`
- Ensure the key is valid and active

**"API Error: 401 Unauthorized"**
- Check your API key is correct
- Verify your API key has sufficient credits
- Ensure the API endpoint URL is correct

**"API Error: Connection failed"**
- Check internet connection
- Verify custom API endpoint is accessible
- For local models, ensure the server is running

**AI not responding**
- Check browser console for errors
- Verify API endpoint is working
- Try refreshing the page

### Debug Mode
Open browser console (F12) to see:
- API request/response details
- Error messages
- Browser action logs

## File Structure

```
├── ai-assistant.js          # Main AI assistant logic
├── index.html              # Updated with AI sidebar UI
├── styles.css              # Updated with AI sidebar styles
└── AI_ASSISTANT_README.md  # This documentation
```

## Privacy

- API keys stored locally in your browser
- Chat history stored locally (can be cleared)
- No data sent to external servers except your configured API endpoint
- You control the AI model and endpoint used

## Compatibility

- Works with OpenAI API and OpenAI-compatible endpoints
- Supports local AI models (Llama.cpp, Ollama, etc.)
- Compatible with GPT-3.5-turbo, GPT-4, Claude, Llama, and other models

## Future Enhancements

Potential future features:
- Voice input/output
- Image analysis
- Form filling
- Multi-step task automation
- Custom action plugins
- Memory/context persistence across sessions

---

**Note**: You must provide your own API key. The AI assistant will not work without a valid API key for an OpenAI-compatible endpoint.
