// MCP Client for Nodeium Browser (Renderer Process)
// This module handles MCP communication from the renderer side

class NodeiumMCPClient {
    constructor() {
        this.initialized = false;
        this.setupEventListeners();
    }

    /**
     * Initialize MCP client
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('Initializing Nodeium MCP Client...');
        
        // Setup MCP action handlers
        this.setupActionHandlers();
        
        this.initialized = true;
        console.log('Nodeium MCP Client initialized successfully');
    }

    /**
     * Setup event listeners for MCP communication
     */
    setupEventListeners() {
        // Listen for MCP actions from main process
        if (window.mcp) {
            window.mcp.onAction((event, action) => {
                this.handleMCPAction(action);
            });

            window.mcp.onGetInfo((event, request) => {
                this.handleMCPInfoRequest(request);
            });

            window.mcp.onBrowserStateRequest((event) => {
                this.handleBrowserStateRequest();
            });

            window.mcp.onAISettingsRequest((event) => {
                this.handleAISettingsRequest();
            });

            window.mcp.onAIChatHistoryRequest((event) => {
                this.handleAIChatHistoryRequest();
            });
        }
    }

    /**
     * Setup MCP action handlers
     */
    setupActionHandlers() {
        this.actionHandlers = {
            navigate: this.handleNavigate.bind(this),
            navigation: this.handleNavigation.bind(this),
            interaction: this.handleInteraction.bind(this),
            wait: this.handleWait.bind(this),
            ai_assistant: this.handleAIAssistant.bind(this)
        };
    }

    /**
     * Handle MCP action from main process
     */
    async handleMCPAction(action) {
        const { type } = action;
        
        if (this.actionHandlers[type]) {
            try {
                await this.actionHandlers[type](action);
            } catch (error) {
                console.error(`Error handling MCP action ${type}:`, error);
            }
        } else {
            console.warn(`Unknown MCP action type: ${type}`);
        }
    }

    /**
     * Handle navigation action
     */
    async handleNavigate(action) {
        const { url } = action;
        
        if (typeof go === 'function' && document.getElementById('txtUrl')) {
            document.getElementById('txtUrl').value = url;
            go();
        } else {
            console.error('Navigation functions not available');
        }
    }

    /**
     * Handle navigation actions (back, forward, refresh)
     */
    async handleNavigation(action) {
        const { action: navAction } = action;
        
        switch (navAction) {
            case 'back':
                if (typeof back === 'function') back();
                break;
            case 'forward':
                if (typeof forward === 'function') forward();
                break;
            case 'refresh':
                if (typeof refresh === 'function') refresh();
                break;
            default:
                console.warn(`Unknown navigation action: ${navAction}`);
        }
    }

    /**
     * Handle browser interaction actions
     */
    async handleInteraction(action) {
        const { action: interactionType, target, value, direction } = action;
        const tabGroup = document.querySelector("tab-group");
        const webview = tabGroup && tabGroup.getActiveTab() ? tabGroup.getActiveTab().webview : null;
        
        if (!webview) {
            console.error('Webview not available for interaction');
            return;
        }

        try {
            let script = '';
            
            switch (interactionType) {
                case 'click':
                    script = this.createClickScript(target);
                    break;
                case 'type':
                    script = this.createTypeScript(target, value);
                    break;
                case 'scroll':
                    script = this.createScrollScript(direction);
                    break;
                case 'find':
                    script = this.createFindScript(target);
                    break;
                case 'select':
                    script = this.createSelectScript(target, value);
                    break;
                case 'checkbox':
                    script = this.createCheckboxScript(target, value);
                    break;
                default:
                    console.warn(`Unknown interaction type: ${interactionType}`);
                    return;
            }

            if (script) {
                await webview.executeJavaScript(script);
            }
        } catch (error) {
            console.error(`Error executing interaction ${interactionType}:`, error);
        }
    }

    /**
     * Handle wait action
     */
    async handleWait(action) {
        const { condition, target, timeout = 10000 } = action;
        const tabGroup = document.querySelector("tab-group");
        const webview = tabGroup && tabGroup.getActiveTab() ? tabGroup.getActiveTab().webview : null;
        
        if (!webview) {
            console.error('Webview not available for wait action');
            return;
        }

        try {
            const script = this.createWaitScript(condition, target, timeout);
            await webview.executeJavaScript(script);
        } catch (error) {
            console.error(`Error executing wait action:`, error);
        }
    }

    /**
     * Handle AI assistant actions
     */
    async handleAIAssistant(action) {
        const { action: aiAction, message } = action;
        
        switch (aiAction) {
            case 'toggle_sidebar':
                if (typeof toggleAISidebar === 'function') {
                    toggleAISidebar();
                }
                break;
            case 'send_message':
                if (typeof sendChatMessage === 'function' && message) {
                    const chatInput = document.getElementById('chatInput');
                    if (chatInput) {
                        chatInput.value = message;
                        sendChatMessage();
                    }
                }
                break;
            case 'clear_chat':
                if (typeof handleLocalCommands === 'function') {
                    handleLocalCommands('clear chat');
                }
                break;
            case 'get_settings':
                // Settings will be returned via IPC response
                break;
            default:
                console.warn(`Unknown AI assistant action: ${aiAction}`);
        }
    }

    /**
     * Handle MCP info request
     */
    async handleMCPInfoRequest(request) {
        const { info_type, element_description } = request;
        
        let result = {};
        
        switch (info_type) {
            case 'current_url':
                result = await this.getCurrentURL();
                break;
            case 'page_title':
                result = await this.getPageTitle();
                break;
            case 'element_info':
                result = await this.getElementInfo(element_description);
                break;
            case 'browser_state':
                result = await this.getBrowserState();
                break;
            default:
                result = { error: `Unknown info type: ${info_type}` };
        }
        
        if (window.mcp) {
            window.mcp.sendBrowserInfoResponse(result);
        }
    }

    /**
     * Handle browser state request
     */
    async handleBrowserStateRequest() {
        const state = await this.getBrowserState();
        if (window.mcp) {
            window.mcp.sendBrowserStateResponse(state);
        }
    }

    /**
     * Handle AI settings request
     */
    async handleAISettingsRequest() {
        const settings = this.getAISettings();
        if (window.mcp) {
            window.mcp.sendAISettingsResponse(settings);
        }
    }

    /**
     * Handle AI chat history request
     */
    async handleAIChatHistoryRequest() {
        const chatHistory = this.getAIChatHistory();
        if (window.mcp) {
            window.mcp.sendAIChatHistoryResponse(chatHistory);
        }
    }

    /**
     * Get current URL
     */
    async getCurrentURL() {
        const tabGroup = document.querySelector("tab-group");
        const webview = tabGroup && tabGroup.getActiveTab() ? tabGroup.getActiveTab().webview : null;
        
        if (webview) {
            return { url: webview.getURL() || 'about:blank' };
        }
        
        return { url: 'No webview available' };
    }

    /**
     * Get page title
     */
    async getPageTitle() {
        const tabGroup = document.querySelector("tab-group");
        const webview = tabGroup && tabGroup.getActiveTab() ? tabGroup.getActiveTab().webview : null;
        
        if (webview) {
            return { title: webview.getTitle() || 'No title' };
        }
        
        return { title: 'No webview available' };
    }

    /**
     * Get element information
     */
    async getElementInfo(description) {
        const tabGroup = document.querySelector("tab-group");
        const webview = tabGroup && tabGroup.getActiveTab() ? tabGroup.getActiveTab().webview : null;
        
        if (!webview) {
            return { error: 'Webview not available' };
        }

        const script = `
            (function() {
                const description = "${description}".toLowerCase();
                const allElements = document.querySelectorAll('*');
                const elementsInfo = [];

                for (let el of allElements) {
                    const textContent = (el.textContent || '').trim().toLowerCase();
                    const placeholder = (el.placeholder || '').trim().toLowerCase();
                    const id = (el.id || '').trim().toLowerCase();

                    if (textContent.includes(description) || placeholder.includes(description) || id === description) {
                        elementsInfo.push({
                            tagName: el.tagName,
                            id: el.id || 'N/A',
                            className: el.className || 'N/A',
                            text: el.textContent.trim().substring(0, 50) + (el.textContent.trim().length > 50 ? '...' : ''),
                            type: el.type || 'N/A',
                            placeholder: el.placeholder || 'N/A'
                        });
                    }
                }

                return elementsInfo;
            })();
        `;

        try {
            const result = await webview.executeJavaScript(script);
            return { elements: result };
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Get browser state
     */
    async getBrowserState() {
        const url = await this.getCurrentURL();
        const title = await this.getPageTitle();
        const tabGroup = document.querySelector("tab-group");
        
        return {
            url: url.url,
            title: title.title,
            tabs: tabGroup ? tabGroup.tabs.length : 0,
            activeTab: tabGroup && tabGroup.getActiveTab() ? tabGroup.getActiveTab().title : 'No active tab'
        };
    }

    /**
     * Get AI settings
     */
    getAISettings() {
        // This would typically read from localStorage or global variables
        return {
            apiKey: localStorage.getItem('openai-api-key') || null,
            apiUrl: localStorage.getItem('openai-api-url') || 'https://api.openai.com/v1',
            model: localStorage.getItem('ai-model') || 'gpt-3.5-turbo',
            temperature: parseFloat(localStorage.getItem('ai-temperature') || '0.7'),
            maxTokens: parseInt(localStorage.getItem('ai-max-tokens') || '1000', 10),
            contextAware: localStorage.getItem('ai-context-aware') !== 'false'
        };
    }

    /**
     * Get AI chat history
     */
    getAIChatHistory() {
        // This would typically read from the AI assistant's chat history
        return {
            messages: window.chatHistory || [],
            timestamp: new Date().toISOString()
        };
    }

    // Script creation methods (similar to those in ai-assistant.js)
    
    createClickScript(description) {
        const escapedDescription = description.replace(/"/g, '\\"');
        return `
            (function() {
                const description = "${escapedDescription}".toLowerCase();
                const allElements = document.querySelectorAll('*');
                let element = null;

                for (let el of allElements) {
                    const textContent = (el.textContent || '').trim().toLowerCase();
                    if (textContent === description || textContent.includes(description)) {
                        element = el;
                        break;
                    }
                }

                if (element) {
                    element.click();
                    return 'Clicked: ${description}';
                } else {
                    return 'Element not found: ${description}';
                }
            })();
        `;
    }

    createTypeScript(description, text) {
        const escapedDescription = description.replace(/"/g, '\\"');
        const escapedText = text.replace(/"/g, '\\"');
        return `
            (function() {
                const description = "${escapedDescription}".toLowerCase();
                const text = "${escapedText}";
                const allElements = document.querySelectorAll('input, textarea');
                let element = null;

                for (let el of allElements) {
                    const placeholder = (el.placeholder || '').toLowerCase();
                    if (placeholder.includes(description)) {
                        element = el;
                        break;
                    }
                }

                if (element) {
                    element.value = text;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    return 'Typed: ${text} in ${description}';
                } else {
                    return 'Input element not found: ${description}';
                }
            })();
        `;
    }

    createScrollScript(direction) {
        switch (direction) {
            case 'up': return 'window.scrollBy(0, -500); "Scrolled up"';
            case 'down': return 'window.scrollBy(0, 500); "Scrolled down"';
            case 'top': return 'window.scrollTo(0, 0); "Scrolled to top"';
            case 'bottom': return 'window.scrollTo(0, document.body.scrollHeight); "Scrolled to bottom"';
            default: return 'console.log("Unknown scroll direction");';
        }
    }

    createFindScript(text) {
        const escapedText = text.replace(/"/g, '\\"');
        return `window.find("${escapedText}"); "Finding: ${text}"`;
    }

    createSelectScript(description, option) {
        const escapedDescription = description.replace(/"/g, '\\"');
        const escapedOption = option.replace(/"/g, '\\"');
        return `
            (function() {
                const description = "${escapedDescription}".toLowerCase();
                const optionText = "${escapedOption}".toLowerCase();
                const selects = document.querySelectorAll('select');
                let element = null;

                for (let select of selects) {
                    const label = select.previousElementSibling;
                    if (label && label.textContent.toLowerCase().includes(description)) {
                        element = select;
                        break;
                    }
                }

                if (element) {
                    for (let i = 0; i < element.options.length; i++) {
                        if (element.options[i].text.toLowerCase().includes(optionText)) {
                            element.selectedIndex = i;
                            element.dispatchEvent(new Event('change', { bubbles: true }));
                            return 'Selected: ${option} in ${description}';
                        }
                    }
                    return 'Option not found: ${option}';
                } else {
                    return 'Select element not found: ${description}';
                }
            })();
        `;
    }

    createCheckboxScript(description, action) {
        const escapedDescription = description.replace(/"/g, '\\"');
        return `
            (function() {
                const description = "${escapedDescription}".toLowerCase();
                const action = "${action}";
                const checkboxes = document.querySelectorAll('input[type="checkbox"]');
                let element = null;

                for (let checkbox of checkboxes) {
                    const label = checkbox.nextElementSibling;
                    if (label && label.textContent.toLowerCase().includes(description)) {
                        element = checkbox;
                        break;
                    }
                }

                if (element) {
                    if (action === 'check') {
                        element.checked = true;
                    } else if (action === 'uncheck') {
                        element.checked = false;
                    } else {
                        element.checked = !element.checked;
                    }
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    return '${action}ed checkbox: ${description}';
                } else {
                    return 'Checkbox not found: ${description}';
                }
            })();
        `;
    }

    createWaitScript(condition, target, timeout) {
        const escapedTarget = target.replace(/"/g, '\\"');
        return `
            (function() {
                const target = "${escapedTarget}";
                const maxWaitTime = ${timeout};
                const checkInterval = 500;

                const checkCondition = () => {
                    if ("${condition}" === "element") {
                        const elements = document.querySelectorAll('*');
                        for (let el of elements) {
                            if ((el.textContent || '').toLowerCase().includes(target.toLowerCase())) {
                                return true;
                            }
                        }
                        return false;
                    }
                    // Add other condition checks here
                    return false;
                };

                return new Promise((resolve) => {
                    if (checkCondition()) {
                        resolve('Condition met immediately');
                        return;
                    }

                    const startTime = Date.now();
                    const intervalId = setInterval(() => {
                        if (checkCondition()) {
                            clearInterval(intervalId);
                            resolve('Condition met after ' + (Date.now() - startTime) + 'ms');
                        } else if (Date.now() - startTime > maxWaitTime) {
                            clearInterval(intervalId);
                            resolve('Timeout: Condition not met');
                        }
                    }, checkInterval);
                });
            })();
        `;
    }
}

// Create global MCP client instance
window.mcpClient = new NodeiumMCPClient();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mcpClient.initialize().catch(console.error);
});

module.exports = NodeiumMCPClient;
