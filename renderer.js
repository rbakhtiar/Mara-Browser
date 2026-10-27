"use strict";

const $ = (id) => document.getElementById(id);

const address = $("address");
const status = $("status");
const tabTitle = $("tab-title");
const aiPanel = $("ai-panel");
const toast = $("toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2800);
}

$("address-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const value = address.value.trim();
  if (!value) return;

  status.textContent = "Loading";
  window.mara.navigate(value);
  address.blur();
});

$("back").addEventListener("click", () => window.mara.back());
$("forward").addEventListener("click", () => window.mara.forward());
$("reload").addEventListener("click", () => window.mara.reload());
$("home").addEventListener("click", () => window.mara.home());

$("ai-toggle").addEventListener("click", () => {
  aiPanel.hidden = !aiPanel.hidden;
  window.mara.updateBounds();
});

$("close-ai").addEventListener("click", () => {
  aiPanel.hidden = true;
  window.mara.updateBounds();
});

$("privacy").addEventListener("click", async () => {
  const info = await window.mara.getPrivacyInfo();

  showToast(
    `AI: ${info.externalAI}. ${info.note}`
  );
});

window.mara.onState((state) => {
  if (state.url && document.activeElement !== address) {
    address.value = state.url;
  }

  tabTitle.textContent = state.title || "New tab";
  status.textContent = state.loading ? "Loading" : "Ready";

  $("back").disabled = !state.canGoBack;
  $("forward").disabled = !state.canGoForward;
});

window.mara.onError((error) => {
  status.textContent = "Navigation error";
  showToast(`Could not load page: ${error.message}`);
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
    event.preventDefault();
    address.focus();
    address.select();
  }

  if (event.key === "Escape" && !aiPanel.hidden) {
    aiPanel.hidden = true;
    window.mara.updateBounds();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r") {
    event.preventDefault();
    window.mara.reload();
  }
});

window.addEventListener("resize", () => {
  window.mara.updateBounds();
});

showToast("Welcome to Mara Browser");
