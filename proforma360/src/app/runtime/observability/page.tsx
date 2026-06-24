"use client";

import React, { useEffect, useState } from "react";
import { useRuntimeStateMachine } from "@/lib/runtime/runtimeStateMachine";
import { runtimeEventLedger, LedgerEntry, GovernanceMetrics } from "@/lib/runtime/runtimeEventLedger";
import { chaosHarness } from "@/lib/runtime/chaos/chaosHarness";
import { browserLifecycle } from "@/lib/runtime/browserLifecycle";
import { getActiveTenantHash } from "@/lib/runtime/runtimeNamespace";

export default function ObservabilityDashboard() {
  const state = useRuntimeStateMachine();
  const [mounted, setMounted] = useState(false);
  const [ledgerHistory, setLedgerHistory] = useState<LedgerEntry[]>([]);
  const [chaosMode, setChaosMode] = useState<boolean>(false);
  const [govMetrics, setGovMetrics] = useState<GovernanceMetrics | null>(null);
  const [visibility, setVisibility] = useState(browserLifecycle.getState());

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const isChaos = urlParams.get('chaos') === 'true';
      const debugRuntimeToken = urlParams.get('token') || undefined;

      // In production, isChaos is not enough. The token is verified by the Harness.
      if (isChaos || debugRuntimeToken) {
        const severityStr = urlParams.get('severity') || 'SAFE';
        chaosHarness.initialize({
          enabled: true,
          severity: severityStr as any,
          chaosSeed: urlParams.get('seed') || 'dash-seed-1',
          debugRuntimeToken
        });
        
        // Update state based on whether the harness ACTUALLY enabled it
        setChaosMode(chaosHarness.isEnabled());
      }
    }

    const fetchData = async () => {
      const history = await runtimeEventLedger.getHistory(100);
      setLedgerHistory(history);
      setGovMetrics(runtimeEventLedger.getMetrics());
      setVisibility(browserLifecycle.getState());
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-slate-300 p-8 font-mono selection:bg-cyan-900">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-cyan-500">Runtime Observability</h1>
            <p className="text-slate-500 mt-2">Distributed Resilience & Introspection</p>
          </div>
          {chaosMode && (
            <div className="px-4 py-1 border border-rose-800 bg-rose-900/30 text-rose-500 rounded text-sm font-bold animate-pulse">
              CHAOS HARNESS ACTIVE
            </div>
          )}
        </header>

        <section className="grid grid-cols-5 gap-4">
          <MetricCard title="System Mode" value={state.mode} highlight={state.mode !== "NORMAL"} />
          <MetricCard title="Ownership" value={state.ownership} highlight={state.ownership === "REVOKED"} />
          <MetricCard title="Auth/Hydration" value={`${state.auth} / ${state.hydration}`} highlight={state.hydration === "STALE"} />
          <MetricCard title="Queue Status" value={state.queue} highlight={state.queue === "FROZEN"} />
          <MetricCard title="Lifecycle" value={visibility} highlight={visibility === "STALE"} />
        </section>

        <section className="grid grid-cols-2 gap-8">
          {/* Governance Metrics */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-inner">
            <h2 className="text-xl text-slate-100 mb-4 border-b border-slate-800 pb-2">Governance Protection Metrics</h2>
            {govMetrics ? (
               <ul className="space-y-3">
                 <MetricRow label="Ownership Revocations" value={govMetrics.ownershipRevocations} />
                 <MetricRow label="Split-Brain Preventions" value={govMetrics.splitBrainPreventions} />
                 <MetricRow label="Stale Epoch Rejections" value={govMetrics.staleEpochRejections} />
                 <MetricRow label="Fencing Violations" value={govMetrics.fencingViolations} />
                 <MetricRow label="Reload Storm Preventions" value={govMetrics.reloadStormPreventions} />
                 <MetricRow label="Hydration Blocks" value={govMetrics.hydrationBlocks} />
               </ul>
            ) : <p className="text-slate-600">Loading metrics...</p>}
          </div>

          {/* Deep Internals */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-inner">
            <h2 className="text-xl text-slate-100 mb-4 border-b border-slate-800 pb-2">Runtime Invariants State</h2>
            <ul className="space-y-3">
              <MetricRow label="Active Namespace Hash" value={getActiveTenantHash() || "null"} />
              <MetricRow label="Local Epoch" value={typeof window !== 'undefined' ? localStorage.getItem('runtime_active_epoch') || "0" : "0"} />
              <MetricRow label="Force Reload Count" value={typeof window !== 'undefined' ? localStorage.getItem('runtime_reload_count') || "0" : "0"} />
              <MetricRow label="Ledger Size" value={ledgerHistory.length.toString()} />
            </ul>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-inner flex flex-col h-[500px]">
          <h2 className="text-xl text-slate-100 mb-4 border-b border-slate-800 pb-2">
            Temporal Correlation Feed (The Black Box)
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-4 custom-scrollbar">
            {ledgerHistory.length === 0 ? (
              <div className="text-slate-600 text-center py-10">No governance events recorded yet.</div>
            ) : (
              ledgerHistory.map((entry) => (
                <div key={entry.id} className="p-3 border-l-2 border-cyan-700 bg-slate-950/50 rounded-r text-sm">
                  <div className="flex justify-between text-cyan-600 mb-1">
                    <span className="font-bold">{entry.eventType}</span>
                    <span className="text-slate-500">{new Date(entry.timestamp).toISOString().split('T')[1]}</span>
                  </div>
                  
                  {entry.payload.failure && (
                    <div className="text-rose-400 mb-2">
                      <span className="font-semibold">{entry.payload.failure}</span>
                      <p className="text-slate-400 text-xs mt-1">Tech: {entry.payload.technicalReason}</p>
                      <p className="text-slate-400 text-xs">Ops: {entry.payload.operatorReason}</p>
                    </div>
                  )}

                  {entry.previousMode !== entry.nextMode && (
                    <div className="text-amber-500 text-xs mt-2 border-t border-slate-800 pt-1">
                      Transition: {entry.previousMode} ➔ {entry.nextMode}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ title, value, highlight }: { title: string, value: string, highlight: boolean }) {
  return (
    <div className={`bg-slate-900 border p-4 rounded-lg shadow-inner ${highlight ? 'border-rose-800 bg-rose-950/20' : 'border-slate-800'}`}>
      <h3 className="text-slate-500 text-sm mb-1 truncate">{title}</h3>
      <div className={`text-lg font-bold truncate ${highlight ? 'text-rose-400' : 'text-slate-100'}`}>
        {value}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string, value: string | number }) {
  return (
    <li className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-100 font-bold max-w-[50%] truncate">{value}</span>
    </li>
  );
}
