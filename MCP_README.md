# MCP (Model Context Protocol) Integration for Nodeium Browser

This document describes the MCP (Model Context Protocol) integration added to the Nodeium browser, enabling external AI models to interact with browser functionality through standardized tools and resources.

## Overview

The MCP integration provides a standardized interface for AI models to control the Nodeium browser, including navigation, interaction with web pages, and management of the built-in AI assistant. This allows external AI systems to programmatically control the browser through a well-defined protocol.

## Architecture

The MCP implementation consists of three main components:

1. **MCP Server** (`mcp-server.js`) - Main process component that defines tools and resources
2. **MCP Integration** (`mcp-integration.js`) - Main process bridge between MCP server and browser functionality
3. **MCP Client** (`mcp-client.js`) - Renderer process component that handles MCP actions

## Available Tools

### Browser Navigation Tools

#### `browser_navigate`
Navigate to a specific URL.

**Parameters:**
- `url` (string, required): The URL to navigate to

**Example:**
```json
{
  "url": "https://example.com"
}
```

#### `browser_search`
Search using the default search engine.

**Parameters:**
- `query` (string, required): The search query

**Example:**
```json
{
  "query": "JavaScript tutorials"
}
```

#### `browser_navigation`
Perform browser navigation actions.

**Parameters:**
- `action` (string, required): Navigation action (`back`, `forward`, `refresh`)

**Example:**
```json
{
  "action": "back"
}
```

### Browser Interaction Tools

#### `browser_interact`
Interact with web page elements.

**Parameters:**
- `action` (string, required): Type of interaction (`click`, `type`, `scroll`, `find`, `select`, `checkbox`)
- `target` (string, required): Element description or target
- `value` (string, optional): Value for type/select actions
- `direction` (string, optional): Scroll direction (`up`, `down`, `top`, `bottom`)

**Examples:**
```json
{
  "action": "click",
  "target": "Login button"
}
```

```json
{
  "action": "type",
  "target": "username input",
  "value": "myuser123"
}
```

```json
{
  "action": "scroll",
  "direction": "down"
}
```

### Information Retrieval Tools

#### `browser_get_info`
Get information about the current browser state.

**Parameters:**
- `info_type` (string, required): Type of information (`current_url`, `page_title`, `element_info`, `browser_state`)
- `element_description` (string, optional): Element description for `element_info`

**Examples:**
```json
{
  "info_type": "current_url"
}
```

```json
{
  "info_type": "element_info",
  "element_description": "submit button"
}
```

#### `browser_wait`
Wait for specific conditions on the page.

**Parameters:**
- `condition` (string, required): Condition to wait for (`element`, `url_change`, `page_load`)
- `target` (string, optional): Target element or URL pattern
- `timeout` (number, optional): Timeout in milliseconds (default: 10000)

**Example:**
```json
{
  "condition": "element",
  "target": "login form",
  "timeout": 5000
}
```

### AI Assistant Control Tools

#### `ai_assistant_control`
Control the AI assistant functionality.

**Parameters:**
- `action` (string, required): Action to perform (`toggle_sidebar`, `send_message`, `clear_chat`, `get_settings`)
- `message` (string, optional): Message to send (for `send_message` action)

**Examples:**
```json
{
  "action": "toggle_sidebar"
}
```

```json
{
  "action": "send_message",
  "message": "Search for weather information"
}
```

## Available Resources

### `browser://current-state`
Get current browser state including URL, title, and tab information.

**Response:**
```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "tabs": 3,
  "activeTab": "Example Domain"
}
```

### `browser://history`
Browser navigation history (currently placeholder implementation).

### `ai-assistant://settings`
AI assistant configuration settings.

**Response:**
```json
{
  "apiKey": "sk-...",
  "apiUrl": "https://api.openai.com/v1",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "maxTokens": 1000,
  "contextAware": true
}
```

### `ai-assistant://chat-history`
AI assistant chat history.

**Response:**
```json
{
  "messages": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"}
  ],
  "timestamp": "2025-10-28T06:30:00.000Z"
}
```

## Usage Examples

### Basic Navigation
```javascript
// Navigate to a website
await mcp.callTool('browser_navigate', { url: 'https://google.com' });

// Search for content
await mcp.callTool('browser_search', { query: 'Nodeium browser' });
```

### Form Interaction
```javascript
// Fill out a login form
await mcp.callTool('browser_interact', {
  action: 'type',
  target: 'username input',
  value: 'myusername'
});

await mcp.callTool('browser_interact', {
  action: 'type', 
  target: 'password input',
  value: 'mypassword'
});

await mcp.callTool('browser_interact', {
  action: 'click',
  target: 'Login button'
});
```

### Information Retrieval
```javascript
// Get current page information
const state = await mcp.getResource('browser://current-state');
console.log(state.url, state.title);

// Get element information
const info = await mcp.callTool('browser_get_info', {
  info_type: 'element_info',
  element_description: 'navigation menu'
});
```

### AI Assistant Integration
```javascript
// Send a message to the AI assistant
await mcp.callTool('ai_assistant_control', {
  action: 'send_message',
  message: 'Navigate to Wikipedia and search for artificial intelligence'
});

// Get AI assistant settings
const settings = await mcp.getResource('ai-assistant://settings');
```

## Integration with Existing Browser Features

The MCP integration leverages the existing browser functionality:

- **Navigation**: Uses the existing `go()`, `back()`, `forward()`, `refresh()` functions
- **Web Interaction**: Uses webview `executeJavaScript()` for DOM manipulation
- **AI Assistant**: Integrates with the existing AI assistant sidebar and chat functionality
- **Tab Management**: Works with the electron-tabs library for multi-tab support

## Security Considerations

- All MCP operations are subject to the same security restrictions as the browser
- Webview interactions are sandboxed and follow the browser's security policies
- API keys and sensitive information are handled through secure IPC communication
- External MCP clients must be properly authenticated and authorized

## Development

### Adding New Tools

To add a new MCP tool:

1. Define the tool in `mcp-server.js` in the `setupTools()` method
2. Implement the tool handler in `mcp-integration.js` in the `handleToolExecution()` method
3. Add renderer-side handling in `mcp-client.js` if needed

### Adding New Resources

To add a new MCP resource:

1. Define the resource in `mcp-server.js` in the `setupResources()` method
2. Implement the resource handler in `mcp-integration.js` in the `handleResourceFetching()` method

## Testing

The MCP functionality can be tested by:

1. Starting the Nodeium browser
2. Using the browser's developer tools to call MCP functions:
   ```javascript
   // Test navigation
   await window.mcp.callTool('browser_navigate', { url: 'https://example.com' });
   
   // Test information retrieval
   const state = await window.mcp.getResource('browser://current-state');
   console.log(state);
   ```

## Future Enhancements

Potential future enhancements include:

- More sophisticated element detection and interaction
- Browser automation workflows
- Session management and persistence
- Integration with browser extensions
- Advanced waiting conditions and timeouts
- Browser performance metrics and analytics

## Troubleshooting

### Common Issues

1. **Tool not found**: Ensure the tool name is correctly spelled and defined
2. **Webview not available**: Check that a webview is loaded and active
3. **IPC communication errors**: Verify that preload.js is correctly exposing MCP functions
4. **Element not found**: Use more specific element descriptions or check the page structure

### Debugging

Enable debug logging by checking the browser's developer console for MCP-related messages. The MCP client and server both log initialization and operation details.

## License

This MCP integration is part of the Nodeium browser and follows the same licensing terms as the main project.
