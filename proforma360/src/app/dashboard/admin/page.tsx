"use client";

import React, { useEffect, useState } from 'react';
import { Shield, Activity, Clock, CheckCircle2, XCircle, Zap, ShieldAlert } from 'lucide-react';
import { useRuntimeStateMachine } from '@/lib/runtime/runtimeStateMachine';
import { useGovernance } from '@/lib/auth/permissionGuard';

interface UpgradeRequest {
  id: string;
  userId: string;
  deviceId: string;
  requestedPlan: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface AuditEvent {
  id: string;
  eventType: string;
  adminId: string;
  targetUserId: string;
  details: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const runtime = useRuntimeStateMachine();
  const governance = useGovernance();
  
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/subscriptions");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setAudit(data.audit || []);
      }
    } catch (e) {
      console.error("Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      // In a real app, adminId would come from session context
      const adminId = "admin_super"; 
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_UPGRADE",
          payload: { requestId, adminId }
        })
      });
      if (res.ok) {
        fetchData(); // Refresh UI
      }
    } catch (e) {
      alert("Failed to approve");
    }
  };

  if (governance.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <ShieldAlert className="w-16 h-16 text-red-500/50 mb-4" />
        <h2 className="text-xl font-bold text-slate-200">Acesso Negado</h2>
        <p className="text-sm text-center max-w-md mt-2">
          Este é o Painel de Controlo SaaS. Não tem permissões de Governança para visualizar esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">SaaS Control Plane</h1>
          <p className="text-sm text-slate-400">Governança, Permissões e Auditoria do Proforma360</p>
        </div>
      </div>

      {/* Observability Split: Runtime vs SaaS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Runtime Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-slate-200">Local Runtime Status</h2>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              runtime.mode === "NORMAL" ? "bg-emerald-500/10 text-emerald-400" : 
              runtime.mode === "DEGRADED" ? "bg-amber-500/10 text-amber-400" :
              "bg-red-500/10 text-red-400"
            }`}>
              {runtime.mode}
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-2">Estado operacional do nó atual.</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-slate-950 p-2 rounded">
              <span className="text-slate-500 block text-xs">Queue</span>
              <span className="text-slate-300">{runtime.queue}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded">
              <span className="text-slate-500 block text-xs">Hydration</span>
              <span className="text-slate-300">{runtime.hydration}</span>
            </div>
          </div>
        </div>

        {/* SaaS Governance Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-slate-200">SaaS Authority</h2>
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-500/10 text-indigo-400">
              {governance.plan}
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-2">Governança comercial central.</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-slate-950 p-2 rounded">
              <span className="text-slate-500 block text-xs">Licence State</span>
              <span className="text-slate-300">VALID</span>
            </div>
            <div className="bg-slate-950 p-2 rounded">
              <span className="text-slate-500 block text-xs">Capabilities</span>
              <span className="text-slate-300">Enforced</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upgrade Requests */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Aprovações Pendentes
          </h2>
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 text-sm">A carregar...</div>
            ) : requests.filter(r => r.status === "PENDING").length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">Nenhum pedido pendente.</div>
            ) : (
              <ul className="divide-y divide-slate-800/50">
                {requests.filter(r => r.status === "PENDING").map(req => (
                  <li key={req.id} className="p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center hover:bg-slate-800/20 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">{req.userId}</span>
                        <span className="text-xs text-slate-500">→</span>
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">{req.requestedPlan}</span>
                      </div>
                      {req.reason && <p className="text-sm text-slate-400 mt-1 italic">"{req.reason}"</p>}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprove(req.id)}
                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Aprovar
                      </button>
                      <button className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-md text-sm font-medium transition-colors flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Rejeitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Audit Feed */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-slate-400" />
            Audit Feed Global
          </h2>
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 text-sm">A carregar...</div>
            ) : audit.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">Nenhum evento de auditoria.</div>
            ) : (
              <ul className="divide-y divide-slate-800/50">
                {audit.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(event => (
                  <li key={event.id} className="p-4 flex gap-3 hover:bg-slate-800/20 transition-colors">
                    <div className="mt-0.5">
                      {event.eventType === "ADMIN_PLAN_OVERRIDE" ? (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">
                        <span className="font-medium text-indigo-400">{event.adminId}</span>{' '}
                        {event.details}{' '}
                        <span className="text-slate-500">({event.targetUserId})</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        {new Date(event.timestamp).toLocaleString()} • {event.eventType}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
