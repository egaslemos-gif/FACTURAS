"use client";

import { useRuntimeStateMachine } from "@/lib/runtime/runtimeStateMachine";
import { useRuntimeCapability } from "@/lib/runtime/runtimeCapability";
import { ENABLE_RUNTIME_GOVERNANCE } from "@/lib/db/userScopedDb";
import { safeRender } from "@/lib/utils/safeRender";

/**
 * Operational Runtime Inspector
 * A strictly read-only, lazy-loaded observability panel.
 * Never consumes locks, never dispatches state mutations.
 */
export default function OperationalInspector() {
  const { auth, network, queue, hydration, ownership } = useRuntimeStateMachine();
  const { level } = useRuntimeCapability();

  if (!ENABLE_RUNTIME_GOVERNANCE) {
    return null;
  }

  if (process.env.NODE_ENV === "production") {
    // Feature gate this strictly to internal admin roles in real scenarios
    // return null; 
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-slate-900/95 backdrop-blur border border-slate-700 text-slate-200 text-xs rounded-lg shadow-2xl p-4 font-mono">
      <h3 className="font-bold text-slate-100 mb-2 border-b border-slate-700 pb-1 flex justify-between">
        <span>Runtime Inspector</span>
        <span className="text-emerald-400">? LIVE</span>
      </h3>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="text-slate-400">Ownership:</div>
        <div className={`font-semibold ${ownership === "LOCKED" ? "text-emerald-400" : "text-amber-400"}`}>
          {safeRender(ownership)}
        </div>
        
        <div className="text-slate-400">Auth:</div>
        <div className="font-semibold">{safeRender(auth)}</div>

        <div className="text-slate-400">Hydration:</div>
        <div className={`font-semibold ${hydration === "ACTIVE" ? "text-emerald-400" : "text-rose-400"}`}>
          {safeRender(hydration)}
        </div>

        <div className="text-slate-400">Network:</div>
        <div className="font-semibold">{safeRender(network)}</div>

        <div className="text-slate-400">Queue:</div>
        <div className="font-semibold">{safeRender(queue)}</div>
      </div>

      <h3 className="font-bold text-slate-100 mt-4 mb-2 border-b border-slate-700 pb-1">Capabilities</h3>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="text-slate-400">Level:</div>
        <div className={`font-semibold ${level === "FULL_RUNTIME" ? "text-emerald-400" : "text-amber-400"}`}>
          {safeRender(level)}
        </div>
      </div>
    </div>
  );
}
