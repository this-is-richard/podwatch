// Import the Pod type from types
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { Pod } from "../types";
dayjs.extend(relativeTime);
// Pod Detail Dialog Component
const PodDetailDialog = ({
  pod,
  isOpen,
  onClose,
}: {
  pod: Pod | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen || !pod) return null;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Pod Details: {pod.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <strong>Name:</strong> {pod.name}
              </div>
              <div>
                <strong>Namespace:</strong> {pod.namespace}
              </div>
              <div>
                <strong>Status:</strong> {pod.status}
              </div>
              <div>
                <strong>Ready:</strong> {pod.ready ? "Yes" : "No"}
              </div>
              <div>
                <strong>Restarts:</strong> {pod.restarts}
              </div>
              <div>
                <strong>Age:</strong>{" "}
                {pod.creationTimestamp?.toLocaleString() || "N/A"}
              </div>
              <div>
                <strong>Node:</strong> {pod.node}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Full Pod Object
            </h3>
            <pre className="bg-gray-100 rounded-md p-4 text-xs overflow-auto whitespace-pre-wrap border">
              {JSON.stringify(pod.pod, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PodDetailDialog;
