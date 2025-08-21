interface Pod {
  name: string;
  namespace: string;
  status: string;
  ready: boolean;
  restarts: number;
  age: number;
  node: string;
}

interface ElectronAPI {
  getContexts: () => Promise<{
    contexts: { name: string; cluster: string; user: string }[];
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
