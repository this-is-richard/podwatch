interface ElectronAPI {
  getContexts: () => Promise<{
    contexts: { name: string; cluster: string; user: string }[];
    currentContext: string;
  }>;
  switchContext: (
    contextName: string
  ) => Promise<{ success: boolean; currentContext: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
