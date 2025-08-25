import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Import the Pod type from types
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import PodDetailDialog from "./components/PodDetailDialog";
import type { Pod } from "./types";
//@ts-expect-error cannot declare type for asset/resource from webpack
import podwatchLogo from "./icons/podwatch-primary-1024px.png";
dayjs.extend(relativeTime);

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
  const [copySuccess, setCopySuccess] = useState(false);

  // Log search state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredLogs, setFilteredLogs] = useState<string[]>([]);

  // Pod detail dialog state
  const [showPodDetail, setShowPodDetail] = useState(false);
  const [podDetailData, setPodDetailData] = useState<Pod | null>(null);

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

  // Helper function to filter logs based on search term
  const filterLogs = (logs: string[], searchTerm: string): string[] => {
    if (!searchTerm.trim()) {
      return logs;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return logs.filter((log) => log.toLowerCase().includes(lowerSearchTerm));
  };

  // Helper function to highlight search matches in log text
  const highlightSearchMatches = (
    text: string,
    searchTerm: string
  ): React.ReactNode => {
    if (!searchTerm.trim()) {
      return text;
    }

    const lowerText = text.toLowerCase();
    const lowerSearchTerm = searchTerm.toLowerCase();
    const parts = [];
    let lastIndex = 0;
    let matchIndex = lowerText.indexOf(lowerSearchTerm);

    while (matchIndex !== -1) {
      // Add text before the match
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      // Add the highlighted match
      parts.push(
        <span
          key={`${matchIndex}-${searchTerm}`}
          className="bg-yellow-300 text-black font-bold"
        >
          {text.substring(matchIndex, matchIndex + searchTerm.length)}
        </span>
      );

      lastIndex = matchIndex + searchTerm.length;
      matchIndex = lowerText.indexOf(lowerSearchTerm, lastIndex);
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
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

  // Filter logs when search term or logs change
  useEffect(() => {
    const filtered = filterLogs(logs, searchTerm);
    setFilteredLogs(filtered);
  }, [logs, searchTerm]);

  // Auto-scroll logs when new logs arrive
  useEffect(() => {
    if (followLogs && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, followLogs]);

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
    setFilteredLogs([]);
    setLogError("");
    setSearchTerm("");

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
    setFilteredLogs([]);
    setLogError("");
    setSearchTerm("");
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
        currentContext,
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
    setFilteredLogs([]);
    setSearchTerm("");
  };

  // Copy all logs to clipboard
  const copyAllLogs = async () => {
    if (logs.length === 0) return;

    try {
      const allLogsText = logs.join("\n");
      await navigator.clipboard.writeText(allLogsText);
      setCopySuccess(true);

      // Reset success state after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy logs:", error);
    }
  };

  // Handle opening pod detail dialog
  const handleViewPodDetail = (pod: Pod) => {
    setPodDetailData(pod);
    setShowPodDetail(true);
  };

  // Handle closing pod detail dialog
  const handleClosePodDetail = () => {
    setShowPodDetail(false);
    setPodDetailData(null);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-lg">
        Loading...
      </div>
    );

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Left Sidebar - Pod Navigation */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* App Header */}
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <img src={podwatchLogo} alt="PodWatch Logo" className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-br from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                PodWatch
              </h1>
              <p className="text-xs text-gray-500">Kubernetes Pod Monitor</p>
            </div>
          </div>
        </div>

        {/* Context Section */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            Kubernetes Context
          </h2>

          <div className="mb-3">
            <label
              htmlFor="context-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Context:
            </label>
            <select
              id="context-select"
              value={currentContext}
              onChange={(e) => handleSwitchContext(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              {contexts.map((ctx) => (
                <option key={ctx.name} value={ctx.name}>
                  {ctx.name}
                </option>
              ))}
            </select>
          </div>

          {currentContext && (
            <div className="text-xs text-gray-600 bg-white rounded p-2">
              <div className="font-medium text-gray-800 mb-1">Current:</div>
              <div className="truncate">{currentContext}</div>
              {contexts.find((ctx) => ctx.name === currentContext) && (
                <div className="truncate text-gray-500">
                  {contexts.find((ctx) => ctx.name === currentContext)?.cluster}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pod Navigation */}
        {currentContext && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-semibold text-gray-800">Pods</h3>
                <button
                  onClick={() => loadPods(currentContext)}
                  disabled={podsLoading}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {podsLoading ? "..." : "↻"}
                </button>
              </div>

              {/* Namespace Filter */}
              {pods.length > 0 && (
                <div className="mb-2">
                  <label
                    htmlFor="namespace-filter"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Namespace:
                  </label>
                  <select
                    id="namespace-filter"
                    value={selectedNamespace}
                    onChange={(e) => setSelectedNamespace(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="all">All Namespaces</option>
                    {getUniqueNamespaces(pods).map((namespace) => (
                      <option key={namespace} value={namespace}>
                        {namespace}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    {getFilteredPods(pods, selectedNamespace).length} pods
                  </div>
                </div>
              )}
            </div>

            {/* Pod List */}
            <div className="flex-1 overflow-y-auto">
              {podsError && (
                <div className="m-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-600 text-xs">{podsError}</p>
                </div>
              )}

              {podsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500 text-sm">Loading pods...</div>
                </div>
              ) : pods.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {getFilteredPods(pods, selectedNamespace).map((pod) => (
                    <div
                      key={`${pod.namespace}-${pod.name}`}
                      className={`p-3 cursor-pointer transition-colors hover:bg-blue-50 ${
                        selectedPod &&
                        selectedPod.name === pod.name &&
                        selectedPod.namespace === pod.namespace
                          ? "bg-blue-100 border-r-4 border-blue-500"
                          : "bg-white"
                      }`}
                      onClick={() => handlePodSelect(pod)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {pod.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {pod.namespace}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded ${
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
                            <span
                              className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded ${
                                pod.ready
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {pod.ready ? "Ready" : "Not Ready"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Restarts: {pod.restarts} • Age:{" "}
                            {pod.creationTimestamp
                              ? dayjs(pod.creationTimestamp).fromNow()
                              : "N/A"}
                          </div>
                        </div>
                        <div className="ml-2 flex flex-col gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPodDetail(pod);
                            }}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="View pod details"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : getFilteredPods(pods, selectedNamespace).length === 0 &&
                pods.length > 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No pods in "{selectedNamespace}"
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No pods found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area - Log Viewer */}
      <div className="flex-1 flex flex-col">
        {selectedPod ? (
          <div className="flex flex-col h-full">
            {/* Log Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
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
                    onClick={copyAllLogs}
                    disabled={logs.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Copy all logs to clipboard"
                  >
                    {copySuccess ? (
                      <>
                        <Check size={16} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy
                      </>
                    )}
                  </button>
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
                </div>
              </div>

              {/* Search Section */}
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <div className="text-sm text-gray-600 whitespace-nowrap">
                    {filteredLogs.length} of {logs.length} lines
                  </div>
                )}
              </div>
            </div>

            {/* Log Error */}
            {logError && (
              <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                <p className="text-red-600 text-sm">{logError}</p>
              </div>
            )}

            {/* Log Content */}
            <div className="flex-1 bg-black text-green-400 font-mono text-sm overflow-hidden">
              <div
                ref={logContainerRef}
                className="h-full overflow-y-auto p-4"
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
                ) : searchTerm && filteredLogs.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    No logs match your search "{searchTerm}"
                  </div>
                ) : (
                  (searchTerm ? filteredLogs : logs).map((log, index) => (
                    <div
                      key={index}
                      className="whitespace-pre-wrap break-words"
                    >
                      {searchTerm
                        ? highlightSearchMatches(log, searchTerm)
                        : log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Log Footer */}
            <div className="px-6 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>
                  {searchTerm
                    ? `${filteredLogs.length} of ${logs.length} lines (filtered)`
                    : `${logs.length} lines`}{" "}
                  • {isStreaming ? "Streaming" : "Stopped"}
                </span>
                <span>
                  {selectedPod.name} in {selectedPod.namespace}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center text-gray-500">
              <div className="text-lg mb-2">Select a pod to view logs</div>
              <div className="text-sm">
                {currentContext
                  ? "Choose a pod from the navigation menu on the left"
                  : "Select a Kubernetes context first"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pod Detail Dialog */}
      <PodDetailDialog
        pod={podDetailData}
        isOpen={showPodDetail}
        onClose={handleClosePodDetail}
      />
    </div>
  );
};

export default App;
