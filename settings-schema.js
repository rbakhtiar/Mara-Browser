
"use strict";

(() => {
  const groups = {
    "Appearance": [
      "Show decorative brand mark", "Show browser edition label",
      "Use compact toolbar", "Use rounded controls", "Enable subtle animations",
      "Use glass-style panels", "Show gold accents", "Use reduced shadows",
      "Show tab separators", "Use dense layout"
    ],
    "Typography": [
      "Use Alegreya headings", "Use serif page labels", "Increase interface text",
      "Reduce interface text", "Use bold headings", "Use larger tab labels",
      "Use compact status text", "Increase line spacing", "Use high-legibility text",
      "Use monospaced address text"
    ],
    "Tabs": [
      "Show tab close buttons", "Show private tab marker", "Show new-tab button",
      "Use compact tabs", "Use wide tabs", "Show tab borders",
      "Show active-tab highlight", "Keep tab labels on one line",
      "Show tab loading indicator", "Confirm closing multiple tabs"
    ],
    "Toolbar": [
      "Show back button", "Show forward button", "Show reload button",
      "Show home button", "Show bookmark button", "Show history button",
      "Show privacy button", "Show address security marker",
      "Show address Go button", "Show Customize button"
    ],
    "Address Bar": [
      "Show address suggestions", "Select address on focus",
      "Show HTTPS indicator", "Show search engine indicator",
      "Keep typed address while editing", "Show Go button",
      "Use compact address field", "Show address clear control",
      "Show copy-address action", "Confirm external navigation"
    ],
    "Search": [
      "Use DuckDuckGo", "Use Google", "Use Bing",
      "Search on Enter", "Open search in current tab",
      "Open search in new tab", "Show search suggestions",
      "Use encoded search queries", "Remember last search engine",
      "Show search engine in new-tab page"
    ],
    "Privacy": [
      "Deny site permissions by default", "Show private-tab marker",
      "Show privacy status", "Warn before clearing history",
      "Warn before clearing bookmarks", "Hide private visits from local history",
      "Clear private session on close", "Show permission status",
      "Show tracker-blocking status", "Show privacy information panel"
    ],
    "Bookmarks": [
      "Show bookmarks button", "Show bookmark titles", "Show bookmark URLs",
      "Sort bookmarks alphabetically", "Sort bookmarks by date",
      "Show bookmark timestamps", "Confirm bookmark deletion",
      "Show bookmark count", "Show empty bookmark message",
      "Use compact bookmark rows"
    ],
    "History": [
      "Show history button", "Show visit timestamps", "Show visited URLs",
      "Sort history newest first", "Confirm clearing history",
      "Hide private visits", "Show history count", "Use compact history rows",
      "Show empty history message", "Group history by date"
    ],
    "New Tab": [
      "Show Mara wordmark", "Show search field", "Show quick links",
      "Show bookmarks on new tab", "Show welcome text", "Use centered layout",
      "Show settings link", "Show privacy link", "Show recent sites",
      "Use minimal new-tab layout"
    ],
    "Accessibility": [
      "Use visible focus rings", "Reduce motion", "Increase contrast",
      "Use larger controls", "Use larger text", "Use keyboard navigation",
      "Show button tooltips", "Use descriptive control labels",
      "Keep focus visible", "Use clear status messages"
    ],
    "Startup": [
      "Open a new tab on startup", "Restore previous tabs",
      "Show startup status", "Open Customize at startup",
      "Open bookmarks at startup", "Open history at startup",
      "Open privacy information at startup", "Start with compact layout",
      "Show welcome message", "Confirm before closing browser"
    ],
    "Downloads": [
      "Show download status", "Confirm download location",
      "Show completed downloads", "Show failed downloads",
      "Show download progress", "Confirm duplicate filenames",
      "Show download notifications", "Open downloads in system handler",
      "Show download timestamps", "Use compact download rows"
    ],
    "Content": [
      "Show page title", "Show page loading state", "Show navigation errors",
      "Show external-link warning", "Use smooth scrolling where supported",
      "Keep website zoom per site", "Show page URL in tab tooltip",
      "Show page loading indicator", "Use default website zoom",
      "Show connection state"
    ],
    "Performance": [
      "Use compact interface rendering", "Reduce decorative effects",
      "Reduce panel shadows", "Reduce animation work",
      "Avoid unnecessary status refreshes", "Use lightweight tab labels",
      "Use compact bookmark rendering", "Use compact history rendering",
      "Reduce layout transitions", "Prefer simple backgrounds"
    ],
    "Notifications": [
      "Show navigation errors", "Show bookmark confirmations",
      "Show history confirmations", "Show private-tab notifications",
      "Show settings save status", "Show download status",
      "Show permission status", "Show connection status",
      "Show build version", "Show startup status"
    ],
    "Keyboard": [
      "Enable Ctrl+L", "Enable Ctrl+T", "Enable Ctrl+W",
      "Enable Ctrl+I private tab", "Enable Ctrl+R", "Enable Ctrl+D",
      "Enable Ctrl+Shift+N private tab", "Enable Alt+Left",
      "Enable Alt+Right", "Enable Ctrl+Shift+T"
    ],
    "Security": [
      "Block website permission requests", "Restrict navigation schemes",
      "Disable Node integration for websites", "Enable context isolation",
      "Use sandboxed web contents", "Block unapproved popup windows",
      "Open external links through system handler", "Show HTTPS status",
      "Reject unsupported URL schemes", "Show security information"
    ],
    "Customization": [
      "Show theme picker", "Show accent color picker", "Show font-size control",
      "Show density control", "Show layout controls", "Show preference search",
      "Show category filters", "Show experimental settings",
      "Show reset button", "Show customization count"
    ],
    "Advanced": [
      "Show diagnostic status", "Show Electron version",
      "Show Chromium engine information", "Show session type",
      "Show current tab identifier", "Show browser build information",
      "Show storage status", "Show profile information",
      "Show shortcut registry", "Show advanced warning"
    ]
  };

  const implemented = new Set([
    "Use compact toolbar",
    "Enable subtle animations",
    "Use reduced shadows",
    "Use larger interface text",
    "Use compact tabs",
    "Show tab close buttons",
    "Show private tab marker",
    "Show new-tab button",
    "Show back button",
    "Show forward button",
    "Show reload button",
    "Show home button",
    "Show bookmark button",
    "Show history button",
    "Show privacy button",
    "Show address security marker",
    "Show Customize button",
    "Show privacy status",
    "Hide private visits from local history",
    "Use DuckDuckGo",
    "Use Google",
    "Use Bing",
    "Use visible focus rings",
    "Reduce motion",
    "Show page loading state"
  ]);

  const settings = [];
  let index = 0;

  for (const [category, labels] of Object.entries(groups)) {
    for (const label of labels) {
      settings.push({
        id: `pref_${String(++index).padStart(3, "0")}`,
        category,
        label,
        implemented: implemented.has(label),
        defaultValue: true
      });
    }
  }

  // Keep exactly 200 distinct settings in the registry.
  if (settings.length !== 200) {
    throw new Error(`Mara settings schema expected 200 entries, got ${settings.length}`);
  }

  window.MaraSettingsSchema = Object.freeze({
    settings: Object.freeze(settings),
    count: settings.length
  });
})();
