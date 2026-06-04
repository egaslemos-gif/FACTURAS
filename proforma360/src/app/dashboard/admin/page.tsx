"use client";

import React, { useEffect, useState } from "react";
import { useLicenseStore, License } from "@/stores/licenseStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Check, X, Shield, Search, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function AdminPanelPage() {
  const { isAdmin } = useLicenseStore();
  const { isOffline } = useNetworkStatus();
  
  const [users, setUsers] = useState<License[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, reqsRes] = await Promise.all([
        fetch('/api/admin/licensing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'adminListUsers' })
        }),
        fetch('/api/admin/licensing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'adminListRequests' })
        })
      ]);

      const usersData = await usersRes.json();
      const reqsData = await reqsRes.json();

      if (usersData.users) setUsers(usersData.users);
      if (reqsData.requests) setRequests(reqsData.requests);
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados do painel de administração.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !isOffline) {
      loadAdminData();
    }
  }, [isAdmin, isOffline]);

  const handleUpdateUser = async (userId: string, updates: Partial<License>) => {
    try {
      const res = await fetch('/api/admin/licensing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adminUpdateUser',
          target_user_id: userId,
          updates
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Utilizador atualizado com sucesso.");
        loadAdminData();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  if (isOffline) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Offline</h2>
        <p className="text-slate-500 mt-2">O painel de administração requer ligação à internet.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="w-12 h-12 text-slate-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Acesso Negado</h2>
        <p className="text-slate-500 mt-2">Não tem permissões para aceder a esta página.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.company_name && u.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-page-title flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-600" />
            Administração SaaS
          </h1>
          <p className="text-page-subtitle">
            Gestão de licenças, quotas e pedidos de expansão.
          </p>
        </div>
        <button 
          onClick={loadAdminData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      {/* Pedidos Pendentes */}
      {requests.filter(r => r.status === 'pending').length > 0 && (
        <div className="mb-10">
          <h2 className="text-section-title mb-4">Pedidos de Expansão Pendentes</h2>
          <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-orange-50 border-b border-orange-100">
                  <tr>
                    <th className="px-6 py-3 text-table-header text-orange-800">Empresa / Email</th>
                    <th className="px-6 py-3 text-table-header text-orange-800">Quota Pedida</th>
                    <th className="px-6 py-3 text-table-header text-orange-800">Telefone</th>
                    <th className="px-6 py-3 text-table-header text-orange-800">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100">
                  {requests.filter(r => r.status === 'pending').map((req, i) => (
                    <tr key={i} className="hover:bg-orange-50/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{req.company_name}</div>
                        <div className="text-sm text-slate-500">{req.email}</div>
                        {req.message && <div className="text-xs text-slate-400 mt-1 italic">"{req.message}"</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {req.requested_quota}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{req.phone}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(req.requested_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Gestão de Utilizadores */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-section-title">Licenças Ativas ({filteredUsers.length})</h2>
          <div className="relative max-w-sm w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar utilizador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-table-header">Empresa / Email</th>
                  <th className="px-6 py-3 text-table-header">Plano</th>
                  <th className="px-6 py-3 text-table-header">Uso Mensal</th>
                  <th className="px-6 py-3 text-table-header">Estado</th>
                  <th className="px-6 py-3 text-table-header text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      A carregar licenças...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Nenhum utilizador encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.user_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{user.company_name || 'Sem Empresa'}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5" title="User ID">{user.user_id.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={user.plan}
                          onChange={(e) => handleUpdateUser(user.user_id, { plan: e.target.value })}
                          className="text-sm bg-slate-100 border-transparent rounded-md focus:border-teal-500 focus:ring-0 py-1 pl-2 pr-6"
                        >
                          <option value="free">Free</option>
                          <option value="starter">Starter</option>
                          <option value="pro">Pro</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${user.used_this_month >= user.monthly_limit && !user.unlimited ? 'text-red-600' : 'text-slate-700'}`}>
                            {user.used_this_month} / {user.unlimited ? '∞' : user.monthly_limit}
                          </span>
                          {!user.unlimited && (
                            <button 
                              onClick={() => {
                                const novaQuota = prompt('Introduza o novo limite mensal:', user.monthly_limit.toString());
                                if (novaQuota && !isNaN(parseInt(novaQuota))) {
                                  handleUpdateUser(user.user_id, { monthly_limit: parseInt(novaQuota) });
                                }
                              }}
                              className="text-xs text-teal-600 hover:text-teal-800 underline"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                          <div 
                            className={`h-1.5 rounded-full ${user.used_this_month >= user.monthly_limit && !user.unlimited ? 'bg-red-500' : 'bg-teal-500'}`}
                            style={{ width: `${user.unlimited ? 100 : Math.min(100, (user.used_this_month / user.monthly_limit) * 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleUpdateUser(user.user_id, { is_active: !user.is_active })}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleUpdateUser(user.user_id, { used_this_month: 0 })}
                          className="text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-md transition-colors"
                          title="Resetar uso mensal para zero"
                        >
                          Reset
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
