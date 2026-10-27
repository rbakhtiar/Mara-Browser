
"use strict";

const {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  shell
} = require("electron");

const path = require("node:path");

let win = null;
let browserView = null;

const CHROME_HEIGHT = 116;
const MIN_WIDTH = 600;
const MIN_HEIGHT = 450;

const INTERNAL_PAGES = {
  "mara://newtab": "newtab.html",
  "mara://settings": "settings.html"
};

function sendState(extra = {}) {
  if (!win || win.isDestroyed() || !browserView) return;

  const contents = browserView.webContents;

  win.webContents.send("mara:state", {
    url: contents.getURL(),
    title: contents.getTitle() || "Mara",
    loading: contents.isLoading(),
    canGoBack: contents.navigationHistory.canGoBack(),
    canGoForward: contents.navigationHistory.canGoForward(),
    ...extra
  });
}

function setBrowserBounds() {
  if (!win || win.isDestroyed() || !browserView) return;

  const [width, height] = win.getContentSize();

  browserView.setBounds({
    x: 0,
    y: CHROME_HEIGHT,
    width: Math.max(0, width),
    height: Math.max(0, height - CHROME_HEIGHT)
  });

  browserView.setAutoResize({
    width: true,
    height: true
  });
}

function isWebUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

async function navigateTo(value) {
  if (!browserView || typeof value !== "string") {
    throw new Error("Browser is not ready.");
  }

  const destination = value.trim();

  if (INTERNAL_PAGES[destination]) {
    await browserView.webContents.loadFile(
      path.join(__dirname, INTERNAL_PAGES[destination])
    );
    return;
  }

  if (!isWebUrl(destination)) {
    throw new Error("Only HTTP, HTTPS, and approved Mara pages are allowed.");
  }

  await browserView.webContents.loadURL(destination);
}

function goHome() {
  return navigateTo("mara://newtab");
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    title: "Mara Browser",
    backgroundColor: "#07120F",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, "index.html"));

  browserView = new BrowserView({
    webPreferences: {
      partition: "persist:mara",
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.setBrowserView(browserView);
  setBrowserBounds();

  const contents = browserView.webContents;

  // Do not let websites open arbitrary new windows inside Mara.
  contents.setWindowOpenHandler(({ url }) => {
    if (isWebUrl(url)) {
      shell.openExternal(url).catch(error => {
        console.error("Could not open external link:", error);
      });
    }

    return { action: "deny" };
  });

  // Deny site permission requests by default.
  contents.session.setPermissionRequestHandler(
    (_webContents, _permission, callback) => {
      callback(false);
    }
  );

  contents.on("did-start-loading", () => {
    sendState({ loading: true });
  });

  contents.on("did-stop-loading", () => {
    sendState({ loading: false });
  });

  contents.on("did-navigate", () => sendState());
  contents.on("did-navigate-in-page", () => sendState());
  contents.on("page-title-updated", () => sendState());

  contents.on("render-process-gone", (_event, details) => {
    sendState({
      loading: false,
      error: `Page process stopped: ${details.reason}`
    });
  });

  contents.on("did-fail-load", (_event, code, description, url, isMainFrame) => {
    if (isMainFrame && code !== -3) {
      win?.webContents.send(
        "mara:error",
        `${description} (${code})`
      );
    }
  });

  win.on("resize", setBrowserBounds);
  win.on("maximize", setBrowserBounds);
  win.on("unmaximize", setBrowserBounds);

  win.on("closed", () => {
    browserView = null;
    win = null;
  });

  // Load the custom start page after the browser is initialized.
  goHome().catch(error => {
    console.error("Could not load Mara's start page:", error);
  });
}

function registerIpcHandlers() {
  ipcMain.handle("mara:navigate", async (_event, url) => {
    try {
      await navigateTo(url);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle("mara:back", () => {
    if (browserView?.webContents.navigationHistory.canGoBack()) {
      browserView.webContents.navigationHistory.goBack();
    }
  });

  ipcMain.handle("mara:forward", () => {
    if (browserView?.webContents.navigationHistory.canGoForward()) {
      browserView.webContents.navigationHistory.goForward();
    }
  });

  ipcMain.handle("mara:reload", () => {
    browserView?.webContents.reload();
  });

  ipcMain.handle("mara:home", () => goHome());

  ipcMain.handle("mara:update-bounds", () => {
    setBrowserBounds();
  });

  ipcMain.handle("mara:privacy-info", () => ({
    permissionRequests: "denied-by-default",
    trackerBlocking: false,
    privateBrowsing: false,
    persistentProfile: true,
    partition: "persist:mara"
  }));
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
