
"use strict";

(() => {
  function init() {
    document.addEventListener("keydown", event => {
      const key = event.key.toLowerCase();
      const mod = event.ctrlKey || event.metaKey;

      if (!mod) return;

      if (key === "l") {
        event.preventDefault();
        const address = document.querySelector("#addressBar");

        if (address) {
          address.focus();
          address.select();
        }
      }

      if (key === "r") {
        event.preventDefault();
        window.maraBridge?.reload?.();
      }

      if (key === "[") {
        event.preventDefault();
        window.maraBridge?.back?.();
      }

      if (key === "]") {
        event.preventDefault();
        window.maraBridge?.forward?.();
      }

      if (key === "k") {
        event.preventDefault();
        window.MaraAI?.toggle?.();
      }

      if (key === "d") {
        event.preventDefault();

        const url = window.MaraCurrentUrl;

        if (url && window.MaraBookmarks) {
          try {
            window.MaraBookmarks.add(url, document.title || url);
          } catch (error) {
            console.error(error);
          }
        }
      }
    });
  }

  window.MaraShortcuts = Object.freeze({ init });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
