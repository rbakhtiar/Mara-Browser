
"use strict";

(() => {
  const $ = id => document.getElementById(id);

  const addressBar = $("addressBar");
  const pageStatus = $("pageStatus");
  const privacyStatus = $("privacyStatus");
  const panel = $("utilityPanel");
  const panelTitle = $("panelTitle");
  const panelContent = $("panelContent");

  function setStatus(message) {
    if (pageStatus) pageStatus.textContent = message;
  }

  function navigate(input) {
    const url = window.MaraSearch?.resolve(input);

    if (!url) {
      setStatus("Enter a website or search term.");
      return;
    }

    if (!window.maraBridge?.navigate) {
      setStatus("Browser engine is not connected. Check preload.js.");
      return;
    }

    setStatus("Opening page…");
    window.maraBridge.navigate(url);
  }

  function openInternalPage(page) {
    if (!["newtab", "settings"].includes(page)) return;

    if (!window.maraBridge?.navigate) {
      setStatus("Browser engine is not connected.");
      return;
    }

    window.maraBridge.navigate(`mara://${page}`);
  }

  function showPanel(title, content) {
    panelTitle.textContent = title;
    panelContent.replaceChildren();

    if (typeof content === "string") {
      const p = document.createElement("p");
      p.textContent = content;
      panelContent.append(p);
    } else if (content) {
      panelContent.append(content);
    }

    panel.hidden = false;
  }

  function closePanel() {
    panel.hidden = true;
  }

  function makeButton(text, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", action);
    return button;
  }

  function openBookmarksPanel() {
    const container = document.createElement("div");
    const bookmarks = window.MaraBookmarks?.getAll() || [];

    if (!bookmarks.length) {
      container.textContent = "No bookmarks saved yet. Press ☆ to save a page.";
    } else {
      for (const item of bookmarks) {
        const row = document.createElement("div");
        row.className = "mara-panel-row";

        const open = makeButton(item.title || item.url, () => navigate(item.url));
        const remove = makeButton("Remove", () => {
          window.MaraBookmarks.remove(item.id);
          openBookmarksPanel();
        });

        row.append(open, remove);
        container.append(row);
      }
    }

    showPanel("Your Bookmarks", container);
  }

  function openHistoryPanel() {
    const container = document.createElement("div");
    const history = window.MaraHistory?.getAll() || [];

    if (!history.length) {
      container.textContent = "No locally recorded visits yet.";
    } else {
      for (const item of history) {
        const row = document.createElement("div");
        row.className = "mara-panel-row";

        const open = makeButton(item.title || item.url, () => navigate(item.url));
        const date = document.createElement("small");
        date.textContent = new Date(item.visitedAt).toLocaleString();

        row.append(open, date);
        container.append(row);
      }
    }

    container.append(
      makeButton("Clear Mara history", () => {
        if (confirm("Clear Mara's locally recorded history?")) {
          window.MaraHistory.clear();
          openHistoryPanel();
        }
      })
    );

    showPanel("Browsing History", container);
  }

  async function openPrivacyPanel() {
    const container = document.createElement("div");
    const result = await window.MaraPrivacy?.getStatus();

    const intro = document.createElement("p");
    intro.textContent = result?.message ||
      "Privacy status is not connected yet.";

    const list = document.createElement("ul");

    for (const item of [
      "Permission requests are controlled by the Electron main process.",
      "A full tracker blocker is not implemented yet.",
      "Private browsing is not implemented yet."
    ]) {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    }

    container.append(intro, list);
    showPanel("Mara Privacy", container);
  }

  function openSettingsPanel() {
    const container = document.createElement("div");

    const themeLabel = document.createElement("label");
    themeLabel.textContent = "Appearance ";

    const themeSelect = document.createElement("select");
    themeSelect.id = "themeSelect";

    for (const [value, theme] of Object.entries(window.MaraThemes.themes)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = theme.name;
      themeSelect.append(option);
    }

    themeSelect.value = window.MaraUtils.getSetting("theme", "emerald");
    themeSelect.addEventListener("change", () => {
      window.MaraThemes.apply(themeSelect.value);
    });

    themeLabel.append(themeSelect);

    const engineLabel = document.createElement("label");
    engineLabel.textContent = "Search engine ";

    const engineSelect = document.createElement("select");
    engineSelect.id = "searchEngine";

    for (const [value, engine] of Object.entries(window.MaraSearch.engines)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = engine.name;
      engineSelect.append(option);
    }

    engineSelect.value = window.MaraSearch.getEngine();
    engineSelect.addEventListener("change", () => {
      window.MaraSearch.setEngine(engineSelect.value);
    });

    engineLabel.append(engineSelect);

    container.append(themeLabel, engineLabel);
    container.append(makeButton("Open full settings page", () => {
      closePanel();
      openInternalPage("settings");
    }));

    showPanel("Mara Settings", container);
  }

  function bind(id, callback) {
    const element = $(id);
    if (element) element.addEventListener("click", callback);
  }

  function init() {
    $("addressForm")?.addEventListener("submit", event => {
      event.preventDefault();
      navigate(addressBar.value);
    });

    bind("backBtn", () => window.maraBridge?.back?.());
    bind("forwardBtn", () => window.maraBridge?.forward?.());
    bind("reloadBtn", () => window.maraBridge?.reload?.());
    bind("homeBtn", () => openInternalPage("newtab"));
    bind("settingsBtn", openSettingsPanel);
    bind("privacyBtn", openPrivacyPanel);
    bind("bookmarkBtn", () => {
      const url = window.MaraCurrentUrl;

      if (!url || !window.MaraUtils.isSafeWebUrl(url)) {
        setStatus("Open a website before bookmarking it.");
        return;
      }

      try {
        window.MaraBookmarks.add(url, document.title || url);
        setStatus("Bookmark saved.");
      } catch {
        setStatus("Could not save this bookmark.");
      }
    });

    bind("aiBtn", () => {
      window.MaraAI?.toggle?.();
    });

    bind("closePanelBtn", closePanel);

    // Also open these panels from the keyboard if desired.
    window.MaraOpenBookmarks = openBookmarksPanel;
    window.MaraOpenHistory = openHistoryPanel;

    window.MaraHistory?.init?.();
    window.MaraSearch?.init?.();
    window.MaraShortcuts?.init?.();

    window.maraBridge?.onState?.(state => {
      if (!state || typeof state !== "object") return;

      if (typeof state.url === "string") {
        window.MaraCurrentUrl = state.url;

        if (addressBar && document.activeElement !== addressBar) {
          addressBar.value = state.url.startsWith("file:")
            ? "Mara · Internal page"
            : state.url;
        }

        const secure = state.url.startsWith("https://");
        $("securityIndicator").textContent = secure ? "◆" : "◇";
        $("securityIndicator").title = secure
          ? "HTTPS connection"
          : "Connection security varies";
      }

      if (typeof state.title === "string") {
        document.title = `${state.title} — Mara`;
      }

      if (state.loading) {
        setStatus("Loading…");
      } else {
        setStatus(state.title || "Page loaded");
      }
    });

    window.maraBridge?.onError?.(message => {
      setStatus("Navigation error: " + String(message || "Unknown error"));
    });

    if (privacyStatus) {
      privacyStatus.textContent = "Privacy: basic controls";
    }

    setStatus("Mara is ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
