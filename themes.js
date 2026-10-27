
"use strict";

(() => {
  const themes = {
    emerald: {
      name: "Dark Emerald",
      background: "#07120F",
      surface: "#10211B",
      accent: "#0F8060",
      gold: "#D9BD83",
      text: "#F1F4EF"
    },
    midnight: {
      name: "Midnight",
      background: "#0A0B12",
      surface: "#171925",
      accent: "#5558A6",
      gold: "#C7C9F0",
      text: "#F2F2FA"
    },
    arctic: {
      name: "Arctic",
      background: "#EAF2F5",
      surface: "#FFFFFF",
      accent: "#277D91",
      gold: "#A16B22",
      text: "#14272E"
    },
    champagne: {
      name: "Champagne",
      background: "#17130F",
      surface: "#29221B",
      accent: "#8A6942",
      gold: "#E5C99A",
      text: "#F8F0E4"
    }
  };

  function apply(name) {
    const theme = themes[name] || themes.emerald;
    const root = document.documentElement;

    for (const [key, value] of Object.entries({
      "--mara-bg": theme.background,
      "--mara-surface": theme.surface,
      "--mara-accent": theme.accent,
      "--mara-gold": theme.gold,
      "--mara-text": theme.text
    })) {
      root.style.setProperty(key, value);
    }

    document.documentElement.dataset.theme =
      themes[name] ? name : "emerald";

    window.MaraUtils?.setSetting("theme", name in themes ? name : "emerald");
  }

  function init() {
    apply(window.MaraUtils?.getSetting("theme", "emerald") || "emerald");

    document.querySelectorAll("[data-mara-theme]").forEach(button => {
      button.addEventListener("click", () => {
        apply(button.dataset.maraTheme);
      });
    });

    const selector = document.querySelector("#themeSelect");

    if (selector) {
      selector.value = window.MaraUtils?.getSetting("theme", "emerald") || "emerald";
      selector.addEventListener("change", () => apply(selector.value));
    }
  }

  window.MaraThemes = Object.freeze({
    themes,
    apply,
    init
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
