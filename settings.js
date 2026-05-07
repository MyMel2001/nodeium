// Settings functionality for Nodeium

let settingsModal = null;

// Browser settings (stored in file)
let settings = {
  darkModeEnabled: false,
  defaultBrowser: false
};

// AI Settings (stored in localStorage)
let aiSettings = {
  apiKey: null,
  apiUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  contextAware: true
};

// Make settings available globally for libbrowz.js
window.settings = settings;
window.aiSettings = aiSettings;

// Initialize settings on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  loadAISettings();
  setupSettingsListeners();
  setupAISettingsListeners();
});

async function loadSettings() {
  try {
    const loadedSettings = await window.electron.getSettings();
    // Only update the properties we care about
    settings.darkModeEnabled = loadedSettings.darkModeEnabled || false;
    settings.defaultBrowser = loadedSettings.defaultBrowser || false;
    window.settings = settings; // Update global reference
    updateSettingsUI();
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

function loadAISettings() {
  aiSettings.apiKey = localStorage.getItem('openai-api-key') || null;
  aiSettings.apiUrl = localStorage.getItem('openai-api-url') || 'https://api.openai.com/v1';
  aiSettings.model = localStorage.getItem('ai-model') || 'gpt-3.5-turbo';
  aiSettings.temperature = parseFloat(localStorage.getItem('ai-temperature') || '0.7');
  aiSettings.maxTokens = parseInt(localStorage.getItem('ai-max-tokens') || '1000', 10);
  aiSettings.contextAware = localStorage.getItem('ai-context-aware') !== 'false';

  updateAISettingsUI();
}

function updateSettingsUI() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const defaultBrowserToggle = document.getElementById('defaultBrowserToggle');

  if (darkModeToggle) {
    darkModeToggle.checked = settings.darkModeEnabled;
  }

  if (defaultBrowserToggle) {
    defaultBrowserToggle.checked = settings.defaultBrowser;
  }
}

function updateAISettingsUI() {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiUrlInput = document.getElementById('apiUrlInput');
  const modelSelect = document.getElementById('modelSelect');
  const customModelInput = document.getElementById('customModelInput');
  const temperatureSlider = document.getElementById('temperatureSlider');
  const temperatureValue = document.getElementById('temperatureValue');
  const maxTokensInput = document.getElementById('maxTokensInput');
  const contextAwareCheckbox = document.getElementById('contextAwareCheckbox');

  if (apiKeyInput) apiKeyInput.value = aiSettings.apiKey || '';
  if (apiUrlInput) apiUrlInput.value = aiSettings.apiUrl;
  if (temperatureSlider) {
    temperatureSlider.value = aiSettings.temperature;
    if (temperatureValue) temperatureValue.textContent = aiSettings.temperature.toFixed(1);
  }
  if (maxTokensInput) maxTokensInput.value = aiSettings.maxTokens;
  if (contextAwareCheckbox) contextAwareCheckbox.checked = aiSettings.contextAware;

  if (modelSelect) {
    const options = Array.from(modelSelect.options);
    const predefinedModel = options.find(opt => opt.value === aiSettings.model);
    if (predefinedModel) {
      modelSelect.value = aiSettings.model;
      if (customModelInput) customModelInput.style.display = 'none';
    } else {
      modelSelect.value = 'custom';
      if (customModelInput) {
        customModelInput.style.display = 'block';
        customModelInput.value = aiSettings.model;
      }
    }
  }
}

function setupSettingsListeners() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const defaultBrowserToggle = document.getElementById('defaultBrowserToggle');

  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', async (e) => {
      settings.darkModeEnabled = e.target.checked;
      window.settings = settings; // Update global reference

      if (settings.darkModeEnabled) {
        // Apply dark mode to current tab
        const tabGroup = document.querySelector('tab-group');
        if (tabGroup) {
          const activeTab = tabGroup.getActiveTab();
          if (activeTab && activeTab.webview) {
            try {
              await applySmartDarkMode(activeTab.webview);
            } catch (error) {
              console.error('Failed to apply dark mode:', error);
            }
          }
        }
      } else {
        // Remove dark mode from current tab
        const tabGroup = document.querySelector('tab-group');
        if (tabGroup) {
          const activeTab = tabGroup.getActiveTab();
          if (activeTab && activeTab.webview) {
            try {
              activeTab.webview.reload();
            } catch (error) {
              console.error('Failed to reload:', error);
            }
          }
        }
      }
    });
  }

  if (defaultBrowserToggle) {
    defaultBrowserToggle.addEventListener('change', async (e) => {
      if (e.target.checked) {
        const result = await window.electron.setDefaultBrowser();
        if (result.success) {
          settings.defaultBrowser = true;
        } else {
          console.error('Failed to set as default browser:', result.error);
          e.target.checked = false;
          alert('Failed to set as default browser. You may need to do this manually in your system settings.');
        }
      } else {
        settings.defaultBrowser = false;
      }
    });
  }
}

function setupAISettingsListeners() {
  const modelSelect = document.getElementById('modelSelect');
  const customModelInput = document.getElementById('customModelInput');
  const temperatureSlider = document.getElementById('temperatureSlider');
  const temperatureValue = document.getElementById('temperatureValue');

  if (modelSelect && customModelInput) {
    modelSelect.addEventListener('change', function() {
      customModelInput.style.display = this.value === 'custom' ? 'block' : 'none';
    });
  }

  if (temperatureSlider && temperatureValue) {
    temperatureSlider.addEventListener('input', function() {
      temperatureValue.textContent = parseFloat(this.value).toFixed(1);
    });
  }
}

async function saveSettings() {
  try {
    // Save browser settings - only pass serializable properties
    const settingsToSave = {
      darkModeEnabled: settings.darkModeEnabled,
      defaultBrowser: settings.defaultBrowser
    };
    await window.electron.saveSettings(settingsToSave);

    // Save AI settings
    saveAISettings();

    alert('Settings saved successfully!');
    toggleSettings();
  } catch (error) {
    console.error('Failed to save settings:', error);
    alert('Failed to save settings.');
  }
}

function saveAISettings() {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiUrlInput = document.getElementById('apiUrlInput');
  const modelSelect = document.getElementById('modelSelect');
  const customModelInput = document.getElementById('customModelInput');
  const temperatureSlider = document.getElementById('temperatureSlider');
  const maxTokensInput = document.getElementById('maxTokensInput');
  const contextAwareCheckbox = document.getElementById('contextAwareCheckbox');

  // Save API Key
  if (apiKeyInput) {
    aiSettings.apiKey = apiKeyInput.value.trim() || null;
    if (aiSettings.apiKey) {
      localStorage.setItem('openai-api-key', aiSettings.apiKey);
    } else {
      localStorage.removeItem('openai-api-key');
    }
  }

  // Save API URL
  if (apiUrlInput && apiUrlInput.value.trim()) {
    aiSettings.apiUrl = apiUrlInput.value.trim();
    localStorage.setItem('openai-api-url', aiSettings.apiUrl);
  }

  // Save model
  if (modelSelect && customModelInput) {
    if (modelSelect.value === 'custom') {
      aiSettings.model = customModelInput.value.trim() || 'gpt-3.5-turbo';
    } else {
      aiSettings.model = modelSelect.value;
    }
    localStorage.setItem('ai-model', aiSettings.model);
  }

  // Save temperature
  if (temperatureSlider) {
    const tempValue = parseFloat(temperatureSlider.value);
    if (!isNaN(tempValue)) {
      aiSettings.temperature = tempValue;
      localStorage.setItem('ai-temperature', aiSettings.temperature.toString());
    }
  }

  // Save max tokens
  if (maxTokensInput) {
    const tokenValue = parseInt(maxTokensInput.value, 10);
    if (!isNaN(tokenValue) && tokenValue > 0) {
      aiSettings.maxTokens = tokenValue;
      localStorage.setItem('ai-max-tokens', aiSettings.maxTokens.toString());
    }
  }

  // Save context awareness
  if (contextAwareCheckbox) {
    aiSettings.contextAware = contextAwareCheckbox.checked;
    localStorage.setItem('ai-context-aware', aiSettings.contextAware.toString());
  }

  // Update global AI settings for ai-assistant.js
  if (window.AI_CONFIG) {
    window.AI_CONFIG.model = aiSettings.model;
    window.AI_CONFIG.maxTokens = aiSettings.maxTokens;
    window.AI_CONFIG.temperature = aiSettings.temperature;
    window.AI_CONFIG.contextAware = aiSettings.contextAware;
  }

  // Update global API key and URL for ai-assistant.js
  if (typeof window.setAIApiKey === 'function') {
    window.setAIApiKey(aiSettings.apiKey);
  }
  if (typeof window.setAIApiUrl === 'function') {
    window.setAIApiUrl(aiSettings.apiUrl);
  }
}

function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults? This will clear your API key.')) {
    // Reset browser settings
    settings.darkModeEnabled = false;
    settings.defaultBrowser = false;
    updateSettingsUI();

    // Reset AI settings
    localStorage.removeItem('openai-api-key');
    localStorage.removeItem('openai-api-url');
    localStorage.removeItem('ai-model');
    localStorage.removeItem('ai-temperature');
    localStorage.removeItem('ai-max-tokens');
    localStorage.removeItem('ai-context-aware');

    aiSettings.apiKey = null;
    aiSettings.apiUrl = 'https://api.openai.com/v1';
    aiSettings.model = 'gpt-3.5-turbo';
    aiSettings.temperature = 0.7;
    aiSettings.maxTokens = 1000;
    aiSettings.contextAware = true;

    updateAISettingsUI();

    alert('Settings reset to defaults.');
  }
}

async function testAIConnection() {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiUrlInput = document.getElementById('apiUrlInput');
  const modelSelect = document.getElementById('modelSelect');
  const customModelInput = document.getElementById('customModelInput');

  const testApiKey = apiKeyInput ? apiKeyInput.value.trim() : aiSettings.apiKey;
  let testApiUrl = apiUrlInput ? apiUrlInput.value.trim() : aiSettings.apiUrl;
  let testModel = aiSettings.model;

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

  // Determine the chat completions endpoint
  let chatCompletionsUrl = getChatCompletionsUrl(testApiUrl);

  try {
    const response = await fetch(chatCompletionsUrl, {
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
      if (data.choices && data.choices.length > 0) {
        alert('✅ Connection successful! The AI is ready to use.');
      } else {
        throw new Error('API returned an unexpected successful response structure. Check model name.');
      }
    } else {
      let errorDetail = response.statusText;
      try {
        const errorData = await response.json();
        errorDetail = errorData.error ? errorData.error.message : response.statusText;
      } catch (e) {
        // Ignore JSON parsing error
      }
      throw new Error(`HTTP ${response.status}: ${errorDetail}`);
    }
  } catch (error) {
    console.error('Connection Test Error:', error);
    alert(`Connection failed: ${error.message}`);
  }
}

function getChatCompletionsUrl(baseUrl) {
  let url = baseUrl.trim().replace(/\/+$/, '');

  if (url.includes('/chat/completions')) {
    return url;
  }

  if (url.endsWith('/v1')) {
    return url + '/chat/completions';
  } else {
    return url + '/v1/chat/completions';
  }
}

function toggleSettings() {
  settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.classList.toggle('show');
  }
}

// Check if site is already in dark mode
function isSiteDarkMode(webview) {
  if (!webview || !webview.executeJavaScript) {
    return Promise.resolve(false);
  }
  return webview.executeJavaScript(`
    (function() {
      const html = document.documentElement;
      const body = document.body;

      // Check for dark mode attributes
      if (html.getAttribute('data-theme') === 'dark' ||
          html.getAttribute('data-color-mode') === 'dark' ||
          html.classList.contains('dark-mode') ||
          html.classList.contains('dark') ||
          body.classList.contains('dark-mode') ||
          body.classList.contains('dark')) {
        return true;
      }

      // Check for dark mode via CSS variables
      const computedStyle = window.getComputedStyle(html);
      const bgVar = computedStyle.getPropertyValue('--color-bg') ||
                    computedStyle.getPropertyValue('--background-color') ||
                    computedStyle.getPropertyValue('--bg-color');
      if (bgVar && (bgVar.includes('#1') || bgVar.includes('#0') || bgVar.includes('rgb(0') || bgVar.includes('rgb(1'))) {
        return true;
      }

      // Check computed styles with a delay to ensure CSS is loaded
      const htmlStyle = window.getComputedStyle(html);
      const bodyStyle = window.getComputedStyle(body);

      const htmlBg = htmlStyle.backgroundColor;
      const bodyBg = bodyStyle.backgroundColor;

      // Parse RGB values
      function parseColor(color) {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3])
          };
        }
        return null;
      }

      const htmlRgb = parseColor(htmlBg);
      const bodyRgb = parseColor(bodyBg);

      // Check if background is dark (luminance < 128)
      function isDark(rgb) {
        if (!rgb) return false;
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
        return luminance < 128;
      }

      // Also check if text color is light (indicates dark background)
      function isLight(rgb) {
        if (!rgb) return false;
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
        return luminance > 128;
      }

      const htmlColor = parseColor(htmlStyle.color);
      const bodyColor = parseColor(bodyStyle.color);

      // If background is dark OR text is light, it's likely dark mode
      return isDark(htmlRgb) || isDark(bodyRgb) || isLight(htmlColor) || isLight(bodyColor);
    })()
  `).catch(() => false);
}

// Dark mode CSS injection
function applyDarkModeToWebview(webview) {
  if (!webview || !webview.insertCSS) {
    return;
  }
  const darkModeCSS = `
    html, body {
      background-color: #1a1a1a !important;
      color: #e0e0e0 !important;
    }

    /* Only apply to light backgrounds */
    :not([data-theme="dark"]):not(.dark-mode):not(.dark) {
      background-color: #1a1a1a !important;
      color: #e0e0e0 !important;
    }

    a {
      color: #64b5f6 !important;
    }

    input, textarea, select {
      background-color: #2d2d2d !important;
      color: #e0e0e0 !important;
      border-color: #444 !important;
    }

    button {
      background-color: #3d3d3d !important;
      color: #e0e0e0 !important;
    }

    img {
      filter: brightness(0.9) contrast(1.1);
    }

    /* Preserve dark mode elements */
    [data-theme="dark"],
    .dark-mode,
    .dark {
      background-color: inherit !important;
      color: inherit !important;
    }

    /* Detect and preserve existing dark mode */
    @media (prefers-color-scheme: dark) {
      html, body {
        background-color: inherit !important;
        color: inherit !important;
      }
    }
  `;

  webview.insertCSS(darkModeCSS);
}

// Smart dark mode that only applies to light mode sites
async function applySmartDarkMode(webview) {
  if (!webview) {
    return;
  }
  try {
    const isDark = await isSiteDarkMode(webview);

    if (!isDark) {
      // Site is in light mode, apply dark mode
      applyDarkModeToWebview(webview);
    }
    // If site is already dark, do nothing
  } catch (error) {
    console.error('Failed to apply smart dark mode:', error);
  }
}

// Apply dark mode to new tabs when they load
document.addEventListener('tab-added', async (event) => {
  if (settings.darkModeEnabled) {
    const tab = event.detail.tab;
    const webview = tab.webview;

    if (webview) {
      webview.addEventListener('dom-ready', () => {
        try {
          applySmartDarkMode(webview);
        } catch (error) {
          console.error('Failed to apply dark mode on tab load:', error);
        }
      });
    }
  }
});

// Expose functions globally for HTML event handlers
window.toggleSettings = toggleSettings;
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
window.testAIConnection = testAIConnection;
