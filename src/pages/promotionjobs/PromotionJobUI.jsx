import { useState } from "react";

const branchesMock = [
  { id: 1, name: "Yangon" },
  { id: 2, name: "Mandalay" },
  { id: 3, name: "Naypyidaw" },
  { id: 4, name: "Bago" },
  { id: 5, name: "Mawlamyine" },
];

export default function PromotionJobUI() {
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [jobs, setJobs] = useState({});
  const [running, setRunning] = useState(false);

  const toggleBranch = (id) => {
    setSelectedBranches((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const runPromotion = () => {
    setRunning(true);

    const initial = {};
    selectedBranches.forEach((id) => {
      initial[id] = { status: "running" };
    });

    setJobs(initial);

    selectedBranches.forEach((id) => {
      setTimeout(() => {
        setJobs((prev) => ({
          ...prev,
          [id]: {
            status: Math.random() > 0.2 ? "success" : "failed",
          },
        }));
      }, 1500 + Math.random() * 3000);
    });

    setSelectedBranches([]);
  };

  const stats = {
    running: Object.values(jobs).filter((j) => j.status === "running").length,
    success: Object.values(jobs).filter((j) => j.status === "success").length,
    failed: Object.values(jobs).filter((j) => j.status === "failed").length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow border flex min-h-[80vh] overflow-hidden">

        {/* LEFT SIDEBAR */}
        <aside className="w-72 border-r bg-slate-50/50 p-5 flex flex-col">
          <h2 className="text-sm font-bold text-slate-600 mb-3">
            Branches
          </h2>

          {/* SUMMARY (moved here) */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-blue-600 font-bold">{stats.running}</div>
              <div className="text-gray-400">Running</div>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-green-600 font-bold">{stats.success}</div>
              <div className="text-gray-400">Done</div>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-red-600 font-bold">{stats.failed}</div>
              <div className="text-gray-400">Failed</div>
            </div>
          </div>

          {/* BRANCH LIST */}
          <div className="space-y-2 overflow-y-auto">
            {branchesMock.map((b) => {
              const job = jobs[b.id];

              return (
                <label
                  key={b.id}
                  className="flex justify-between items-center text-sm cursor-pointer hover:text-blue-600"
                >
                  <div className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={selectedBranches.includes(b.id)}
                      onChange={() => toggleBranch(b.id)}
                      disabled={job?.status === "running"}
                    />
                    {b.name}
                  </div>

                  {job && (
                    <span>
                      {job.status === "running" && "🔄"}
                      {job.status === "success" && "✔"}
                      {job.status === "failed" && "❌"}
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          {/* RUN BUTTON */}
          <button
            onClick={runPromotion}
            disabled={running || selectedBranches.length === 0}
            className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {running ? "Running..." : "Run Promotion"}
          </button>
        </aside>

        {/* RIGHT PANEL */}
        <main className="flex-1 p-6 flex flex-col">

          {/* EMPTY STATE (STRONG DESIGN) */}
          {!running && Object.keys(jobs).length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">

              {/* Icon */}
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-5xl">
                  🚀
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-blue-100 animate-ping"></div>
              </div>

              {/* Text */}
              <h2 className="text-lg font-semibold text-slate-800">
                Ready to Run Promotion
              </h2>

              <p className="text-sm text-gray-400 mt-2 max-w-sm">
                Select branches from the left panel and start promotion.
                Progress will appear here in real-time.
              </p>

              {/* Selected Preview */}
              {selectedBranches.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {selectedBranches.map((id) => {
                    const b = branchesMock.find((x) => x.id === id);
                    return (
                      <span
                        key={id}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {b.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ACTIVITY FEED */}
          <div className="space-y-3 overflow-y-auto">
            {Object.keys(jobs).map((id) => {
              const branch = branchesMock.find((b) => b.id == id);
              const job = jobs[id];

              return (
                <div
                  key={id}
                  className="flex justify-between items-center p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition"
                >
                  <div>
                    <div className="font-medium">{branch.name}</div>
                    <div className="text-xs text-gray-400">
                      {job.status === "running" && "Processing promotion..."}
                      {job.status === "success" && "Completed successfully"}
                      {job.status === "failed" && "Failed during execution"}
                    </div>
                  </div>

                  <div className="text-sm font-medium">
                    {job.status === "running" && (
                      <span className="text-blue-600 flex items-center gap-1">
                        <span className="animate-spin">🔄</span> Running
                      </span>
                    )}
                    {job.status === "success" && (
                      <span className="text-green-600">✔ Success</span>
                    )}
                    {job.status === "failed" && (
                      <span className="text-red-600">❌ Failed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </main>
      </div>
    </div>
  );
}