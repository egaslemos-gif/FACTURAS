"use client";

import React, { useEffect, useState } from "react";
import { useRuntimeStateMachine } from "@/lib/runtime/runtimeStateMachine";

export default function OperationalRecoveryWorkspace() {
  const state = useRuntimeStateMachine();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const handleAction = async (action: string) => {
    if (action === "EXPORT_DIAGNOSTICS") {
       state.dispatch({ 
         type: "RECOVERY_EXPORT_DIAGNOSTICS", 
         technicalReason: `Diagnostics exported at ${new Date().toISOString()}`,
         operatorReason: "O Administrador exportou o log de diagnóstico do sistema."
       });
       exportDiagnostics();
       return;
    }
    
    // Convert generic action string to the specific recovery event type
    const eventType = `RECOVERY_${action}` as any;
    
    state.dispatch({ 
      type: eventType,
      technicalReason: `Manual operator intervention: ${action}`,
      operatorReason: `O Administrador executou a ação de recuperação: ${action}`
    });
  };

  const exportDiagnostics = () => {
    const payload = JSON.stringify({
      mode: state.mode,
      queue: state.queue,
      ownership: state.ownership,
      hydration: state.hydration,
      techReason: state.technicalReason,
      operatorReason: state.operatorReason,
      timestamp: new Date().toISOString()
    }, null, 2);
    
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `runtime_diagnostics_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-8 font-mono selection:bg-rose-900">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-rose-500">Operational Recovery Workspace</h1>
          <p className="text-slate-500 mt-2">Isolated Runtime Diagnostic Shell</p>
        </header>

        <section className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-inner">
            <h2 className="text-xl text-slate-100 mb-4">State Machine Truths</h2>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span className="text-slate-500">System Mode</span>
                <span className={`font-semibold ${state.mode !== "NORMAL" ? "text-rose-400" : "text-emerald-400"}`}>
                  {state.mode}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Queue Status</span>
                <span className={state.queue === "FROZEN" ? "text-amber-400" : ""}>{state.queue}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Ownership</span>
                <span>{state.ownership}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Hydration</span>
                <span>{state.hydration}</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-inner flex flex-col">
            <h2 className="text-xl text-slate-100 mb-4">Explainability Layer</h2>
            <div className="flex-1 bg-black rounded p-4 overflow-y-auto text-sm text-amber-500 font-mono flex flex-col gap-4">
              {(!state.technicalReason && !state.operatorReason) ? (
                <span>No anomalies detected. Runtime is operating within parameters.</span>
              ) : (
                <>
                  <div>
                    <span className="font-bold text-slate-400">Technical Reason:</span>
                    <p className="mt-1">{state.technicalReason || "N/A"}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400">Operator Reason:</span>
                    <p className="mt-1 text-slate-300">{state.operatorReason || "N/A"}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-inner space-y-4">
          <h2 className="text-xl text-slate-100">Recovery Actions</h2>
          <p className="text-sm text-slate-500">
            These actions dispatch pure semantic events to the State Machine. They do not forcefully mutate the DB.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <button 
              onClick={() => handleAction("CLEAR_LOCKS")}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition border border-slate-700 text-sm font-semibold"
            >
              Force Clear Locks
            </button>
            <button 
              onClick={() => handleAction("REPLAY_QUEUE")}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition border border-slate-700 text-sm font-semibold"
            >
              Replay Pending Queue
            </button>
            <button 
              onClick={() => handleAction("PURGE_STALE_RUNTIME")}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition border border-slate-700 text-sm font-semibold"
            >
              Purge Stale Runtime
            </button>
            <button 
              onClick={() => handleAction("EXPORT_DIAGNOSTICS")}
              className="px-4 py-3 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-200 rounded transition border border-cyan-800 text-sm font-semibold"
            >
              Export Diagnostics
            </button>
            <button 
              onClick={() => handleAction("FORCE_SAFE_MODE")}
              className="px-4 py-3 bg-rose-900/40 hover:bg-rose-800/60 text-rose-200 rounded transition border border-rose-800 text-sm font-semibold"
            >
              Force Safe Mode
            </button>
            <button 
              onClick={() => handleAction("REBUILD_RUNTIME")}
              className="px-4 py-3 bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 rounded transition border border-amber-800 text-sm font-semibold"
            >
              Rebuild Runtime
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
