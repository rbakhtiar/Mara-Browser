
"use strict";

const {
  app,
  BrowserWindow,
  WebContentsView,
  session,
  ipcMain,
  shell
} = require("electron");

const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = __dirname;
const HEADER_HEIGHT = 118;
const tabs = new Map();

let win;
let activeTabId = null;

const INTERNAL = {
  "mara://newtab": "newtab.html",
  "mara://customize": "customize.html"
};

function safeWebUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function resolveDestination(input) {
  const text = String(input || "").trim();
  if (!text) return null;

  if (INTERNAL[text]) return text;

  try {
    const url = new URL(text);
    if (safeWebUrl(url.href)) return url.href;
  } catch {}

  if (
    !/\s/.test(text) &&
    /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/.*)?$/i.test(text)
  ) {
    return "https://" + text;
  }

  return "https://duckduckgo.com/?q=" + encodeURIComponent(text);
}

function sendState() {
  if (!win || win.isDestroyed()) return;

  const list = [...tabs.values()].map(tab => ({
    id: tab.id,
    title: tab.view.webContents.getTitle() || "New Tab",
    url: tab.view.webContents.getURL(),
    private: tab.private,
    loading: tab.view.webContents.isLoading(),
    active: tab.id === activeTabId
  }));

  win.webContents.send("mara:tabs", {
    tabs: list,
    activeTabId
  });
}

function setViewBounds() {
  if (!win || win.isDestroyed()) return;

  const [width, height] = win.getContentSize();

  for (const tab of tabs.values()) {
    tab.view.setBounds(
      tab.id === activeTabId
        ? {
            x: 0,
            y: HEADER_HEIGHT,
            width,
            height: Math.max(0, height - HEADER_HEIGHT)
          }
        : { x: 0, y: HEADER_HEIGHT, width: 0, height: 0 }
    );
  }
}

async function loadDestination(tab, destination) {
  const resolved = resolveDestination(destination);

  if (!resolved) throw new Error("Enter a website or search term.");

  if (INTERNAL[resolved]) {
    await tab.view.webContents.loadFile(
      path.join(ROOT, INTERNAL[resolved])
    );
  } else if (safeWebUrl(resolved)) {
    await tab.view.webContents.loadURL(resolved);
  } else {
    throw new Error("Unsupported address.");
  }

  sendState();
}

function getActiveTab() {
  return tabs.get(activeTabId);
}

function addTab({ privateMode = false, url = "mara://newtab" } = {}) {
  const id = crypto.randomUUID();

  const ses = privateMode
    ? session.fromPartition(`mara-private-${id}`, { cache: false })
    : session.fromPartition("persist:mara");

  // No preload is exposed to websites. Website JavaScript cannot
  // access Mara's privileged IPC bridge.
  const view = new WebContentsView({
    webPreferences: {
      session: ses,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const tab = {
    id,
    view,
    private: privateMode,
    session: ses
  };

  tabs.set(id, tab);
  win.contentView.addChildView(view);
  activateTab(id);

  const wc = view.webContents;

  wc.setWindowOpenHandler(({ url: target }) => {
    const destination = resolveDestination(target);

    if (destination) addTab({ url: destination });
    return { action: "deny" };
  });

  wc.on("will-navigate", (event, target) => {
    if (INTERNAL[target]) {
      event.preventDefault();
      loadDestination(tab, target).catch(reportError);
      return;
    }

    if (!safeWebUrl(target) && !target.startsWith("file:")) {
      event.preventDefault();
    }
  });

  wc.on("did-navigate", sendState);
  wc.on("did-navigate-in-page", sendState);
  wc.on("page-title-updated", sendState);
  wc.on("did-start-loading", sendState);
  wc.on("did-stop-loading", sendState);

  wc.on("did-fail-load", (_event, code, description, url, mainFrame) => {
    if (mainFrame && code !== -3) {
      reportError(`${description} (${code})`);
    }
  });

  // Core shortcuts also work when the webpage has keyboard focus.
  wc.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") return;

    const key = input.key.toLowerCase();
    const mod = process.platform === "darwin" ? input.meta : input.control;

    if (mod && key === "t") {
      event.preventDefault();
      addTab();
    } else if (mod && key === "w") {
      event.preventDefault();
      closeTab(id);
    } else if (mod && key === "i") {
      event.preventDefault();
      addTab({ privateMode: true });
    } else if (mod && key === "l") {
      event.preventDefault();
      win.webContents.send("mara:focus-address");
    } else if (mod && key === "r") {
      event.preventDefault();
      wc.reload();
    } else if (mod && key === "d") {
      event.preventDefault();
      win.webContents.send("mara:bookmark-current");
    } else if (mod && input.shift && key === "n") {
      event.preventDefault();
      addTab({ privateMode: true });
    } else if (input.alt && key === "arrowleft") {
      event.preventDefault();
      if (wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
    } else if (input.alt && key === "arrowright") {
      event.preventDefault();
      if (wc.navigationHistory.canGoForward()) wc.navigationHistory.goForward();
    }
  });

  loadDestination(tab, url).catch(reportError);
  return id;
}

function activateTab(id) {
  if (!tabs.has(id)) return;

  activeTabId = id;
  setViewBounds();
  sendState();
}

async function closeTab(id) {
  const tab = tabs.get(id);
  if (!tab) return;

  tabs.delete(id);

  try {
    win.contentView.removeChildView(tab.view);
    tab.view.webContents.close();
  } catch (error) {
    console.error("Closing tab:", error);
  }

  if (tab.private) {
    try {
      await tab.session.clearStorageData();
      await tab.session.clearCache();
    } catch (error) {
      console.error("Clearing private session:", error);
    }
  }

  if (activeTabId === id) {
    activeTabId = [...tabs.keys()].at(-1) || null;

    if (!activeTabId) addTab();
    else activateTab(activeTabId);
  }

  setViewBounds();
  sendState();
}

function reportError(message) {
  if (win && !win.isDestroyed()) {
    win.webContents.send("mara:error", String(message));
  }
}

function registerIpc() {
  const trusted = event => event.sender === win?.webContents;

  ipcMain.handle("mara:navigate", async (event, id, url) => {
    if (!trusted(event)) throw new Error("Untrusted IPC sender.");
    const tab = tabs.get(id);
    if (!tab) throw new Error("Tab not found.");
    await loadDestination(tab, url);
  });

  ipcMain.handle("mara:new-tab", (event, options = {}) => {
    if (!trusted(event)) throw new Error("Untrusted IPC sender.");
    return addTab({
      privateMode: Boolean(options.privateMode),
      url: "mara://newtab"
    });
  });

  ipcMain.handle("mara:activate-tab", (event, id) => {
    if (!trusted(event)) throw new Error("Untrusted IPC sender.");
    activateTab(id);
  });

  ipcMain.handle("mara:close-tab", (event, id) => {
    if (!trusted(event)) throw new Error("Untrusted IPC sender.");
    return closeTab(id);
  });

  ipcMain.handle("mara:back", event => {
    if (!trusted(event)) throw new Error("Untrusted IPC sender.");
    const wc = getActiveTab()?.view.webContents;
    if (wc?.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
  });

  ipcMain.handle("mara:forward", event => {
    if (!trusted(event)) throw new Error("Untrusted IPC sender.");
    const wc = getActiveTab()?.view.webContents;
    if (wc?.navigationHistory.canGoForward()) wc.navigationHistory.goForward();
  });

  ipcMain.handle("mara:reload", event => {
    if (!trusted(event)) throw new Error("Untrusted IPC sender.");
    getActiveTab()?.view.webContents.reload();
  });

  ipcMain.handle("mara:privacy-info", event => {
    if (!trusted(event)) throw new Error("Untrusted IPC sender.");
    return {
      engine: "Chromium via Electron",
      trackerBlocking: false,
      permissionRequests: "denied by default",
      privateTabSupport: true,
      aiService: false
    };
  });

  ipcMain.handle("mara:open-external", async (event, url) => {
    if (!trusted(event) || !safeWebUrl(url)) {
      throw new Error("Invalid external URL.");
    }
    await shell.openExternal(url);
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 760,
    minHeight: 500,
    title: "Mara Browser",
    backgroundColor: "#07120F",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(ROOT, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(ROOT, "index.html"));

  win.webContents.on("did-finish-load", () => {
    if (!tabs.size) addTab();
    sendState();
  });

  win.on("resize", setViewBounds);

  win.on("closed", () => {
    win = null;
    browserViewCleanup();
  });
}

function browserViewCleanup() {
  for (const tab of tabs.values()) {
    try {
      tab.view.webContents.close();
    } catch {}
  }
  tabs.clear();
  activeTabId = null;
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
