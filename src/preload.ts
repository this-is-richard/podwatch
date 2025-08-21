// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// src/preload.js
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getContexts: () => ipcRenderer.invoke("get-contexts"),
  switchContext: (contextName: string) =>
    ipcRenderer.invoke("switch-context", contextName),
});
