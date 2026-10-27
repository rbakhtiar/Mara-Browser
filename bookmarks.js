
"use strict";

(() => {
  const KEY = "mara.bookmarks";

  function readAll() {
    try {
      const items = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  function saveAll(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
  }

  function add(url, title = url) {
    if (!window.MaraUtils?.isSafeWebUrl(url)) {
      throw new Error("Only HTTP and HTTPS bookmarks are supported.");
    }

    const items = readAll();

    if (items.some(item => item.url === url)) {
      return items.find(item => item.url === url);
    }

    const bookmark = {
      id: crypto.randomUUID(),
      title: String(title).slice(0, 200),
      url,
      createdAt: new Date().toISOString()
    };

    items.unshift(bookmark);
    saveAll(items);
    return bookmark;
  }

  function remove(id) {
    saveAll(readAll().filter(item => item.id !== id));
  }

  function getAll() {
    return readAll();
  }

  function clear() {
    saveAll([]);
  }

  function render(container, onOpen) {
    if (!container) return;

    container.replaceChildren();

    for (const item of getAll()) {
      const row = document.createElement("div");
      row.className = "mara-bookmark";

      const open = document.createElement("button");
      open.type = "button";
      open.textContent = item.title;
      open.title = item.url;
      open.addEventListener("click", () => onOpen?.(item.url));

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "Remove";
      removeButton.addEventListener("click", () => {
        remove(item.id);
        render(container, onOpen);
      });

      row.append(open, removeButton);
      container.append(row);
    }
  }

  window.MaraBookmarks = Object.freeze({
    add,
    remove,
    getAll,
    clear,
    render
  });
})();
