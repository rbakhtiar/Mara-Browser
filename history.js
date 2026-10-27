
"use strict";

(() => {
  const KEY = "mara.history";
  const MAX_ITEMS = 500;

  function getAll() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function record(url, title = url) {
    if (!window.MaraUtils?.isSafeWebUrl(url)) return;

    const items = getAll().filter(item => item.url !== url);

    items.unshift({
      url,
      title: String(title || url).slice(0, 200),
      visitedAt: new Date().toISOString()
    });

    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function render(container, onOpen) {
    if (!container) return;

    container.replaceChildren();

    for (const item of getAll()) {
      const row = document.createElement("div");
      row.className = "mara-history-item";

      const link = document.createElement("button");
      link.type = "button";
      link.textContent = item.title || item.url;
      link.title = item.url;
      link.addEventListener("click", () => onOpen?.(item.url));

      const date = document.createElement("small");
      date.textContent = new Date(item.visitedAt).toLocaleString();

      row.append(link, date);
      container.append(row);
    }
  }

  function init() {
    // Connect to the browser-state event if the main process
    // sends the current URL and title.
    window.maraBridge?.onState?.(state => {
      if (!state || typeof state !== "object") return;

      const url = state.url;
      const title = state.title || url;

      if (url) record(url, title);
      window.MaraCurrentUrl = url || window.MaraCurrentUrl;
    });
  }

  window.MaraHistory = Object.freeze({
    getAll,
    record,
    clear,
    render,
    init
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
