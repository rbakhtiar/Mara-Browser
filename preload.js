
"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("maraBridge", Object.freeze({
  navigate: (id, url) => ipcRenderer.invoke("mara:navigate", id, url),
  newTab: options => ipcRenderer.invoke("mara:new-tab", options || {}),
  activateTab: id => ipcRenderer.invoke("mara:activate-tab", id),
  closeTab: id => ipcRenderer.invoke("mara:close-tab", id),
  back: () => ipcRenderer.invoke("mara:back"),
  forward: () => ipcRenderer.invoke("mara:forward"),
  reload: () => ipcRenderer.invoke("mara:reload"),
  getPrivacyInfo: () => ipcRenderer.invoke("mara:privacy-info"),
  openExternal: url => ipcRenderer.invoke("mara:open-external", url),

  onTabs: callback => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on("mara:tabs", listener);
    return () => ipcRenderer.removeListener("mara:tabs", listener);
  },

  onError: callback => {
    const listener = (_event, message) => callback(message);
    ipcRenderer.on("mara:error", listener);
    return () => ipcRenderer.removeListener("mara:error", listener);
  },

  onFocusAddress: callback => {
    const listener = () => callback();
    ipcRenderer.on("mara:focus-address", listener);
    return () => ipcRenderer.removeListener("mara:focus-address", listener);
  },

  onBookmarkCurrent: callback => {
    const listener = () => callback();
    ipcRenderer.on("mara:bookmark-current", listener);
    return () => ipcRenderer.removeListener("mara:bookmark-current", listener);
  }
}));
