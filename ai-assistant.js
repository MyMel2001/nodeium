// AI Assistant functionality for Nodeium
// Using browser's built-in fetch API

// AI Assistant State
let isSidebarOpen = false;
let chatHistory = [];
let apiKey = null;
let apiUrl = 'https://api.openai.com/v1';

// Configuration - Users can modify these
const AI_CONFIG = {
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7,
    contextAware: true // Added contextAware to AI_CONFIG for completeness
};

// =================================================================
// 1. Initialization and Settings Management
// =================================================================

/**
 * Initialize AI Assistant on DOM load.
 */
function initAIAssistant() {
    // Load all settings from localStorage
    loadAISettings();
    
    // Initialize settings UI
    initializeSettingsUI();
    
    // Check if the required browser control functions exist (e.g., in the main app context)
    if (typeof go !== 'function' || typeof back !== 'function' || typeof forward !== 'function' || typeof refresh !== 'function') {
        console.error("Critical browser functions (go, back, forward, refresh) are missing from the global scope. Agent actions will fail.");
        addMessage('assistant', '⚠️ **Error:** Critical browser functions are missing. Agent actions will be limited.');
    }

    if (apiKey) {
        addMessage('assistant', 'AI Assistant is ready! How can I help you today? Click ⚙️ to configure settings.');
    } else {
        addMessage('assistant', 'Welcome! Click ⚙️ to configure your OpenAI API Key and settings.');
    }
}

/**
 * Load AI settings from localStorage.
 */
function loadAISettings() {
    apiKey = localStorage.getItem('openai-api-key') || null;
    apiUrl = localStorage.getItem('openai-api-url') || 'https://api.openai.com/v1';
    AI_CONFIG.model = localStorage.getItem('ai-model') || 'gpt-3.5-turbo';
    // Use || '0.7' for robustness against null/empty strings
    AI_CONFIG.temperature = parseFloat(localStorage.getItem('ai-temperature') || '0.7'); 
    AI_CONFIG.maxTokens = parseInt(localStorage.getItem('ai-max-tokens') || '1000', 10); // Added radix 10
    // Fix: Check for 'false' string to correctly set boolean.
    AI_CONFIG.contextAware = localStorage.getItem('ai-context-aware') !== 'false'; 
}

/**
 * Initialize settings UI with current values.
 */
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
        // Ensure initial value is set, and update display value
        temperatureSlider.value = AI_CONFIG.temperature;
        if (temperatureValue) temperatureValue.textContent = AI_CONFIG.temperature.toFixed(1); // Format to 1 decimal place
    }
    if (maxTokensInput) maxTokensInput.value = AI_CONFIG.maxTokens;
    if (contextAwareCheckbox) contextAwareCheckbox.checked = AI_CONFIG.contextAware;
    
    // Set model selection
    if (modelSelect) {
        const options = Array.from(modelSelect.options);
        
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

/**
 * Setup event listeners for settings.
 */
function setupSettingsEventListeners() {
    const modelSelect = document.getElementById('modelSelect');
    const customModelInput = document.getElementById('customModelInput');
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    const testConnectionButton = document.getElementById('testConnectionButton'); // Assuming a button with this ID exists
    
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
            // Format to 1 decimal place for cleaner display
            temperatureValue.textContent = parseFloat(this.value).toFixed(1); 
        });
    }
    
    // Add event listener for the Test Connection button
    if (testConnectionButton) {
        testConnectionButton.addEventListener('click', testAIConnection);
    }
}

/**
 * Toggle AI Settings modal.
 */
function toggleAISettings() {
    const modal = document.getElementById('aiSettingsModal');
    if (modal) {
        modal.classList.toggle('show');
    }
}

/**
 * Save AI Settings to localStorage and in-memory config.
 */
function saveAISettings() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiUrlInput = document.getElementById('apiUrlInput');
    const modelSelect = document.getElementById('modelSelect');
    const customModelInput = document.getElementById('customModelInput');
    const temperatureSlider = document.getElementById('temperatureSlider');
    const maxTokensInput = document.getElementById('maxTokensInput');
    const contextAwareCheckbox = document.getElementById('contextAwareCheckbox');
    
    // Check if API key is being cleared.
    const wasApiKeySet = !!apiKey;
    const newApiKey = apiKeyInput && apiKeyInput.value.trim() ? apiKeyInput.value.trim() : null;

    // Save API Key
    if (apiKeyInput) {
        apiKey = newApiKey;
        if (apiKey) {
            localStorage.setItem('openai-api-key', apiKey);
        } else {
            localStorage.removeItem('openai-api-key');
        }
    }
    
    // Save API URL
    if (apiUrlInput && apiUrlInput.value.trim()) {
        apiUrl = apiUrlInput.value.trim();
        localStorage.setItem('openai-api-url', apiUrl);
    }
    
    // Save model
    let selectedModel = AI_CONFIG.model;
    if (modelSelect && customModelInput) {
        if (modelSelect.value === 'custom') {
            // Use fallback if custom input is empty
            selectedModel = customModelInput.value.trim() || 'gpt-3.5-turbo'; 
        } else {
            selectedModel = modelSelect.value;
        }
        AI_CONFIG.model = selectedModel;
        localStorage.setItem('ai-model', selectedModel);
    }
    
    // Save temperature (with input validation/fallback)
    if (temperatureSlider) {
        const tempValue = parseFloat(temperatureSlider.value);
        if (!isNaN(tempValue)) {
            AI_CONFIG.temperature = tempValue;
            localStorage.setItem('ai-temperature', AI_CONFIG.temperature.toString());
        }
    }
    
    // Save max tokens (with input validation/fallback)
    if (maxTokensInput) {
        const tokenValue = parseInt(maxTokensInput.value, 10);
        if (!isNaN(tokenValue) && tokenValue > 0) {
            AI_CONFIG.maxTokens = tokenValue;
            localStorage.setItem('ai-max-tokens', AI_CONFIG.maxTokens.toString());
        }
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
    if (apiKey && !wasApiKeySet) {
        localStorage.setItem('ai-assistant-configured', 'true');
        addMessage('assistant', 'AI Assistant is now ready! How can I help you today?');
    } else if (!apiKey) {
        addMessage('assistant', 'API Key has been cleared. Please configure your API key to use the AI Assistant.');
    }
}

/**
 * Reset AI Settings to defaults.
 */
function resetAISettings() {
    if (confirm('Are you sure you want to reset all AI settings to defaults? This will clear your API key.')) {
        // Clear localStorage
        localStorage.clear(); // A more aggressive clear, assuming this storage is ONLY for AI settings. If not, use individual removers.
        
        // Individual removers for safety:
        localStorage.removeItem('openai-api-key');
        localStorage.removeItem('openai-api-url');
        localStorage.removeItem('ai-model');
        localStorage.removeItem('ai-temperature');
        localStorage.removeItem('ai-max-tokens');
        localStorage.removeItem('ai-context-aware');
        localStorage.removeItem('ai-assistant-configured');
        
        // Reset in-memory values
        apiKey = null;
        apiUrl = 'https://api.openai.com/v1';
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

/**
 * Test AI Connection using current or unsaved settings.
 */
async function testAIConnection() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiUrlInput = document.getElementById('apiUrlInput');
    const modelSelect = document.getElementById('modelSelect');
    const customModelInput = document.getElementById('customModelInput');
    
    const testApiKey = apiKeyInput ? apiKeyInput.value.trim() : apiKey;
    let testApiUrl = apiUrlInput ? apiUrlInput.value.trim() : apiUrl;
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

    // Determine the chat completions endpoint based on API URL.
    let chatCompletionsUrl = getChatCompletionsUrl(testApiUrl);
    
    // Show testing message
    addMessage('assistant', 'Testing connection... ⏳');
    
    try {
        const response = await fetch(chatCompletionsUrl, { // Use the full chat completions URL here
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
                max_tokens: 10 // Use a small max_tokens for a fast test
            })
        });
        
        if (response.ok) {
            // Check for a valid JSON response before declaring success
            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                addMessage('assistant', '✅ Connection successful! The AI is ready to use.');
            } else {
                 throw new Error('API returned an unexpected successful response structure. Check model name.');
            }
        } else {
            // Try to extract a more detailed error message from the response body
            let errorDetail = response.statusText;
            try {
                const errorData = await response.json();
                errorDetail = errorData.error ? errorData.error.message : response.statusText;
            } catch (e) {
                // Ignore JSON parsing error if the response wasn't JSON
            }
            throw new Error(`HTTP ${response.status}: ${errorDetail}`);
        }
    } catch (error) {
        // Fix: Use an alert for settings context, and a chat message for visibility
        console.error('Connection Test Error:', error);
        alert(`Connection failed: ${error.message}`);
        addMessage('assistant', `❌ Connection failed: ${error.message}`);
    }
}

// =================================================================
// 2. Sidebar and Chat Functionality
// =================================================================

/**
 * Toggle AI Sidebar.
 */
function toggleAISidebar() {
    const sidebar = document.getElementById('aiSidebar');
    // Simplified logic: toggle state and class based on the sidebar's current class.
    if (sidebar) {
        isSidebarOpen = !sidebar.classList.contains('open');
        sidebar.classList.toggle('open', isSidebarOpen);
    }
}

/**
 * Handle Enter key in chat input.
 * @param {KeyboardEvent} event 
 */
function handleChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) { // Added check for shiftKey to allow multi-line input
        event.preventDefault(); // Prevent default action (like new line)
        sendChatMessage();
    }
}

/**
 * Send chat message to AI.
 */
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Clear input
    input.value = '';
    
    // Add user message to chat
    addMessage('user', message);
    
    // Handle configuration commands
    if (handleLocalCommands(message)) {
        return;
    }
    
    // Check if API key is configured
    if (!apiKey) {
        addMessage('assistant', '🚨 **Configuration Error:** Please set your OpenAI API key first. Type "set api key YOUR_KEY" or use the settings panel (⚙️).');
        return;
    }
    
    let typingId = null;
    try {
        // Show typing indicator
        typingId = showTypingIndicator();
        
        // Get current browser state for context
        const browserContext = getBrowserContext();
        
        // Prepare messages for API
        let messages = [];

        // System message with context and action guide (always included)
        messages.push({
            role: 'system',
            content: createSystemPrompt(browserContext)
        });
        
        // Add chat history for context if enabled
        if (AI_CONFIG.contextAware) {
             // Keep last 10 messages for context (slice(-20) keeps 10 pairs of user/assistant)
            const historyToInclude = chatHistory.slice(-20).filter(msg => msg.role !== 'system');
            messages = messages.concat(historyToInclude); 
        }

        // Add the current user message
        messages.push({
            role: 'user',
            content: message
        });
        
        // Determine the chat completions endpoint
        const chatCompletionsUrl = getChatCompletionsUrl(apiUrl);
        
        // Call OpenAI API
        const response = await fetch(chatCompletionsUrl, {
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
            let errorDetail = response.statusText;
             try {
                const errorData = await response.json();
                errorDetail = errorData.error ? errorData.error.message : response.statusText;
            } catch (e) {
                // Ignore JSON parsing error if the response wasn't JSON
            }
            throw new Error(`API Error ${response.status}: ${errorDetail}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Check if response contains actions (support for chained commands)
        // Use a more robust regex that ignores case and extracts the action content cleanly.
        const actionMatches = [...aiResponse.matchAll(/ACTION:\s*(.+)/gi)];
        
        // Split the response into conversational part and actions
        let conversationalResponse = aiResponse;
        let actions = [];
        
        if (actionMatches.length > 0) {
            // Extract actions from the response
            actions = actionMatches.map(match => match[1].trim());
            
            // Remove ACTION: lines from the conversational response
            conversationalResponse = aiResponse.replace(/ACTION:\s*(.+)/gi, '').trim();
        }
        
        // Add the conversational response (without ACTION: lines)
        if (conversationalResponse) {
            addMessage('assistant', conversationalResponse);
        }
        
        // Execute all actions in sequence
        if (actions.length > 0) {
            actions.forEach((action, index) => {
                // Add a small delay between chained actions for better reliability
                setTimeout(() => {
                    executeBrowserAction(action);
                }, index * 500); // 500ms delay between each action
            });
        }
        
    } catch (error) {
        console.error('AI Assistant Error:', error);
        removeTypingIndicator(typingId);
        addMessage('assistant', `❌ **Communication Error:** ${error.message}. Please check your API key, API URL, and model name in the settings (⚙️).`);
    }
}

/**
 * Handle in-chat local commands like 'set api key', 'clear chat', 'help'.
 * @param {string} message - The user's input message.
 * @returns {boolean} True if a local command was executed, false otherwise.
 */
function handleLocalCommands(message) {
    const lowerMessage = message.toLowerCase().trim();

    if (lowerMessage.startsWith('set api key')) {
        const key = message.substring(11).trim();
        if (key) {
            apiKey = key;
            localStorage.setItem('openai-api-key', key);
            addMessage('assistant', '🔑 API key saved successfully! You can now use the AI Assistant.');
        } else {
            addMessage('assistant', '⚠️ Please provide a valid API key. Usage: "set api key YOUR_API_KEY"');
        }
        return true;
    }
    
    if (lowerMessage.startsWith('set api url')) {
        const url = message.substring(11).trim();
        if (url) {
            apiUrl = url;
            localStorage.setItem('openai-api-url', url);
            addMessage('assistant', '🔗 API URL saved successfully!');
        } else {
            addMessage('assistant', '⚠️ Please provide a valid API URL. Usage: "set api url YOUR_API_URL"');
        }
        return true;
    }
    
    if (lowerMessage === 'clear chat') {
        chatHistory = [];
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        addMessage('assistant', '🧹 Chat history cleared!');
        return true;
    }
    
    if (lowerMessage === 'help') {
        showHelp();
        return true;
    }

    if (lowerMessage === 'settings') {
        toggleAISettings();
        return true;
    }
    
    return false;
}


// =================================================================
// 3. Browser Context and Action Execution
// =================================================================

/**
 * Get the current browser context (URL and Title) from the webview.
 * @returns {{url: string, title: string}}
 */
function getBrowserContext() {
    let tabGroup = document.querySelector("tab-group");
    const webview = tabGroup && tabGroup.getActiveTab() ? tabGroup.getActiveTab().webview : null;
    let url = 'No page loaded or webview not found';
    let title = 'No title';
    
    try {
        // Check if webview exists and has loaded content
        if (webview) {
            // Check if the webview has a src attribute or getURL() returns a valid URL
            const currentUrl = webview.getURL();
            if (currentUrl && currentUrl !== 'about:blank') {
                url = currentUrl;
                title = webview.getTitle() || title;
            } else if (webview.src && webview.src !== 'about:blank') {
                url = webview.src;
                title = 'Loading...';
            }
        }
    } catch (e) {
        // Suppress this specific error during chat, as it clutters the console
        // console.error('Error getting browser context:', e);
    }
    
    return { url, title };
}

/**
 * Creates the dynamic system prompt for the AI model.
 * @param {{url: string, title: string}} browserContext
 * @returns {string} The complete system prompt.
 */
function createSystemPrompt(browserContext) {
    // Use a template literal for a cleaner, more readable prompt
    const systemPrompt = `You are an AI assistant integrated into the Nodeium browser. Your goal is to help users navigate and interact with web pages by generating a conversational response, followed by one or more specific browser action commands when necessary.

**Current Browser Context:**
- Current URL: ${browserContext.url}
- Page title: ${browserContext.title}

**Response Format:**
Your response MUST be conversational text first, followed by one or more 'ACTION:' lines if a browser action is required. If no action is needed, omit the ACTION lines.

**Available Commands:**
(The AI should generate these commands based on the user's request and the current context.)

- **NAVIGATE:** [url] (e.g., NAVIGATE: https://google.com)
- **SEARCH:** [query] (Searches using the default engine, e.g., SEARCH: best coffee near me)
- **BACK** / **FORWARD** / **REFRESH** (Standard browser navigation)
- **SCROLL:** [up/down/top/bottom] (Scrolls the current page)
- **CLICK:** [element description] (Clicks an element; description is key to finding it, e.g., 'Login button', 'Search field', 'Link to "About Us"')
- **TYPE:** [element description]|[text to type] (e.g., TYPE: username input|myuser123)
- **SELECT_OPTION:** [element description]|[option text] (e.g., SELECT_OPTION: country dropdown|United Kingdom)
- **CHECKBOX:** [element description]|[check/uncheck/toggle] (e.g., CHECKBOX: remember me|check)
- **FIND:** [text to find] (Highlights text on the page)
- **GET_ELEMENT_INFO:** [element description] (Inspects elements to provide detailed info for subsequent actions)
- **WAIT_FOR_ELEMENT:** [element description] (Pauses action execution until element is found)

**Chain multiple actions** for complex tasks (e.g., login, form submission). Actions are executed sequentially.

Be helpful, concise, and ONLY use the commands provided. Do not invent new commands.`;
    
    return systemPrompt;
}

/**
 * Execute a single browser action command.
 * @param {string} action - The raw action command string (e.g., 'NAVIGATE: https://...')
 */
function executeBrowserAction(action) {
    // Standardize action to uppercase and remove leading/trailing whitespace for reliable parsing
    const normalizedAction = action.toUpperCase().trim();
    let tabGroup = document.querySelector("tab-group");
    const webview = tabGroup.getActiveTab().webview;
    let commandExecuted = false;

    // Helper function for webview.executeJavaScript calls
    const executeWebviewScript = (script, messagePrefix = 'Executing action') => {
        if (!webview) {
            addMessage('assistant', `⚠️ Cannot execute browser action. Webview element not found.`);
            return;
        }
        webview.executeJavaScript(script).then(result => {
            // Only add message if the script returns something useful, otherwise, the prefix is enough
            if (result && typeof result === 'string' && result.length > 0 && !result.startsWith('Element not found')) {
                addMessage('assistant', `${messagePrefix}: ${result}`);
            } else if (result && result.startsWith('Element not found')) {
                addMessage('assistant', `❌ ${result}`);
            } else {
                 addMessage('assistant', `${messagePrefix}...`);
            }
        }).catch(error => {
            addMessage('assistant', `❌ Error executing action script: ${error.message}`);
        });
    };

    try {
        if (normalizedAction.startsWith('NAVIGATE:')) {
            const url = action.substring(9).trim();
            // Assuming 'txtUrl' and 'go()' are global application functions/elements
            if (typeof go === 'function' && document.getElementById('txtUrl')) {
                document.getElementById('txtUrl').value = url;
                go();
                addMessage('assistant', `🌐 Navigating to **${url}**...`);
                commandExecuted = true;
            } else {
                addMessage('assistant', `⚠️ Cannot NAVIGATE. Required application functions or elements are missing.`);
            }
        }
        else if (normalizedAction.startsWith('SEARCH:')) {
            const query = action.substring(7).trim();
            const searchUrl = `https://search.sparksammy.com/search.php?q=${encodeURIComponent(query)}`;
            // Assuming 'txtUrl' and 'go()' are global application functions/elements
            if (typeof go === 'function' && document.getElementById('txtUrl')) {
                document.getElementById('txtUrl').value = searchUrl;
                go();
                addMessage('assistant', `🔍 Searching for **${query}**...`);
                commandExecuted = true;
            } else {
                addMessage('assistant', `⚠️ Cannot SEARCH. Required application functions or elements are missing.`);
            }
        }
        else if (normalizedAction === 'BACK') {
            if (typeof back === 'function') {
                back();
                addMessage('assistant', '⬅️ Going back...');
                commandExecuted = true;
            }
        }
        else if (normalizedAction === 'FORWARD') {
            if (typeof forward === 'function') {
                forward();
                addMessage('assistant', '➡️ Going forward...');
                commandExecuted = true;
            }
        }
        else if (normalizedAction === 'REFRESH') {
            if (typeof refresh === 'function') {
                refresh();
                addMessage('assistant', '🔄 Refreshing page...');
                commandExecuted = true;
            }
        }
        else if (normalizedAction.startsWith('SCROLL:')) {
            const direction = action.substring(7).trim().toLowerCase();
            let scrollScript = '';
            switch(direction) {
                case 'up':
                    scrollScript = 'window.scrollBy(0, -500); "Scrolled Up"';
                    break;
                case 'down':
                    scrollScript = 'window.scrollBy(0, 500); "Scrolled Down"';
                    break;
                case 'top':
                    scrollScript = 'window.scrollTo(0, 0); "Scrolled to Top"';
                    break;
                case 'bottom':
                    scrollScript = 'window.scrollTo(0, document.body.scrollHeight); "Scrolled to Bottom"';
                    break;
            }
            if (scrollScript) {
                executeWebviewScript(scrollScript, `Scrolling ${direction}`);
                commandExecuted = true;
            } else {
                 addMessage('assistant', `⚠️ SCROLL: Invalid direction specified: ${direction}`);
            }
        }
        else if (normalizedAction.startsWith('FIND:')) {
            const searchText = action.substring(5).trim();
            const findScript = `
                const search = "${searchText.replace(/"/g, '\\"')}";
                window.find(search);
                'Finding text: ${searchText}'
            `;
            executeWebviewScript(findScript, `Finding text: **${searchText}**`);
            commandExecuted = true;
        }
        else if (normalizedAction.startsWith('CLICK:')) {
            const elementDescription = action.substring(6).trim();
            // Externalized the complex script for clarity
            const clickScript = createBrowserActionScript('click', elementDescription);
            executeWebviewScript(clickScript, `Attempting to click: **${elementDescription}**`);
            commandExecuted = true;
        }
        else if (normalizedAction.startsWith('TYPE:')) {
            const parts = action.substring(5).trim().split('|');
            if (parts.length === 2) {
                const elementDescription = parts[0].trim();
                const textToType = parts[1].trim();
                // Externalized the complex script for clarity
                const typeScript = createBrowserActionScript('type', elementDescription, textToType);
                executeWebviewScript(typeScript, `Attempting to type in: **${elementDescription}**`);
                commandExecuted = true;
            } else {
                addMessage('assistant', '⚠️ Invalid TYPE command format. Use: TYPE: [element description]|[text to type]');
            }
        }
        else if (normalizedAction.startsWith('GET_ELEMENT_INFO:')) {
            const elementDescription = action.substring(17).trim();
            const infoScript = createBrowserActionScript('info', elementDescription);
            executeWebviewScript(infoScript, `Getting info for: **${elementDescription}**`);
            commandExecuted = true;
        }
        else if (normalizedAction.startsWith('WAIT_FOR_ELEMENT:')) {
             const elementDescription = action.substring(17).trim();
             const waitScript = createBrowserActionScript('wait', elementDescription);
             executeWebviewScript(waitScript, `Waiting for element: **${elementDescription}**`);
             commandExecuted = true;
        }
        else if (normalizedAction.startsWith('SELECT_OPTION:')) {
            const parts = action.substring(14).trim().split('|');
            if (parts.length === 2) {
                const elementDescription = parts[0].trim();
                const optionText = parts[1].trim();
                const selectScript = createBrowserActionScript('select', elementDescription, optionText);
                executeWebviewScript(selectScript, `Attempting to select option: **${optionText}**`);
                commandExecuted = true;
            } else {
                addMessage('assistant', '⚠️ Invalid SELECT_OPTION command format. Use: SELECT_OPTION: [element description]|[option text]');
            }
        }
        else if (normalizedAction.startsWith('CHECKBOX:')) {
            const parts = action.substring(9).trim().split('|');
            const elementDescription = parts[0].trim();
            const actionType = parts[1] ? parts[1].trim().toLowerCase() : 'toggle';
            
            const checkboxScript = createBrowserActionScript('checkbox', elementDescription, actionType);
            executeWebviewScript(checkboxScript, `Attempting to **${actionType}** checkbox: **${elementDescription}**`);
            commandExecuted = true;
        }

        // Final catch for unknown command
        if (!commandExecuted) {
            addMessage('assistant', `⚠️ Unknown action: **${action}**`);
        }
    } catch (error) {
        console.error('Error executing browser action:', error);
        addMessage('assistant', `❌ Critical error executing action: ${error.message}`);
    }
}


/**
 * Helper function to generate robust JavaScript for webview execution.
 * This encapsulates the lengthy DOM manipulation scripts.
 * @param {string} actionType - 'click', 'type', 'info', 'wait', 'select', 'checkbox'
 * @param {string} description - The element description provided by the AI.
 * @param {string} [value] - Optional value (e.g., text to type, option text, checkbox action).
 * @returns {string} The JavaScript code to execute in the webview context.
 */
function createBrowserActionScript(actionType, description, value = '') {
    // Escape all quotes for safe inclusion in the script string
    const escapedDescription = description.replace(/"/g, '\\"');
    const escapedValue = value.replace(/"/g, '\\"');

    // Utility function to find an element based on description
    const findElementScript = `
        let element = null;
        const description = "${escapedDescription}".toLowerCase();
        const allElements = document.querySelectorAll('*');
        
        // 1. Try by ID
        if (!element) {
            element = document.getElementById("${escapedDescription}");
        }

        // 2. Try by exact text/value match (buttons, links)
        if (!element) {
            for (let el of allElements) {
                const textContent = (el.textContent || '').trim().toLowerCase();
                const valueContent = (el.value || '').trim().toLowerCase();
                if (textContent === description || valueContent === description) {
                    element = el;
                    break;
                }
            }
        }
        
        // 3. Try by placeholder
        if (!element) {
            const inputs = document.querySelectorAll('input, textarea');
            for (let input of inputs) {
                if (input.placeholder && input.placeholder.toLowerCase().includes(description)) {
                    element = input;
                    break;
                }
            }
        }
        
        // 4. Try by partial text match (links, buttons, generic elements)
        if (!element) {
            for (let el of allElements) {
                if ((el.textContent || '').toLowerCase().includes(description)) {
                    element = el;
                    break;
                }
            }
        }
        
        // 5. Try by associated label text
        if (!element) {
            const labels = document.querySelectorAll('label');
            for (let label of labels) {
                if ((label.textContent || '').toLowerCase().includes(description)) {
                    if (label.htmlFor) {
                        element = document.getElementById(label.htmlFor);
                    } else {
                        const firstInput = label.querySelector('input, textarea, select');
                        if (firstInput) element = firstInput;
                    }
                    if (element) break;
                }
            }
        }

        return element;
    `;

    switch (actionType) {
        case 'click':
            return `
                (function() {
                    ${findElementScript}

                    if (element) {
                        // Use a fallback click method for elements that might not be simple
                        if (element.click) {
                            element.click();
                        } else if (element.dispatchEvent) {
                            element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        }
                        return 'Clicked on element: ${escapedDescription}';
                    } else {
                        return 'Element not found: ${escapedDescription}';
                    }
                })();
            `;

        case 'type':
            return `
                (function() {
                    ${findElementScript}

                    const text = "${escapedValue}";
                    
                    if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
                        element.focus();
                        element.value = text;
                        // Dispatch events to trigger modern frameworks (React, Vue, etc.)
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        return 'Typed text into: ${escapedDescription}';
                    } else {
                        return 'Element not found or not typeable: ${escapedDescription}';
                    }
                })();
            `;

        case 'select':
             return `
                (function() {
                    ${findElementScript}

                    const optionText = "${escapedValue}".toLowerCase();
                    
                    if (element && element.tagName === 'SELECT') {
                        const options = element.options;
                        for (let i = 0; i < options.length; i++) {
                            if (options[i].text.toLowerCase().includes(optionText)) {
                                element.selectedIndex = i;
                                element.dispatchEvent(new Event('change', { bubbles: true }));
                                return 'Selected option: ${escapedValue} in ${escapedDescription}';
                            }
                        }
                        return 'Option not found: ${escapedValue} in ${escapedDescription}';
                    } else {
                        return 'Select element not found or is not a SELECT tag: ${escapedDescription}';
                    }
                })();
            `;

        case 'checkbox':
             return `
                (function() {
                    ${findElementScript}

                    const action = "${escapedValue}".toLowerCase();
                    
                    if (element && element.type === 'checkbox') {
                        if (action === 'check') {
                            element.checked = true;
                        } else if (action === 'uncheck') {
                            element.checked = false;
                        } else {
                            element.checked = !element.checked; // toggle
                        }
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        return (action === 'toggle' ? 'Toggled' : action + 'ed') + ' checkbox: ${escapedDescription}';
                    } else {
                        return 'Checkbox not found: ${escapedDescription}';
                    }
                })();
            `;

        case 'info':
            return `
                (function() {
                    const description = "${escapedDescription}".toLowerCase();
                    const allElements = document.querySelectorAll('*');
                    const elementsInfo = [];

                    for (let el of allElements) {
                        const textContent = (el.textContent || '').trim().toLowerCase();
                        const placeholder = (el.placeholder || '').trim().toLowerCase();
                        const id = (el.id || '').trim().toLowerCase();

                        // Match on text content, placeholder, or ID
                        if (textContent.includes(description) || placeholder.includes(description) || id === description) {
                            elementsInfo.push({
                                tagName: el.tagName,
                                id: el.id || 'N/A',
                                className: el.className ? el.className.split(' ')[0] + '...' : 'N/A',
                                text: el.textContent.trim().substring(0, 50) + (el.textContent.trim().length > 50 ? '...' : ''),
                                type: el.type || 'N/A',
                                placeholder: el.placeholder || 'N/A'
                            });
                        }
                    }

                    if (elementsInfo.length > 0) {
                        return 'Found ' + elementsInfo.length + ' elements matching: ' + JSON.stringify(elementsInfo.slice(0, 3), null, 2);
                    } else {
                        return 'No elements found matching: ${escapedDescription}';
                    }
                })();
            `;
            
        case 'wait':
             // NOTE: This uses a non-blocking Promise that resolves in the webview, 
             // but the main process needs to handle the *continuation* after this promise resolves.
             // Due to the nature of executeJavaScript returning a single promise, 
             // sequential execution of chained actions (in the main process) will *wait* for this one to resolve.
             return `
                (function() {
                    const description = "${escapedDescription}".toLowerCase();
                    const maxWaitTime = 10000; // 10 seconds
                    const checkInterval = 500; // 0.5 seconds

                    const findElement = () => {
                        // Re-run the find logic here for real-time checking
                        const allElements = document.querySelectorAll('*');
                        for (let el of allElements) {
                            if ((el.textContent || '').toLowerCase().includes(description) || 
                                (el.id || '').toLowerCase() === description ||
                                (el.placeholder || '').toLowerCase().includes(description)) {
                                return true;
                            }
                        }
                        return false;
                    };
                        
                    return new Promise((resolve) => {
                        if (findElement()) {
                            resolve('Element immediately found: ${escapedDescription}');
                            return;
                        }

                        const startTime = Date.now();
                        const intervalId = setInterval(() => {
                            if (findElement()) {
                                clearInterval(intervalId);
                                resolve('Element found after ' + (Date.now() - startTime) + 'ms: ${escapedDescription}');
                            } else if (Date.now() - startTime > maxWaitTime) {
                                clearInterval(intervalId);
                                resolve('Timeout: Element not found after ' + (maxWaitTime / 1000) + ' seconds: ${escapedDescription}');
                            }
                        }, checkInterval);
                    });
                })();
            `;

        default:
            return `'Unknown action type in script generation: ' + ${actionType}`;
    }
}

/**
 * Normalizes the API URL to the full chat completions endpoint.
 * @param {string} baseUrl - The user-configured API URL.
 * @returns {string} The full chat completions URL.
 */
function getChatCompletionsUrl(baseUrl) {
    let url = baseUrl.trim().replace(/\/+$/, ''); // Remove trailing slashes

    // Check if the URL already includes the endpoint path
    if (url.includes('/chat/completions')) {
        return url;
    }

    // Append the standard V1 path if not present, otherwise assume custom path
    if (url.endsWith('/v1')) {
        return url + '/chat/completions';
    } else {
        // Assume custom endpoint uses the standard chat completions path
        return url + '/v1/chat/completions';
    }
}


// =================================================================
// 4. UI/Utility Functions
// =================================================================

/**
 * Add a message to the chat container.
 * @param {'user'|'assistant'} role - The role of the message sender.
 * @param {string} content - The message content.
 */
function addMessage(role, content) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return; // Guard against missing container

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    // Use innerHTML for markdown support (bolding, new lines)
    // NOTE: In a secure environment, ensure all user-generated content is sanitized.
    // Assuming 'content' here is either system-generated or comes from the AI.
    // For basic safety, replace < and > (basic XSS)
    const sanitizedContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Simple markdown-like processing for bold and newlines
    let formattedContent = sanitizedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedContent = formattedContent.replace(/\n/g, '<br>');
    messageDiv.innerHTML = formattedContent;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add to chat history (only the raw text content)
    chatHistory.push({ role, content: content });
    
    // Keep chat history manageable
    if (chatHistory.length > 50) {
        // Keep the last 50 messages
        chatHistory = chatHistory.slice(-50); 
    }
}

/**
 * Show a typing indicator in the chat.
 * @returns {string} The ID of the typing indicator element.
 */
function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return 'no-id';
    
    const typingDiv = document.createElement('div');
    const id = 'typing-' + Date.now();
    typingDiv.className = 'message assistant typing-indicator';
    typingDiv.id = id;
    typingDiv.innerHTML = '<span>AI is thinking</span><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return id;
}

/**
 * Remove a typing indicator by ID.
 * @param {string} id - The ID returned by showTypingIndicator.
 */
function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

/**
 * Show a detailed help message.
 */
function showHelp() {
    const helpText = `
**AI Assistant Help**

**Configuration Commands (Type these in chat):**
• "set api key YOUR_KEY" - Configure OpenAI API key
• "set api url YOUR_URL" - Configure custom API endpoint
• "settings" - Open the settings panel (⚙️)
• "clear chat" - Clear chat history
• "help" - Show this help message

**Agent Capabilities (Ask me to...):**
• **Navigation:** "go to wikipedia.org", "go back", "refresh"
• **Search:** "search for JavaScript tutorials"
• **Interaction:** "click the login button", "type my-username in the username field"
• **Forms:** "select option United States in the country dropdown", "check the remember me box"
• **On-Page Actions:** "scroll down", "find the word 'Electron'", "get info for the submit button"

**Advanced Tips:**
• I can chain multiple actions for complex workflows, like navigating to a login page, waiting for the form, typing credentials, and clicking the submit button.
• Element descriptions can be the element's text, placeholder, or ID. Be as specific as possible!

**Example Scenario:**
*User:* "Navigate to Google, search for Gemini, and click the link that says 'Google Gemini'."
*AI Response:* "I can do that! Here are the actions I'll perform:
ACTION: NAVIGATE: https://google.com
ACTION: TYPE: search box|Gemini
ACTION: CLICK: Google Search button
ACTION: CLICK: Link to "Google Gemini"
"

Just chat naturally and I'll generate the required actions!
    `;
    addMessage('assistant', helpText.trim());
}

// =================================================================
// 5. Global Event Listener
// =================================================================

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAIAssistant);

// Expose public functions to the global scope if needed for HTML event handlers
window.toggleAISettings = toggleAISettings;
window.saveAISettings = saveAISettings;
window.resetAISettings = resetAISettings;
window.testAIConnection = testAIConnection;
window.toggleAISidebar = toggleAISidebar;
window.handleChatKeyPress = handleChatKeyPress;
window.sendChatMessage = sendChatMessage;

// **NOTE:** You must ensure the following functions are defined elsewhere in your Nodeium application:
// go(), back(), forward(), refresh()
// The HTML elements must also exist: aiSidebar, chatInput, chatMessages, aiSettingsModal, etc.
