// AI Assistant functionality for Nodeium
// Using browser's built-in fetch API

// AI Assistant State
let isSidebarOpen = false;
let chatHistory = [];
let apiKey = null;
let apiUrl = 'https://api.openai.com/v1/chat/completions';

// Configuration - Users can modify these
const AI_CONFIG = {
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7
};

// Initialize AI Assistant
function initAIAssistant() {
    // Load all settings from localStorage
    loadAISettings();
    
    // Initialize settings UI
    initializeSettingsUI();
    
    if (apiKey) {
        addMessage('assistant', 'AI Assistant is ready! How can I help you today? Click ⚙️ to configure settings.');
    } else {
        addMessage('assistant', 'Welcome! Click ⚙️ to configure your AI Assistant settings.');
    }
}

// Load AI settings from localStorage
function loadAISettings() {
    apiKey = localStorage.getItem('openai-api-key') || null;
    apiUrl = localStorage.getItem('openai-api-url') || 'https://api.openai.com/v1/chat/completions';
    AI_CONFIG.model = localStorage.getItem('ai-model') || 'gpt-3.5-turbo';
    AI_CONFIG.temperature = parseFloat(localStorage.getItem('ai-temperature') || '0.7');
    AI_CONFIG.maxTokens = parseInt(localStorage.getItem('ai-max-tokens') || '1000');
    AI_CONFIG.contextAware = localStorage.getItem('ai-context-aware') !== 'false'; // default true
}

// Initialize settings UI with current values
function initializeSettingsUI() {
    // Set current values in settings form
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiUrlInput = document.getElementById('apiUrlInput');
    const modelSelect = document.getElementById('modelSelect');
    const customModelInput = document.getElementById('customModelInput');
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    const maxTokensInput = document.getElementById('maxTokensInput');
    const contextAwareCheckbox = document.getElementById('contextAwareCheckbox');
    
    if (apiKeyInput) apiKeyInput.value = apiKey || '';
    if (apiUrlInput) apiUrlInput.value = apiUrl;
    if (temperatureSlider) {
        temperatureSlider.value = AI_CONFIG.temperature;
        if (temperatureValue) temperatureValue.textContent = AI_CONFIG.temperature;
    }
    if (maxTokensInput) maxTokensInput.value = AI_CONFIG.maxTokens;
    if (contextAwareCheckbox) contextAwareCheckbox.checked = AI_CONFIG.contextAware;
    
    // Set model selection
    if (modelSelect) {
        const options = Array.from(modelSelect.options);
        const customOption = options.find(opt => opt.value === 'custom');
        
        // Check if current model is in the predefined list
        const predefinedModel = options.find(opt => opt.value === AI_CONFIG.model);
        if (predefinedModel) {
            modelSelect.value = AI_CONFIG.model;
            if (customModelInput) customModelInput.style.display = 'none';
        } else {
            // Use custom model
            modelSelect.value = 'custom';
            if (customModelInput) {
                customModelInput.style.display = 'block';
                customModelInput.value = AI_CONFIG.model;
            }
        }
    }
    
    // Add event listeners
    setupSettingsEventListeners();
}

// Setup event listeners for settings
function setupSettingsEventListeners() {
    const modelSelect = document.getElementById('modelSelect');
    const customModelInput = document.getElementById('customModelInput');
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    
    // Handle model selection change
    if (modelSelect) {
        modelSelect.addEventListener('change', function() {
            if (customModelInput) {
                customModelInput.style.display = this.value === 'custom' ? 'block' : 'none';
            }
        });
    }
    
    // Handle temperature slider
    if (temperatureSlider && temperatureValue) {
        temperatureSlider.addEventListener('input', function() {
            temperatureValue.textContent = this.value;
        });
    }
}

// Toggle AI Settings modal
function toggleAISettings() {
    const modal = document.getElementById('aiSettingsModal');
    if (modal) {
        modal.classList.toggle('show');
    }
}

// Save AI Settings
function saveAISettings() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiUrlInput = document.getElementById('apiUrlInput');
    const modelSelect = document.getElementById('modelSelect');
    const customModelInput = document.getElementById('customModelInput');
    const temperatureSlider = document.getElementById('temperatureSlider');
    const maxTokensInput = document.getElementById('maxTokensInput');
    const contextAwareCheckbox = document.getElementById('contextAwareCheckbox');
    
    // Save values
    if (apiKeyInput && apiKeyInput.value.trim()) {
        apiKey = apiKeyInput.value.trim();
        localStorage.setItem('openai-api-key', apiKey);
    }
    
    if (apiUrlInput && apiUrlInput.value.trim()) {
        apiUrl = apiUrlInput.value.trim();
        localStorage.setItem('openai-api-url', apiUrl);
    }
    
    // Save model
    let selectedModel = AI_CONFIG.model;
    if (modelSelect && customModelInput) {
        if (modelSelect.value === 'custom') {
            selectedModel = customModelInput.value.trim() || 'gpt-3.5-turbo';
        } else {
            selectedModel = modelSelect.value;
        }
        AI_CONFIG.model = selectedModel;
        localStorage.setItem('ai-model', selectedModel);
    }
    
    // Save temperature
    if (temperatureSlider) {
        AI_CONFIG.temperature = parseFloat(temperatureSlider.value);
        localStorage.setItem('ai-temperature', AI_CONFIG.temperature.toString());
    }
    
    // Save max tokens
    if (maxTokensInput) {
        AI_CONFIG.maxTokens = parseInt(maxTokensInput.value);
        localStorage.setItem('ai-max-tokens', AI_CONFIG.maxTokens.toString());
    }
    
    // Save context awareness
    if (contextAwareCheckbox) {
        AI_CONFIG.contextAware = contextAwareCheckbox.checked;
        localStorage.setItem('ai-context-aware', AI_CONFIG.contextAware.toString());
    }
    
    // Show success message
    addMessage('assistant', 'Settings saved successfully! ✅');
    toggleAISettings();
    
    // If API key was just set, show ready message
    if (apiKey && !localStorage.getItem('ai-assistant-configured')) {
        localStorage.setItem('ai-assistant-configured', 'true');
        addMessage('assistant', 'AI Assistant is now ready! How can I help you today?');
    }
}

// Reset AI Settings to defaults
function resetAISettings() {
    if (confirm('Are you sure you want to reset all AI settings to defaults? This will clear your API key.')) {
        // Clear localStorage
        localStorage.removeItem('openai-api-key');
        localStorage.removeItem('openai-api-url');
        localStorage.removeItem('ai-model');
        localStorage.removeItem('ai-temperature');
        localStorage.removeItem('ai-max-tokens');
        localStorage.removeItem('ai-context-aware');
        localStorage.removeItem('ai-assistant-configured');
        
        // Reset in-memory values
        apiKey = null;
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        AI_CONFIG.model = 'gpt-3.5-turbo';
        AI_CONFIG.temperature = 0.7;
        AI_CONFIG.maxTokens = 1000;
        AI_CONFIG.contextAware = true;
        
        // Re-initialize UI
        initializeSettingsUI();
        
        addMessage('assistant', 'Settings reset to defaults. Please configure your API key to use the AI Assistant.');
        toggleAISettings();
    }
}

// Test AI Connection
async function testAIConnection() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiUrlInput = document.getElementById('apiUrlInput');
    const modelSelect = document.getElementById('modelSelect');
    const customModelInput = document.getElementById('customModelInput');
    
    const testApiKey = apiKeyInput ? apiKeyInput.value.trim() : apiKey;
    const testApiUrl = apiUrlInput ? apiUrlInput.value.trim() : apiUrl;
    let testModel = AI_CONFIG.model;
    
    if (modelSelect && customModelInput) {
        if (modelSelect.value === 'custom') {
            testModel = customModelInput.value.trim() || 'gpt-3.5-turbo';
        } else {
            testModel = modelSelect.value;
        }
    }
    
    if (!testApiKey) {
        alert('Please enter an API key first.');
        return;
    }
    
    if (!testApiUrl) {
        alert('Please enter an API URL first.');
        return;
    }
    
    // Show testing message
    addMessage('assistant', 'Testing connection... ⏳');
    
    try {
        const response = await fetch(testApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testApiKey}`
            },
            body: JSON.stringify({
                model: testModel,
                messages: [
                    {
                        role: 'user',
                        content: 'Hello, this is a connection test.'
                    }
                ],
                max_tokens: 10
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            addMessage('assistant', '✅ Connection successful! The AI is ready to use.');
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        addMessage('assistant', `❌ Connection failed: ${error.message}`);
    }
}

// Toggle AI Sidebar
function toggleAISidebar() {
    const sidebar = document.getElementById('aiSidebar');
    isSidebarOpen = !isSidebarOpen;
    
    if (isSidebarOpen) {
        sidebar.classList.add('open');
    } else {
        sidebar.classList.remove('open');
    }
}

// Handle Enter key in chat input
function handleChatKeyPress(event) {
    if (event.keyCode === 13) {
        sendChatMessage();
    }
}

// Send chat message
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Clear input
    input.value = '';
    
    // Add user message to chat
    addMessage('user', message);
    
    // Handle configuration commands
    if (message.toLowerCase().startsWith('set api key')) {
        const key = message.substring(11).trim();
        if (key) {
            apiKey = key;
            localStorage.setItem('openai-api-key', key);
            addMessage('assistant', 'API key saved successfully! You can now use the AI Assistant.');
        } else {
            addMessage('assistant', 'Please provide a valid API key. Usage: "set api key YOUR_API_KEY"');
        }
        return;
    }
    
    if (message.toLowerCase().startsWith('set api url')) {
        const url = message.substring(11).trim();
        if (url) {
            apiUrl = url;
            localStorage.setItem('openai-api-url', url);
            addMessage('assistant', 'API URL saved successfully!');
        } else {
            addMessage('assistant', 'Please provide a valid API URL. Usage: "set api url YOUR_API_URL"');
        }
        return;
    }
    
    if (message.toLowerCase() === 'clear chat') {
        chatHistory = [];
        document.getElementById('chatMessages').innerHTML = '';
        addMessage('assistant', 'Chat history cleared!');
        return;
    }
    
    if (message.toLowerCase() === 'help') {
        showHelp();
        return;
    }
    
    // Check if API key is configured
    if (!apiKey) {
        addMessage('assistant', 'Please set your OpenAI API key first. Type "set api key YOUR_KEY" to configure it.');
        return;
    }
    
    try {
        // Show typing indicator
        const typingId = showTypingIndicator();
        
        // Get current browser state for context
        const browserContext = getBrowserContext();
        
        // Prepare messages for API
        const messages = [
            {
                role: 'system',
                content: `You are an AI assistant integrated into the Nodeium browser. You can help users navigate the web, search for information, and interact with web pages. 

Current browser context:
- Current URL: ${browserContext.url}
- Page title: ${browserContext.title}

You can help users with:
- Navigating to websites (e.g., "go to google.com")
- Searching the web (e.g., "search for cats")
- Finding information on current page
- Browser operations (back, forward, refresh)

When you suggest browser actions, use this format:
ACTION: [command]

Available commands:
- NAVIGATE: [url]
- SEARCH: [query]
- BACK
- FORWARD
- REFRESH
- SCROLL: [up/down/top/bottom]
- CLICK: [element description]
- FIND: [text to find]

Be helpful and conversational!`
            },
            ...chatHistory.slice(-10), // Keep last 10 messages for context
            {
                role: 'user',
                content: message
            }
        ];
        
        // Call OpenAI API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: messages,
                max_tokens: AI_CONFIG.maxTokens,
                temperature: AI_CONFIG.temperature
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Add AI response
        addMessage('assistant', aiResponse);
        
        // Check if response contains an action
        const actionMatch = aiResponse.match(/ACTION:\s*(.+)/i);
        if (actionMatch) {
            const action = actionMatch[1].trim();
            executeBrowserAction(action);
        }
        
    } catch (error) {
        console.error('AI Assistant Error:', error);
        removeTypingIndicator(typingId);
        addMessage('assistant', `Error: ${error.message}. Please check your API key and connection.`);
    }
}

// Get current browser context
function getBrowserContext() {
    const webview = document.querySelector('webview');
    let url = 'No page loaded';
    let title = 'No title';
    
    try {
        if (webview) {
            url = webview.getURL() || 'No page loaded';
            title = webview.getTitle() || 'No title';
        }
    } catch (e) {
        console.error('Error getting browser context:', e);
    }
    
    return { url, title };
}

// Execute browser actions
function executeBrowserAction(action) {
    try {
        if (action.toUpperCase().startsWith('NAVIGATE:')) {
            const url = action.substring(9).trim();
            document.getElementById('txtUrl').value = url;
            go();
            addMessage('assistant', `Navigating to ${url}...`);
        }
        else if (action.toUpperCase().startsWith('SEARCH:')) {
            const query = action.substring(7).trim();
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            document.getElementById('txtUrl').value = searchUrl;
            go();
            addMessage('assistant', `Searching for ${query}...`);
        }
        else if (action.toUpperCase() === 'BACK') {
            back();
            addMessage('assistant', 'Going back...');
        }
        else if (action.toUpperCase() === 'FORWARD') {
            forward();
            addMessage('assistant', 'Going forward...');
        }
        else if (action.toUpperCase() === 'REFRESH') {
            refresh();
            addMessage('assistant', 'Refreshing page...');
        }
        else if (action.toUpperCase().startsWith('SCROLL:')) {
            const direction = action.substring(7).trim().toLowerCase();
            const webview = document.querySelector('webview');
            if (webview) {
                let scrollScript = '';
                switch(direction) {
                    case 'up':
                        scrollScript = 'window.scrollBy(0, -500);';
                        break;
                    case 'down':
                        scrollScript = 'window.scrollBy(0, 500);';
                        break;
                    case 'top':
                        scrollScript = 'window.scrollTo(0, 0);';
                        break;
                    case 'bottom':
                        scrollScript = 'window.scrollTo(0, document.body.scrollHeight);';
                        break;
                }
                if (scrollScript) {
                    webview.executeJavaScript(scrollScript);
                    addMessage('assistant', `Scrolling ${direction}...`);
                }
            }
        }
        else if (action.toUpperCase().startsWith('FIND:')) {
            const searchText = action.substring(5).trim();
            const webview = document.querySelector('webview');
            if (webview) {
                webview.executeJavaScript(`
                    const search = "${searchText.replace(/"/g, '\\"')}";
                    window.find(search);
                `);
                addMessage('assistant', `Searching for "${searchText}" on the page...`);
            }
        }
        else {
            addMessage('assistant', `Unknown action: ${action}`);
        }
    } catch (error) {
        console.error('Error executing browser action:', error);
        addMessage('assistant', `Error executing action: ${error.message}`);
    }
}

// Add message to chat
function addMessage(role, content) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.textContent = content;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add to chat history
    chatHistory.push({ role, content });
    
    // Keep chat history manageable
    if (chatHistory.length > 50) {
        chatHistory = chatHistory.slice(-50);
    }
}

// Show typing indicator
function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant typing-indicator';
    typingDiv.id = 'typing-' + Date.now();
    typingDiv.innerHTML = '<span>AI is thinking</span><span>.</span><span>.</span><span>.</span>';
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return typingDiv.id;
}

// Remove typing indicator
function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

// Show help message
function showHelp() {
    const helpText = `
Available commands:
• "set api key YOUR_KEY" - Configure OpenAI API key
• "set api url YOUR_URL" - Configure custom API endpoint
• "clear chat" - Clear chat history
• "help" - Show this help message

You can ask me to:
• Navigate to websites (e.g., "go to wikipedia.org")
• Search for information (e.g., "search for JavaScript tutorials")
• Help with browser operations
• Find information on current page

Just chat naturally and I'll help you browse the web!
    `;
    addMessage('assistant', helpText.trim());
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAIAssistant);
