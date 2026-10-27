
"use strict";

(() => {
  let panel;

  function createPanel() {
    if (panel) return panel;

    panel = document.createElement("section");
    panel.id = "maraAiPanel";
    panel.setAttribute("aria-label", "Mara AI assistant");

    Object.assign(panel.style, {
      position: "fixed",
      top: "116px",
      right: "12px",
      width: "min(340px, calc(100vw - 24px))",
      maxHeight: "65vh",
      overflow: "auto",
      zIndex: "9999",
      padding: "18px",
      border: "1px solid var(--mara-gold, #D9BD83)",
      borderRadius: "14px",
      background: "var(--mara-surface, #10211B)",
      color: "var(--mara-text, #F1F4EF)",
      boxSizing: "border-box",
      boxShadow: "0 12px 40px #0008"
    });

    const heading = document.createElement("h2");
    heading.textContent = "Mara AI";

    const note = document.createElement("p");
    note.textContent =
      "Your AI workspace. Connect an AI provider to enable real answers.";

    const input = document.createElement("textarea");
    input.id = "maraAiPrompt";
    input.placeholder = "Ask Mara something…";
    input.rows = 3;
    input.style.width = "100%";
    input.style.boxSizing = "border-box";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Prepare prompt";

    const output = document.createElement("p");
    output.id = "maraAiOutput";
    output.setAttribute("aria-live", "polite");

    button.addEventListener("click", () => {
      const prompt = input.value.trim();

      output.textContent = prompt
        ? "AI is not connected yet. Your prompt has not been sent anywhere."
        : "Type a question first.";
    });

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    close.addEventListener("click", hide);

    panel.append(heading, note, input, button, output, close);
    document.body.append(panel);
    return panel;
  }

  function show() {
    createPanel().hidden = false;
  }

  function hide() {
    if (panel) panel.hidden = true;
  }

  function toggle() {
    if (!panel || panel.hidden) show();
    else hide();
  }

  window.MaraAI = Object.freeze({ show, hide, toggle });
})();
