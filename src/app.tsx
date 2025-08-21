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

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Kubernetes Contexts</h2>
      <p>
        Current Context: <strong>{currentContext || "None"}</strong>
      </p>

      <ul style={{ marginTop: "20px" }}>
        {contexts.map((ctx) => (
          <li
            key={ctx.name}
            style={{
              padding: "10px",
              background: ctx.name === currentContext ? "#e0f7fa" : "none",
              cursor: "pointer",
            }}
            onClick={() => handleSwitchContext(ctx.name)}
          >
            {ctx.name} (Cluster: {ctx.cluster}, User: {ctx.user})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
