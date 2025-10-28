/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 * 
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  enforceDomainRestrictions: (url) => ipcRenderer.sendSync('check-domain', url),
});

// Expose MCP functionality to the renderer process
contextBridge.exposeInMainWorld('mcp', {
  // Tool operations
  callTool: (toolName, args) => ipcRenderer.invoke('mcp-call-tool', { toolName, args }),
  getResource: (resourceName) => ipcRenderer.invoke('mcp-get-resource', { resourceName }),
  listTools: () => ipcRenderer.invoke('mcp-list-tools'),
  listResources: () => ipcRenderer.invoke('mcp-list-resources'),
  
  // Response handlers for main process requests
  onBrowserInfoRequest: (callback) => ipcRenderer.on('mcp-get-info', callback),
  onBrowserStateRequest: (callback) => ipcRenderer.on('mcp-get-browser-state', callback),
  onAISettingsRequest: (callback) => ipcRenderer.on('mcp-get-ai-settings', callback),
  onAIChatHistoryRequest: (callback) => ipcRenderer.on('mcp-get-ai-chat-history', callback),
  
  // Response senders for main process requests
  sendBrowserInfoResponse: (data) => ipcRenderer.send('mcp-browser-info-response', data),
  sendBrowserStateResponse: (data) => ipcRenderer.send('mcp-browser-state-response', data),
  sendAISettingsResponse: (data) => ipcRenderer.send('mcp-ai-settings-response', data),
  sendAIChatHistoryResponse: (data) => ipcRenderer.send('mcp-ai-chat-history-response', data),
  
  // Action handlers
  onAction: (callback) => ipcRenderer.on('mcp-action', callback),
  onGetInfo: (callback) => ipcRenderer.on('mcp-get-info', callback),
});


window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, 'sneedium-version')
  }

  ipcRenderer.on('windowmaker', (event, arg) => {
    console.log(arg) // prints "pong"
  })
    //button and its event listener
  const makeWindowButton = document.getElementById('nwBtn');
  makeWindowButton.addEventListener('click', () => {
      ipcRenderer.send('windowmaker', 'ping')
  })
})
