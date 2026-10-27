"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mara", {
  navigate: (address) =>
    ipcRenderer.invoke("browser:navigate", address),

  back: () => ipcRenderer.invoke("browser:back"),
  forward: () => ipcRenderer.invoke("browser:forward"),
  reload: () => ipcRenderer.invoke("browser:reload"),
  home: () => ipcRenderer.invoke("browser:home"),
  updateBounds: () => ipcRenderer.invoke("browser:bounds"),
  getPrivacyInfo: () => ipcRenderer.invoke("browser:privacy"),

  onState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("browser:state", listener);

    return () => {
      ipcRenderer.removeListener("browser:state", listener);
    };
  },

  onError: (callback) => {
    const listener = (_event, error) => callback(error);
    ipcRenderer.on("browser:error", listener);

    return () => {
      ipcRenderer.removeListener("browser:error", listener);
    };
  }
});
