import { useEffect, useState } from "react";

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

  // Handle context switch
  const handleSwitchContext = (contextName: string) => {
    window.electronAPI.switchContext(contextName).then(({ currentContext }) => {
      setCurrentContext(currentContext);
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

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-lg">
        Loading...
      </div>
    );

  return (
    <div className="p-5 font-sans min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Kubernetes Contexts
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Current Context:{" "}
          <strong className="text-blue-600">{currentContext || "None"}</strong>
        </p>

        <div className="space-y-2">
          {contexts.map((ctx) => (
            <div
              key={ctx.name}
              className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                ctx.name === currentContext
                  ? "bg-blue-50 border-blue-200 shadow-sm"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleSwitchContext(ctx.name)}
            >
              <div className="font-medium text-gray-800">{ctx.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                Cluster: {ctx.cluster} • User: {ctx.user}
              </div>
            </div>
          ))}
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
                      {pods.map((pod, index) => (
                        <tr
                          key={`${pod.namespace}-${pod.name}`}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No pods found in this context
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
