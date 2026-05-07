// Modules to control application life and create native browser window
const {app, BrowserWindow, session, ipcMain, shell} = require('electron')
const path = require('path')
const fs = require('fs')
const fetch = require("cross-fetch")
const { ElectronChromeExtensions } = require('electron-chrome-extensions')
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const http = require('http');
const { createProxy } = require('proxy');
const NodeiumMCPIntegration = require('./mcp-integration');

// Settings file path
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

// Default settings
const defaultSettings = {
  darkModeEnabled: false,
  defaultBrowser: false
};

// Load settings from file
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return { ...defaultSettings };
}

// Save settings to file
function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

// Current settings
let currentSettings = loadSettings();

ipcMain.on('windowmaker', (event, arg) => {
  createWindow();
})

// Settings IPC handlers
ipcMain.handle('get-settings', () => {
  // Return a plain object to avoid cloning issues
  return {
    darkModeEnabled: currentSettings.darkModeEnabled,
    defaultBrowser: currentSettings.defaultBrowser
  };
});

ipcMain.handle('save-settings', (settings) => {
  // Merge with current settings
  currentSettings = {
    darkModeEnabled: settings.darkModeEnabled !== undefined ? settings.darkModeEnabled : currentSettings.darkModeEnabled,
    defaultBrowser: settings.defaultBrowser !== undefined ? settings.defaultBrowser : currentSettings.defaultBrowser
  };
  const success = saveSettings(currentSettings);
  return success ? currentSettings : null;
});

ipcMain.handle('set-default-browser', async () => {
  try {
    // Get the actual bundle ID from the app
    const bundleId = app.name === 'nodeium' ? 'com.electron.nodeium' : 'com.electron.nodeium';

    if (process.platform === 'darwin') {
      // macOS: Set as default browser using AppleScript
      const { exec } = require('child_process');
      await new Promise((resolve, reject) => {
        exec(`defaults write com.apple.LaunchServices/com.apple.launchservices.secure LSHandlers -array-add '{ "LSHandlerRoleAll" = "${bundleId}"; "LSHandlerURLScheme" = "http"; }'`, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      await new Promise((resolve, reject) => {
        exec(`defaults write com.apple.LaunchServices/com.apple.launchservices.secure LSHandlers -array-add '{ "LSHandlerRoleAll" = "${bundleId}"; "LSHandlerURLScheme" = "https"; }'`, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      // Rebuild LaunchServices (without -kill flag which was removed)
      await new Promise((resolve, reject) => {
        exec('/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -r -domain local -domain system -domain user', (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      return { success: true };
    } else if (process.platform === 'win32') {
      // Windows: Set as default browser via registry
      const { exec } = require('child_process');
      await new Promise((resolve, reject) => {
        exec('reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice" /v ProgId /t REG_SZ /d NodeiumHTM /f', (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      await new Promise((resolve, reject) => {
        exec('reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\https\\UserChoice" /v ProgId /t REG_SZ /d NodeiumHTM /f', (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      return { success: true };
    } else {
      // Linux: Set as default browser via xdg-settings
      const { exec } = require('child_process');
      const desktopFile = app.name === 'nodeium' ? 'nodeium.desktop' : 'nodeium.desktop';
      await new Promise((resolve, reject) => {
        exec(`xdg-settings set default-web-browser ${desktopFile}`, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      return { success: true };
    }
  } catch (error) {
    console.error('Failed to set as default browser:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-default-browser', async () => {
  try {
    // Get the actual bundle ID from the app
    const bundleId = app.name === 'nodeium' ? 'com.electron.nodeium' : 'com.electron.nodeium';

    if (process.platform === 'darwin') {
      const { exec } = require('child_process');
      const result = await new Promise((resolve) => {
        exec('defaults read com.apple.LaunchServices/com.apple.launchservices.secure LSHandlers', (error, stdout) => {
          if (error) resolve(false);
          else resolve(stdout.includes(bundleId));
        });
      });
      return result;
    } else if (process.platform === 'win32') {
      const { exec } = require('child_process');
      const result = await new Promise((resolve) => {
        exec('reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice" /v ProgId', (error, stdout) => {
          if (error) resolve(false);
          else resolve(stdout.includes('NodeiumHTM'));
        });
      });
      return result;
    } else {
      const { exec } = require('child_process');
      const desktopFile = app.name === 'nodeium' ? 'nodeium.desktop' : 'nodeium.desktop';
      const result = await new Promise((resolve) => {
        exec('xdg-settings get default-web-browser', (error, stdout) => {
          if (error) resolve(false);
          else resolve(stdout.includes(desktopFile.replace('.desktop', '')));
        });
      });
      return result;
    }
  } catch (error) {
    return false;
  }
});

// MCP Integration instance
let mcpIntegration = null;

const proxy = createProxy(http.createServer());
proxy.listen(3129)
//Function to enable AD Blocking and extensions...
let blocker = undefined
let extensions = undefined
async function enableGoodies(s) {
  blocker = await ElectronBlocker.fromLists(fetch, [
    'https://easylist.to/easylist/easylist.txt',
    'https://secure.fanboy.co.nz/fanboy-annoyance.txt',
    'https://easylist.to/easylist/easyprivacy.txt',
    'https://easylist-downloads.adblockplus.org/antiadblockfilters.txt',
    'https://raw.githubusercontent.com/hoshsadiq/adblock-nocoin-list/master/nocoin.txt',
    'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/pro.plus.txt',
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/refs/heads/master/filters/filters.txt',
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/refs/heads/master/filters/quick-fixes.txt',
    'https://github.com/uBlockOrigin/uAssets/raw/refs/heads/master/filters/unbreak.txt',
    'https://github.com/uBlockOrigin/uAssets/raw/refs/heads/master/filters/badware.txt',
    'https://github.com/uBlockOrigin/uAssets/raw/refs/heads/master/filters/annoyances-others.txt',
    'https://github.com/uBlockOrigin/uAssets/raw/refs/heads/master/filters/filters-mobile.txt',
    'https://github.com/uBlockOrigin/uAssets/raw/refs/heads/master/filters/filters-general.txt'
  ])
  blocker.enableBlockingInSession(s);
  try {
    extensions = new ElectronChromeExtensions({
    session: s
  })
  } catch {
    console.log("!?!")
  }
}

// 0.0.0.0 day fix
const locals = [
  '0.0.0.0', '127.0.0.1', '192.168', '.local', '.example', '.staging', 'fe80::', '::1'
];

// Function to check if a URL is restricted
function isLocal(url) {
  return locals.some(local => url.includes(local));
}


function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1220,
    height: 600,
    minWidth: 42,
    minHeight: 200,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      devTools: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      enableRemoteModule: false,
      sandbox: true,
      contextIsolation: true
    }
  })

  mainWindow.removeMenu()
  
  // Initialize MCP integration
  mcpIntegration = new NodeiumMCPIntegration(mainWindow, ipcMain);
  mcpIntegration.initialize().catch(console.error);

  
const toBlock = [
  "*://*.doubleclick.*",
  "*://s.innovid.com/*",
  "*://partner.googleadservices.com/*",
  "*://*.googlesyndication.com/*",
  "*://*.google-analytics.com/*",
  "*://creative.ak.fbcdn.net/*",
  "*://*.adbrite.com/*",
  "*://*.exponential.com/*",
  "*://*.quantserve.com/*",
  "*://*.scorecardresearch.com/*",
  "*://*.zedo.com/*",
  "*://*.a-ads.com/*",
  "*://*.777partner.com/*",
  "*://*.77tracking.com/*",
  "*://*.abc-ads.com/*",
  "*://*.aaxads.com/*",
  "*://*.adizio.com/*",
  "*://*.adjix.com/*",
  "*://*.adjug.com/*",
  "*://*.adjuggler.com/*",
  "*://*.trafficjunky.net/*",
  "*://*.trafficleader.com/*",
  "*://*.trafficrouter.io/*",
  "*://*.monerominer.rocks/*",
  "*://*.2mdn.net/*",
  "*.vbs",
  "*://*.googlesyndication.*",
  "*pixels*",
  "*telemetry*",
  "*analytics*",
  "*://ads.*.com*",
  "*ae/us/audience*",
  "*/api/v*/science*",
  "*/api/v*/typing*"
  ]
  
const regexPatterns = [
"r[0-100]+---sn-.*\.googlevideo\.com$/g",
"r[0-100]+-sn-.*\.googlevideo\.com$/g"
] 
  
  function containsAD(url) {
    var i;
    for (i = 0; i < toBlock.length; i++) {
        let regex = toBlock[i].replace(/\*/g, "[^ ]*");
        if (url.match(regex)) {
            return true;
        }
    }
    
    for (i = 0; i < regexPatterns.length; i++) {
        let regex = regexPatterns[i]
        if (url.match(regex)) {
            return true;
        }
    }

    return false;
  }
  session.defaultSession.clearStorageData({
    storages: [
      'appcache', 'indexeddb', 'shadercache', 'videocache', 'filesystem' 
    ]
  })  

  session.defaultSession.setProxy({
    proxyRules: 'http=localhost:3129;https=localhost:3129',
    proxyBypassRules: '<local>'
  })

  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (containsAD(details.url)) {
      return callback({cancel: true})
    }

    const url = new URL(details.url);
    const hostname = url.hostname;
    const isLocalDomain = isLocal(hostname);

    // Check if the request is to a local domain
    if (isLocalDomain) {
      // Check if the request is initiated by a remote domain
      const initiator = details.initiator ? new URL(details.initiator).hostname : '';
      const isInitiatorLocal = isLocal(initiator);

      if (initiator && !isInitiatorLocal) {
        console.log(`[W] Local domain is being accessed by external source (${initiator}), don't allow!`);
        callback({ cancel: true }); // Block request to local domains from remote sources
      } else {
        //console.log("Local domain is not being accessed by external source, allow..."); // debug
        callback({ cancel: false }); // Allow request
      }
    } else {
      //console.log("Request is not to a local domain, allow..."); //debug
      callback({ cancel: false }); // Allow non-local requests
    }
  })

  // and load the UI of the app.
  mainWindow.loadFile('index.html')

  
  return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  let x = createWindow()
  enableGoodies(session.defaultSession).then()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (mcpIntegration) {
    mcpIntegration.shutdown().catch(console.error);
  }
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Set DNS
app.on('ready', () => {
  app.configureHostResolver({
    mode: 'secure',
    dohServers: [
      'https://dns9.quad9.net/dns-query',
      'https://cloudflare-dns.com/dns-query'
    ]
  });
});
