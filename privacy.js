
"use strict";

(() => {
  async function getStatus() {
    try {
      const info = await window.maraBridge?.getPrivacyInfo?.();

      return {
        available: Boolean(info),
        details: info || {},
        message: info
          ? "Using the privacy information supplied by Mara."
          : "Privacy status is not connected to the browser process yet."
      };
    } catch {
      return {
        available: false,
        details: {},
        message: "Privacy information could not be loaded."
      };
    }
  }

  async function render(container) {
    if (!container) return;

    container.replaceChildren();

    const heading = document.createElement("h2");
    heading.textContent = "Mara Privacy";

    const description = document.createElement("p");
    description.textContent = "Privacy status and browser controls.";

    const status = await getStatus();

    const message = document.createElement("p");
    message.textContent = status.message;

    const list = document.createElement("ul");

    const items = [
      ["Browser privacy status", status.available ? "Information available" : "Not connected"],
      ["Permission requests", "Check the Electron main-process configuration"],
      ["Tracker blocking", "Not implemented by this module"],
      ["Private browsing", "Not implemented by this module"]
    ];

    for (const [label, value] of items) {
      const row = document.createElement("li");
      row.textContent = `${label}: ${value}`;
      list.append(row);
    }

    container.append(heading, description, message, list);
  }

  window.MaraPrivacy = Object.freeze({
    getStatus,
    render
  });
})();
