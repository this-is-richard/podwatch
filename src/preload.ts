// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// src/preload.js
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getContexts: () => ipcRenderer.invoke("get-contexts"),
  switchContext: (contextName: string) =>
    ipcRenderer.invoke("switch-context", contextName),
  getPods: (contextName?: string) =>
    ipcRenderer.invoke("get-pods", contextName),
  streamLogs: (
    podName: string,
    namespace: string,
    callback: (log: string) => void
  ) => {
    // Set up listener for log events
    ipcRenderer.on("log-data", (_, log: string) => callback(log));
    return ipcRenderer.invoke("stream-logs", podName, namespace);
  },
  stopLogStream: () => {
    ipcRenderer.removeAllListeners("log-data");
    return ipcRenderer.invoke("stop-log-stream");
  },
});
