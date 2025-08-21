import { useEffect, useState } from "react";

const App = () => {
  const [contexts, setContexts] = useState<
    { name: string; cluster: string; user: string }[]
  >([]);
  const [currentContext, setCurrentContext] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Fetch contexts on mount
  useEffect(() => {
    window.electronAPI.getContexts().then(({ contexts, currentContext }) => {
      setContexts(contexts);
      setCurrentContext(currentContext);
      setLoading(false);
    });
  }, []);

  // Handle context switch
  const handleSwitchContext = (contextName: string) => {
    window.electronAPI.switchContext(contextName).then(({ currentContext }) => {
      setCurrentContext(currentContext);
    });
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
      </div>
    </div>
  );
};

export default App;
