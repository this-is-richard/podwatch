import { useEffect, useRef, useState } from "react";

// Import the Pod type
type Pod = {
  name: string;
  namespace: string;
  status: string;
  ready: boolean;
  restarts: number;
  age: number;
  node: string;
};

const App = () => {
  const [contexts, setContexts] = useState<
    { name: string; cluster: string; user: string }[]
  >([]);
  const [currentContext, setCurrentContext] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [pods, setPods] = useState<Pod[]>([]);
  const [podsLoading, setPodsLoading] = useState(false);
  const [podsError, setPodsError] = useState<string>("");
  const [selectedNamespace, setSelectedNamespace] = useState<string>("default");

  // Log streaming state
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [logError, setLogError] = useState<string>("");
  const [followLogs, setFollowLogs] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Helper function to get unique namespaces from pods
  const getUniqueNamespaces = (pods: Pod[]): string[] => {
    const namespaces = Array.from(new Set(pods.map((pod) => pod.namespace)));
    return namespaces.sort();
  };

  // Helper function to filter pods by namespace
  const getFilteredPods = (pods: Pod[], selectedNamespace: string): Pod[] => {
    if (selectedNamespace === "all") {
      return pods;
    }
    return pods.filter((pod) => pod.namespace === selectedNamespace);
  };

  // Helper function to get the effective selected namespace
  const getEffectiveNamespace = (
    pods: Pod[],
    selectedNamespace: string
  ): string => {
    const availableNamespaces = getUniqueNamespaces(pods);
    // If selected namespace exists in available namespaces, use it
    if (availableNamespaces.includes(selectedNamespace)) {
      return selectedNamespace;
    }
    // If "default" exists, use it, otherwise fall back to "all"
    return availableNamespaces.includes("default") ? "default" : "all";
  };

  // Fetch contexts on mount
  useEffect(() => {
    window.electronAPI.getContexts().then(({ contexts, currentContext }) => {
      setContexts(contexts);
      setCurrentContext(currentContext);
      setLoading(false);

      // Load pods for current context if one exists
      if (currentContext) {
        loadPods(currentContext);
      }
    });
  }, []);

  // Auto-adjust selected namespace when pods change
  useEffect(() => {
    if (pods.length > 0) {
      const effectiveNamespace = getEffectiveNamespace(pods, selectedNamespace);
      if (effectiveNamespace !== selectedNamespace) {
        setSelectedNamespace(effectiveNamespace);
      }
    }
  }, [pods, selectedNamespace]);

  // Auto-scroll logs when new logs arrive
  useEffect(() => {
    if (followLogs && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, followLogs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreaming) {
        stopLogStreaming();
      }
    };
  }, []);

  // Handle context switch
  const handleSwitchContext = (contextName: string) => {
    // Stop any active log streaming
    if (isStreaming) {
      stopLogStreaming();
    }
    // Reset pod selection
    setSelectedPod(null);
    setLogs([]);
    setLogError("");

    window.electronAPI.switchContext(contextName).then(({ currentContext }) => {
      setCurrentContext(currentContext);
      setSelectedNamespace("default"); // Reset namespace filter when switching contexts
      loadPods(contextName);
    });
  };

  // Load pods for a context
  const loadPods = async (contextName: string) => {
    setPodsLoading(true);
    setPodsError("");
    try {
      const result = await window.electronAPI.getPods(contextName);
      if (result.success) {
        setPods(result.pods);
      } else {
        setPodsError(result.error || "Failed to load pods");
        setPods([]);
      }
    } catch (error) {
      setPodsError("Failed to load pods");
      setPods([]);
    } finally {
      setPodsLoading(false);
    }
  };

  // Handle pod selection
  const handlePodSelect = (pod: Pod) => {
    setSelectedPod(pod);
    setLogs([]);
    setLogError("");
    startLogStreaming(pod);
  };

  // Start log streaming
  const startLogStreaming = async (pod: Pod) => {
    if (isStreaming) {
      await stopLogStreaming();
    }

    setIsStreaming(true);
    setLogError("");
    setLogs([]);

    try {
      const result = await window.electronAPI.streamLogs(
        pod.name,
        pod.namespace,
        (logLine: string) => {
          setLogs((prev) => {
            const newLogs = [...prev, logLine];
            // Keep only last 1000 log lines to prevent memory issues
            return newLogs.slice(-1000);
          });
        }
      );

      if (!result.success) {
        setLogError(result.error || "Failed to start log streaming");
        setIsStreaming(false);
      }
    } catch (error) {
      setLogError("Failed to start log streaming");
      setIsStreaming(false);
    }
  };

  // Stop log streaming
  const stopLogStreaming = async () => {
    try {
      await window.electronAPI.stopLogStream();
      setIsStreaming(false);
    } catch (error) {
      console.error("Error stopping log stream:", error);
    }
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-lg">
        Loading...
      </div>
    );

  return (
    <div className="p-5 font-sans min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Kubernetes Context
          </h2>

          <div className="flex items-center gap-4 mb-4">
            <label
              htmlFor="context-select"
              className="text-sm font-medium text-gray-700 whitespace-nowrap"
            >
              Select Context:
            </label>
            <select
              id="context-select"
              value={currentContext}
              onChange={(e) => handleSwitchContext(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {contexts.map((ctx) => (
                <option key={ctx.name} value={ctx.name}>
                  {ctx.name} ({ctx.cluster})
                </option>
              ))}
            </select>
          </div>

          {currentContext && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
              <div className="font-medium text-gray-800 mb-1">
                Current Context Details:
              </div>
              <div>
                <strong>Name:</strong> {currentContext}
              </div>
              {contexts.find((ctx) => ctx.name === currentContext) && (
                <>
                  <div>
                    <strong>Cluster:</strong>{" "}
                    {
                      contexts.find((ctx) => ctx.name === currentContext)
                        ?.cluster
                    }
                  </div>
                  <div>
                    <strong>User:</strong>{" "}
                    {contexts.find((ctx) => ctx.name === currentContext)?.user}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Pods Section */}
        {currentContext && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Pods in {currentContext}
              </h3>
              <button
                onClick={() => loadPods(currentContext)}
                disabled={podsLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {podsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {/* Namespace Filter */}
            {pods.length > 0 && (
              <div className="mb-4 flex items-center gap-3">
                <label
                  htmlFor="namespace-filter"
                  className="text-sm font-medium text-gray-700"
                >
                  Filter by Namespace:
                </label>
                <select
                  id="namespace-filter"
                  value={selectedNamespace}
                  onChange={(e) => setSelectedNamespace(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[200px]"
                >
                  <option value="all">All Namespaces</option>
                  {getUniqueNamespaces(pods).map((namespace) => (
                    <option key={namespace} value={namespace}>
                      {namespace}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">
                  ({getFilteredPods(pods, selectedNamespace).length} pods)
                </span>
              </div>
            )}

            {podsError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{podsError}</p>
              </div>
            )}

            {podsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading pods...</div>
              </div>
            ) : pods.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Namespace
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ready
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Restarts
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Age (days)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Node
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredPods(pods, selectedNamespace).map(
                        (pod, index) => (
                          <tr
                            key={`${pod.namespace}-${pod.name}`}
                            className={`cursor-pointer transition-colors hover:bg-blue-50 ${
                              selectedPod &&
                              selectedPod.name === pod.name &&
                              selectedPod.namespace === pod.namespace
                                ? "bg-blue-100 border-l-4 border-blue-500"
                                : index % 2 === 0
                                  ? "bg-white"
                                  : "bg-gray-50"
                            }`}
                            onClick={() => handlePodSelect(pod)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {pod.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {pod.namespace}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  pod.status === "Running"
                                    ? "bg-green-100 text-green-800"
                                    : pod.status === "Pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : pod.status === "Failed"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {pod.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  pod.ready
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {pod.ready ? "Ready" : "Not Ready"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {pod.restarts}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {pod.age}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {pod.node}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : getFilteredPods(pods, selectedNamespace).length === 0 &&
              pods.length > 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pods found in namespace "{selectedNamespace}"
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No pods found in this context
              </div>
            )}
          </div>
        )}

        {/* Log Viewer Section */}
        {selectedPod && (
          <div className="mt-8">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Log Header */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Logs for {selectedPod.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Namespace: {selectedPod.namespace} • Status:{" "}
                      {selectedPod.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="follow-logs"
                        checked={followLogs}
                        onChange={(e) => setFollowLogs(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="follow-logs"
                        className="text-sm text-gray-700"
                      >
                        Follow
                      </label>
                    </div>
                    <button
                      onClick={clearLogs}
                      className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Clear
                    </button>
                    <button
                      onClick={
                        isStreaming
                          ? stopLogStreaming
                          : () => startLogStreaming(selectedPod)
                      }
                      className={`px-3 py-1.5 text-sm rounded ${
                        isStreaming
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {isStreaming ? "Stop" : "Start"}
                    </button>
                    <button
                      onClick={() => setSelectedPod(null)}
                      className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>

              {/* Log Error */}
              {logError && (
                <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                  <p className="text-red-600 text-sm">{logError}</p>
                </div>
              )}

              {/* Log Content */}
              <div
                ref={logContainerRef}
                className="h-96 overflow-y-auto bg-black text-green-400 font-mono text-sm p-4"
                style={{
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                }}
              >
                {logs.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    {isStreaming
                      ? "Waiting for logs..."
                      : "No logs available. Click Start to begin streaming."}
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className="whitespace-pre-wrap break-words"
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>

              {/* Log Footer */}
              <div className="px-6 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>
                    {logs.length} lines •{" "}
                    {isStreaming ? "Streaming" : "Stopped"}
                  </span>
                  <span>
                    {selectedPod.name} in {selectedPod.namespace}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
