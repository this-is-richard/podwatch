import type { Context, V1Pod } from "@kubernetes/client-node";

interface Pod {
  name: string;
  namespace: string;
  status: string;
  ready: boolean;
  restarts: number;
  age: number;
  node: string;
  pod: V1Pod;
}

interface ElectronAPI {
  getContexts: () => Promise<{
    contexts: {
      name: string;
      cluster: string;
      user: string;
      context: Context;
    }[];
    currentContext: string;
  }>;
  switchContext: (
    contextName: string
  ) => Promise<{ success: boolean; currentContext: string }>;
  getPods: (contextName?: string) => Promise<{
    success: boolean;
    pods: Pod[];
    error?: string;
  }>;
  streamLogs: (
    podName: string,
    contextName: string,
    namespace: string,
    callback: (log: string) => void
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  stopLogStream: () => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
