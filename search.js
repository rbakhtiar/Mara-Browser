
"use strict";

(() => {
  const engines = {
    google: {
      name: "Google",
      url: "https://www.google.com/search?q="
    },
    duckduckgo: {
      name: "DuckDuckGo",
      url: "https://duckduckgo.com/?q="
    },
    bing: {
      name: "Bing",
      url: "https://www.bing.com/search?q="
    }
  };

  function getEngine() {
    const saved = window.MaraUtils?.getSetting("searchEngine", "duckduckgo");
    return engines[saved] ? saved : "duckduckgo";
  }

  function setEngine(name) {
    if (!engines[name]) {
      throw new Error("Unsupported search engine.");
    }

    window.MaraUtils?.setSetting("searchEngine", name);
    return name;
  }

  function resolve(input) {
    return window.MaraUtils.resolveAddress(input, getEngine());
  }

  function searchUrl(query) {
    return engines[getEngine()].url + encodeURIComponent(query);
  }

  function init() {
    const selector = document.querySelector("#searchEngine");

    if (selector) {
      selector.value = getEngine();

      selector.addEventListener("change", () => {
        try {
          setEngine(selector.value);
        } catch (error) {
          console.error("Mara search setting:", error);
        }
      });
    }
  }

  window.MaraSearch = Object.freeze({
    engines,
    getEngine,
    setEngine,
    resolve,
    searchUrl,
    init
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
