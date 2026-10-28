
"use strict";

(() => {
  const $ = id => document.getElementById(id);
  let tabs = [];
  let activeTabId = null;

  const address = $("addressBar");
  const panel = $("sidePanel");
  const panelBody = $("panelBody");

  function status(message) {
    $("statusText").textContent = message;
  }

  function activeTab() {
    return tabs.find(tab => tab.id === activeTabId);
  }

  function navigate(value) {
    const text = String(value || "").trim();
    if (!text || !activeTabId) return;

    let destination;

    try {
      const url = new URL(text);
      destination = ["http:", "https:"].includes(url.protocol)
        ? url.href
        : null;
    } catch {
      destination = null;
    }

    if (!destination) {
      const domain = /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/.*)?$/i;

      destination = !/\s/.test(text) && domain.test(text)
        ? "https://" + text
        : "https://duckduckgo.com/?q=" + encodeURIComponent(text);
    }

    status("Loading page…");
    window.maraBridge.navigate(activeTabId, destination)
      .catch(error => status(error.message || "Navigation failed"));
  }

  function renderTabs() {
    const strip = $("tabStrip");
    strip.replaceChildren();

    for (const tab of tabs) {
      const item = document.createElement("div");
      item.className = "tab" + (tab.id === activeTabId ? " active" : "");
      item.setAttribute("role", "tab");
      item.setAttribute("aria-selected", String(tab.id === activeTabId));

      const select = document.createElement("button");
      select.className = "tab-select";
      select.textContent = (tab.private ? "◐ " : "") + tab.title;
      select.title = tab.url;
      select.addEventListener("click", () => {
        window.maraBridge.activateTab(tab.id);
      });

      const close = document.createElement("button");
      close.className = "tab-close";
      close.textContent = "×";
      close.title = "Close tab";
      close.addEventListener("click", event => {
        event.stopPropagation();
        window.maraBridge.closeTab(tab.id);
      });

      item.append(select, close);
      strip.append(item);
    }

    const add = document.createElement("button");
    add.className = "add-tab";
    add.textContent = "+";
    add.title = "New tab (Ctrl+T)";
    add.addEventListener("click", () => window.maraBridge.newTab());
    strip.append(add);

    $("privateBadge").hidden = !Boolean(activeTab()?.private);

    if (activeTab()) {
      const url = activeTab().url || "";
      address.value = url.startsWith("file:") ? "Mara internal page" : url;
      $("secureMark").textContent = url.startsWith("https://") ? "◆" : "◇";
      document.title = `${activeTab().title} — Mara`;
    }
  }

  function showPanel(title, content) {
    $("panelTitle").textContent = title;
    panelBody.replaceChildren();

    if (typeof content === "string") {
      const p = document.createElement("p");
      p.textContent = content;
      panelBody.append(p);
    } else if (content) {
      panelBody.append(content);
    }

    panel.hidden = false;
  }

  function button(label, action) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "panel-action";
    el.textContent = label;
    el.addEventListener("click", action);
    return el;
  }

  function showBookmarks() {
    const content = document.createElement("div");
    const entries = window.MaraBookmarks.getAll();

    if (!entries.length) {
      content.textContent = "No bookmarks yet. Press ☆ to save a page.";
    }

    for (const entry of entries) {
      const row = document.createElement("div");
      row.className = "panel-item";

      row.append(
        button(entry.title, () => navigate(entry.url)),
        button("×", () => {
          window.MaraBookmarks.remove(entry.id);
          showBookmarks();
        })
      );

      content.append(row);
    }

    showPanel("Bookmarks", content);
  }

  function showHistory() {
    const content = document.createElement("div");
    const entries = window.MaraHistory.getAll();

    if (!entries.length) {
      content.textContent = "No visits recorded yet.";
    }

    for (const entry of entries) {
      const row = document.createElement("div");
      row.className = "panel-item";
      row.append(button(entry.title || entry.url, () => navigate(entry.url)));
      content.append(row);
    }

    content.append(button("Clear Mara history", () => {
      if (confirm("Clear locally recorded Mara history?")) {
        window.MaraHistory.clear();
        showHistory();
      }
    }));

    showPanel("History", content);
  }

  async function showPrivacy() {
    const info = await window.MaraPrivacy.getStatus();
    const content = document.createElement("div");

    for (const [key, value] of Object.entries(info)) {
      const p = document.createElement("p");
      p.textContent = `${key}: ${String(value)}`;
      content.append(p);
    }

    showPanel("Privacy status", content);
  }

  function init() {
    $("addressForm").addEventListener("submit", event => {
      event.preventDefault();
      navigate(address.value);
    });

    $("backBtn").addEventListener("click", () => window.maraBridge.back());
    $("forwardBtn").addEventListener("click", () => window.maraBridge.forward());
    $("reloadBtn").addEventListener("click", () => window.maraBridge.reload());
    $("homeBtn").addEventListener("click", () => window.maraBridge.newTab());
    $("customizeBtn").addEventListener("click", () => {
      window.maraBridge.newTab().then(id => {
        window.maraBridge.navigate(id, "mara://customize");
      });
    });

    $("bookmarkBtn").addEventListener("click", () => {
      const tab = activeTab();
      if (!tab || !/^https?:/.test(tab.url)) {
        status("Open a website before bookmarking.");
        return;
      }

      window.MaraBookmarks.add(tab.url, tab.title);
      status("Bookmark saved.");
    });

    $("bookmarksBtn").addEventListener("click", showBookmarks);
    $("historyBtn").addEventListener("click", showHistory);
    $("privacyBtn").addEventListener("click", showPrivacy);
    $("panelClose").addEventListener("click", () => panel.hidden = true);

    window.maraBridge.onTabs(data => {
      tabs = data.tabs || [];
      activeTabId = data.activeTabId;
      renderTabs();

      const current = activeTab();
      if (current) {
        status(current.loading ? "Loading…" : "Ready");
        if (!current.private && /^https?:/.test(current.url)) {
          window.MaraHistory.record(current.url, current.title);
        }
      }
    });

    window.maraBridge.onError(message => status("Error: " + message));

    window.maraBridge.onFocusAddress(() => {
      address.focus();
      address.select();
    });

    window.maraBridge.onBookmarkCurrent(() => {
      $("bookmarkBtn").click();
    });

    window.MaraThemeEngine.init();
    window.MaraShortcuts.init();

    status("Mara is ready");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
