import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaPlay, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function PromotionJobRunner() {
    const { token } = useSelector((state) => state.auth);

    const [branches, setBranches] = useState([]);
    const [selected, setSelected] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0);

    const excludeBranchIds = [1,16,18,19,20,21,22,14,15];

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        const res = await fetch("/api/branchesall", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await res.json();

        let list = Array.isArray(data) ? data : data?.data || [];
        list = list
            .filter((b) => !excludeBranchIds.includes(b.id))
            .sort((a, b) => a.branch_code > b.branch_code ? 1 : -1);

        setBranches(list);
    };

    const toggleBranch = (id) => {
        setSelected((prev) =>
            prev.includes(id)
                ? prev.filter((i) => i !== id)
                : [...prev, id]
        );
    };

    const runJob = async () => {
        if (selected.length === 0) return;

        setIsRunning(true);
        setLogs([]);
        setProgress(0);

        for (let i = 0; i < selected.length; i++) {
            const id = selected[i];

            setLogs((prev) => [...prev, `▶ Running branch ${id}...`]);

            await new Promise((r) => setTimeout(r, 800));

            const success = Math.random() > 0.2;

            setLogs((prev) => [
                ...prev,
                success
                    ? `✔ SUCCESS branch ${id}`
                    : `✖ FAIL branch ${id}`,
            ]);

            setProgress(Math.round(((i + 1) / selected.length) * 100));
        }

        setIsRunning(false);
    };

    return (
        <div className="p-6 bg-gray-900 min-h-screen text-gray-100">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold tracking-wide">
                    🚀 Promotion Job Runner
                </h1>

                <Link to="/promotion_jobs" className="text-sm text-gray-400 hover:text-white">
                    ← Back
                </Link>
            </div>

            <div className="grid grid-cols-12 gap-4 h-[80vh]">

                {/* LEFT PANEL */}
                <div className="col-span-3 bg-gray-800 rounded-xl border border-gray-700 flex flex-col">

                    <div className="p-4 border-b border-gray-700">
                        <h2 className="text-sm font-semibold text-gray-300">
                            Branch Selector
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">

                        {branches.map((b) => (
                            <label
                                key={b.id}
                                className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition
                                    ${selected.includes(b.id)
                                        ? "bg-blue-600 text-white"
                                        : "hover:bg-gray-700"
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.includes(b.id)}
                                    onChange={() => toggleBranch(b.id)}
                                />
                                {b.branch_name}
                            </label>
                        ))}
                    </div>

                    {/* RUN BUTTON */}
                    <div className="p-4 border-t border-gray-700">
                        <button
                            onClick={runJob}
                            disabled={isRunning || selected.length === 0}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                        >
                            <FaPlay />
                            Run Promotion
                        </button>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="col-span-9 bg-black rounded-xl border border-gray-800 flex flex-col">

                    {/* TOP STATUS */}
                    <div className="p-4 border-b border-gray-800 flex justify-between text-sm">
                        <span>
                            Status:{" "}
                            {isRunning ? (
                                <span className="text-yellow-400">Running...</span>
                            ) : (
                                <span className="text-green-400">Idle</span>
                            )}
                        </span>

                        <span>{progress}%</span>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="h-1 bg-gray-800">
                        <div
                            className="h-1 bg-green-500 transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* TERMINAL */}
                    <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">

                        {logs.length === 0 && (
                            <div className="text-gray-500 text-center mt-20">
                                <p className="mb-2">No execution yet</p>
                                <p className="text-xs">
                                    Select branches and click "Run Promotion"
                                </p>
                            </div>
                        )}

                        {logs.map((log, i) => (
                            <div
                                key={i}
                                className={`mb-1 ${
                                    log.includes("SUCCESS")
                                        ? "text-green-400"
                                        : log.includes("FAIL")
                                        ? "text-red-400"
                                        : "text-gray-300"
                                }`}
                            >
                                {log}
                            </div>
                        ))}
                    </div>

                    {/* FOOTER SUMMARY */}
                    {!isRunning && logs.length > 0 && (
                        <div className="p-4 border-t border-gray-800 flex justify-between text-sm">
                            <div className="flex gap-4">
                                <span className="text-green-400 flex items-center gap-1">
                                    <FaCheckCircle />{" "}
                                    {logs.filter(l => l.includes("SUCCESS")).length}
                                </span>

                                <span className="text-red-400 flex items-center gap-1">
                                    <FaTimesCircle />{" "}
                                    {logs.filter(l => l.includes("FAIL")).length}
                                </span>
                            </div>

                            <span className="text-gray-400">
                                Completed
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}