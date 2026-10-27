
"use strict";

(() => {
  const STORAGE_PREFIX = "mara.";

  function getSetting(key, fallback = null) {
    try {
      const value = localStorage.getItem(STORAGE_PREFIX + key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function setSetting(key, value) {
    try {
      localStorage.setItem(
        STORAGE_PREFIX + key,
        JSON.stringify(value)
      );
      return true;
    } catch {
      return false;
    }
  }

  function removeSetting(key) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
      return true;
    } catch {
      return false;
    }
  }

  function resolveAddress(input, engine = "google") {
    const text = String(input || "").trim();

    if (!text) return null;

    // Explicit URLs are accepted only for HTTP and HTTPS.
    try {
      const url = new URL(text);

      if (["http:", "https:"].includes(url.protocol)) {
        return url.href;
      }
    } catch {
      // The input may be a domain or search query.
    }

    // A domain-like input without spaces becomes HTTPS.
    if (
      !/\s/.test(text) &&
      /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/.*)?$/i.test(text)
    ) {
      return "https://" + text;
    }

    const engines = {
      google: "https://www.google.com/search?q=",
      duckduckgo: "https://duckduckgo.com/?q=",
      bing: "https://www.bing.com/search?q="
    };

    return (engines[engine] || engines.duckduckgo) +
      encodeURIComponent(text);
  }

  function isSafeWebUrl(value) {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }

  window.MaraUtils = Object.freeze({
    getSetting,
    setSetting,
    removeSetting,
    resolveAddress,
    isSafeWebUrl
  });
})();
