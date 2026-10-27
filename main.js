"use strict";

const {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  session,
  shell
} = require("electron");

const path = require("node:path");

let win;
let browser;
let currentAddress = "https://www.google.com";

function validUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function resolveAddress(value) {
  const input = String(value || "").trim();

  if (!input) return "https://www.google.com";

  const direct = validUrl(
    /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(input)
      ? input
      : `https://${input}`
  );

  if (direct) return direct;

  return "https://www.google.com/search?q=" +
    encodeURIComponent(input);
}

function sendState() {
  if (!win || win.isDestroyed() || !browser) return;

  win.webContents.send("browser:state", {
    url: browser.webContents.getURL(),
    title: browser.webContents.getTitle(),
    canGoBack: browser.webContents.canGoBack(),
    canGoForward: browser.webContents.canGoForward(),
    loading: browser.webContents.isLoading()
  });
}

function updateBounds() {
  if (!win || win.isDestroyed() || !browser) return;

  const [width, height] = win.getContentSize();

  browser.setBounds({
    x: 0,
    y: 116,
    width: Math.max(0, width),
    height: Math.max(0, height - 116)
  });
}

function navigate(value) {
  const target = resolveAddress(value);
  currentAddress = target;
  browser.webContents.loadURL(target).catch(() => sendState());
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 360,
    minHeight: 320,
    backgroundColor: "#071713",
    title: "Mara Browser",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  browser = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      partition: "persist:mara",
      autoplayPolicy: "user-gesture-required"
    }
  });

  win.addBrowserView(browser);
  updateBounds();

  browser.webContents.setWindowOpenHandler(({ url }) => {
    const target = validUrl(url);

    if (target) {
      shell.openExternal(target).catch(() => {});
    }

    return { action: "deny" };
  });

  browser.webContents.on("will-navigate", (event, url) => {
    if (!validUrl(url)) event.preventDefault();
  });

  browser.webContents.on("did-navigate", sendState);
  browser.webContents.on("did-navigate-in-page", sendState);
  browser.webContents.on("page-title-updated", sendState);
  browser.webContents.on("did-start-loading", sendState);
  browser.webContents.on("did-stop-loading", sendState);
  browser.webContents.on("did-fail-load", (_event, code, description, url, isMainFrame) => {
    if (isMainFrame && code !== -3) {
      win?.webContents.send("browser:error", {
        message: description,
        url
      });
    }
  });

  win.on("resize", updateBounds);
  win.on("closed", () => {
    win = null;
    browser = null;
  });

  win.loadFile("index.html").then(() => {
    updateBounds();
    navigate("https://www.google.com");
  });

  win.webContents.on("did-finish-load", sendState);
}

ipcMain.handle("browser:navigate", (_event, value) => {
  if (!browser) return;
  navigate(value);
});

ipcMain.handle("browser:back", () => {
  if (browser?.webContents.canGoBack()) {
    browser.webContents.goBack();
  }
});

ipcMain.handle("browser:forward", () => {
  if (browser?.webContents.canGoForward()) {
    browser.webContents.goForward();
  }
});

ipcMain.handle("browser:reload", () => {
  browser?.webContents.reload();
});

ipcMain.handle("browser:home", () => {
  navigate("https://www.google.com");
});

ipcMain.handle("browser:bounds", () => {
  updateBounds();
});

ipcMain.handle("browser:privacy", () => ({
  trackingProtection: "basic",
  externalAI: "not connected",
  localHistory: "stored in the browser profile",
  note: "This prototype does not yet implement comprehensive tracker blocking."
}));

// Deny website permission requests by default.
// Add a deliberate permission UI before supporting camera or microphone.
app.whenReady().then(() => {
  session.fromPartition("persist:mara").setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false)
  );

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
