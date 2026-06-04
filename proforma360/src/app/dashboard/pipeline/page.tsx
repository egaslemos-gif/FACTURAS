"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuotationsStore, usePipelineStore, useInteractionsStore, useCompanyStore } from "@/stores";
import { Quotation, PipelineStage, PIPELINE_STAGES } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { requestNotificationPermission } from "@/lib/pipeline/notifications";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GripVertical,
  ChevronRight,
  Target,
  CalendarDays,
  X,
  Check,
  MoreVertical,
  Edit2,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ListTodo
} from "lucide-react";

// --- Helpers ---
function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function isTodayOrPast(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.getTime() <= today.getTime();
}

function getDaysUntil(dateStr: string | null): number {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  const now = new Date();
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function AgingBadge({ age }: { age: number }) {
  if (age <= 3) return null;
  if (age <= 7)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm font-medium border border-amber-100">
        <Clock className="w-2.5 h-2.5" /> Parado {age}d
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded-sm font-medium border border-red-100">
      <AlertTriangle className="w-2.5 h-2.5 animate-pulse" /> Esquecido {age}d
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: "low" | "medium" | "high" }) {
  if (priority === "high") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-red-700 font-bold uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded-sm border border-red-100">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Alta
      </span>
    );
  }
  return null;
}

// --- Kanban Card ---
function KanbanCard({
  deal,
  companyName,
  onDragStart,
  onSetNextAction,
  onSetPriority,
  onSetStage,
  onCompleteAction,
  onLogWhatsApp
}: {
  deal: Quotation;
  companyName: string;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onSetNextAction: (deal: Quotation) => void;
  onSetPriority: (id: string, priority: "low" | "medium" | "high") => void;
  onSetStage: (deal: Quotation) => void;
  onCompleteAction: (deal: Quotation) => void;
  onLogWhatsApp: (deal: Quotation) => void;
}) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const age = daysSince(deal.updated_at || deal.created_at);
  const daysToExpire = getDaysUntil(deal.expiry_date);

  let borderClass = "";
  if (age > 7 || daysToExpire < 0 || (deal.priority === "high" && age > 3)) {
    borderClass = "border-l-4 border-l-red-400 bg-[var(--color-danger-soft)]";
  } else if (age > 4 || daysToExpire <= 2) {
    borderClass = "border-l-4 border-l-amber-400 bg-[var(--color-warning-soft)]";
  } else if (deal.pipeline_stage === "won") {
    borderClass = "border-l-4 border-l-emerald-400 bg-[var(--color-success-soft)]";
  } else {
    borderClass = "border-l-[3px] border-l-transparent hover:border-l-[var(--color-primary)]";
  }

  const publicUrl = deal.pdf_drive_id ? `${window.location.origin}/view/${deal.pdf_drive_id}` : "";
  const whatsappMsg = `Olá ${deal.client_name || "Cliente"},\n\nEspero que esteja bem.\n\nGostaria apenas de confirmar se teve oportunidade de analisar a proposta ${deal.quotation_number}.${publicUrl ? `\n\n🔗 Ver proposta:\n${publicUrl}` : ""}\n\nEstamos disponíveis para qualquer esclarecimento.\n\nCumprimentos,\n${companyName}`;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      className={`card-premium p-3 cursor-grab active:cursor-grabbing group relative mb-2 ${borderClass}`}
      onMouseLeave={() => setShowMenu(false)}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityBadge priority={deal.priority} />
          {daysToExpire < 0 && deal.pipeline_stage !== "won" && deal.pipeline_stage !== "lost" ? (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-sm">Expirado</span>
          ) : daysToExpire <= 2 && daysToExpire >= 0 && deal.pipeline_stage !== "won" && deal.pipeline_stage !== "lost" ? (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm">Expira em {daysToExpire}d</span>
          ) : null}
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-0.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100">
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full w-44 bg-white border border-gray-200 rounded-md shadow-xl z-20 py-1">
              <button onClick={() => router.push(`/dashboard/quotations/${deal.id}`)} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5" /> Abrir Proforma
              </button>
              <button onClick={() => { setShowMenu(false); onSetStage(deal); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <GripVertical className="w-3.5 h-3.5" /> Mover Fase
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button onClick={() => { setShowMenu(false); onSetPriority(deal.id, deal.priority === "high" ? "medium" : "high"); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" /> Alternar Prioridade
              </button>
              <button onClick={() => router.push(`/dashboard/quotations/new?duplicate=${deal.id}`)} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Edit2 className="w-3.5 h-3.5" /> Duplicar
              </button>
            </div>
          )}
        </div>
      </div>

      <Link href={`/dashboard/clients/${deal.client_id}`} className="block group-hover:text-blue-600 transition-colors">
        <p className="text-[13px] font-bold text-gray-900 truncate">{deal.client_name || "Sem cliente"}</p>
      </Link>
      <div className="flex items-center justify-between mb-2 mt-0.5">
        <p className="text-[14px] font-black text-gray-800">{formatCurrency(deal.grand_total)}</p>
        <span className="font-mono text-[9px] text-gray-400">{deal.quotation_number}</span>
      </div>

      <div className="mb-3">
        {deal.next_action ? (
          <div className="bg-indigo-50/80 border border-indigo-100 rounded-md p-2">
            <div className="flex items-start justify-between gap-2">
              <div onClick={() => onSetNextAction(deal)} className="cursor-pointer flex-1 min-w-0 group/action">
                <div className="flex items-center gap-1 mb-0.5">
                  <Target className="w-3 h-3 text-indigo-500" />
                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">Próxima Ação</span>
                </div>
                <p className="text-[11px] font-semibold text-indigo-900 leading-tight group-hover/action:text-indigo-600 transition-colors">{deal.next_action}</p>
                {deal.next_action_date && (
                  <p className={`text-[10px] mt-0.5 font-medium flex items-center gap-1 ${isTodayOrPast(deal.next_action_date) ? "text-red-600" : "text-indigo-500"}`}>
                    <Clock className="w-3 h-3" />
                    {isTodayOrPast(deal.next_action_date) ? "Hoje ou Atrasado" : new Date(deal.next_action_date).toLocaleDateString("pt-MZ", { day: "2-digit", month: "short" })}
                    {deal.next_action_time && <span> • {deal.next_action_time}</span>}
                  </p>
                )}
              </div>
              <button onClick={() => onCompleteAction(deal)} title="Concluir Ação" className="p-1 text-indigo-400 hover:text-green-600 hover:bg-green-50 rounded shrink-0 transition-colors">
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div onClick={() => onSetNextAction(deal)} className="bg-red-50/50 border border-red-100 border-dashed rounded-md p-2 cursor-pointer hover:bg-red-50 transition-colors">
            <div className="flex items-center gap-1.5 justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[11px] font-bold text-red-600">Sem Próxima Ação</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <AgingBadge age={age} />
          {age <= 3 && <span className="text-[9px] text-gray-400 font-medium">Última inter. há {age === 0 ? "pouco" : `${age}d`}</span>}
        </div>
        
        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLogWhatsApp(deal);
              window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`, '_blank', 'noopener,noreferrer');
            }}
            title="Follow-up WhatsApp"
            className="p-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-full transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              window.open(`mailto:?subject=${encodeURIComponent(`Follow-up Proposta ${deal.quotation_number}`)}`, '_self');
            }}
            title="Enviar Email" 
            className="p-1.5 bg-gray-100 text-gray-600 hover:bg-blue-500 hover:text-white rounded-full transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  stage,
  deals,
  companyName,
  onDragStart,
  onDrop,
  onDragOver,
  isDragOver,
  onSetNextAction,
  onSetPriority,
  onSetStage,
  onCompleteAction,
  onLogWhatsApp
}: {
  stage: (typeof PIPELINE_STAGES)[number];
  deals: Quotation[];
  companyName: string;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, stage: PipelineStage) => void;
  onDragOver: (e: React.DragEvent) => void;
  isDragOver: boolean;
  onSetNextAction: (deal: Quotation) => void;
  onSetPriority: (id: string, priority: "low" | "medium" | "high") => void;
  onSetStage: (deal: Quotation) => void;
  onCompleteAction: (deal: Quotation) => void;
  onLogWhatsApp: (deal: Quotation) => void;
}) {
  const totalValue = deals.reduce((sum, d) => sum + (d.grand_total || 0), 0);

  return (
    <div
      onDrop={(e) => onDrop(e, stage.key)}
      onDragOver={onDragOver}
      className={`flex flex-col min-w-[280px] w-[85vw] sm:w-[320px] shrink-0 rounded-xl bg-gray-50/50 border transition-all duration-200 snap-center ${
        isDragOver
          ? "border-blue-400 bg-blue-50/30 ring-4 ring-blue-400/20 scale-[1.02]"
          : "border-gray-200"
      }`}
    >
      <div className="p-3 pb-2 border-b border-gray-100 bg-white/50 rounded-t-xl sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{stage.label}</h3>
          <span className="ml-auto text-xs font-bold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>
        <p className="text-xs text-gray-500 font-semibold">
          {formatCurrency(totalValue)}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[150px]">
        {deals.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-xs font-medium text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-white/30">
            Arraste para aqui
          </div>
        ) : (
          deals.map((deal) => (
            <KanbanCard 
              key={deal.id} 
              deal={deal} 
              companyName={companyName}
              onDragStart={onDragStart} 
              onSetNextAction={onSetNextAction}
              onSetPriority={onSetPriority}
              onSetStage={onSetStage}
              onCompleteAction={onCompleteAction}
              onLogWhatsApp={onLogWhatsApp}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NextActionModal({
  deal,
  onClose,
  onSave,
}: {
  deal: Quotation;
  onClose: () => void;
  onSave: (action: string | null, date: string | null, time: string | null, reminders: boolean) => void;
}) {
  const [action, setAction] = useState(deal.next_action || "");
  const [date, setDate] = useState(deal.next_action_date || "");
  const [time, setTime] = useState(deal.next_action_time || "");
  const [reminders, setReminders] = useState(deal.reminders_enabled !== false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const handleSave = async () => {
    if (reminders) {
      setIsRequestingPermission(true);
      await requestNotificationPermission();
      setIsRequestingPermission(false);
    }
    onSave(action || null, date || null, time || null, reminders);
  };

  const quickActions = [
    "Ligar ao cliente",
    "Enviar revisão",
    "Follow-up SMS/WhatsApp",
    "Agendar reunião",
    "Preparar contrato",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md scale-in-center">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Próxima Ação</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-sm font-bold text-gray-800">{deal.client_name || "Sem cliente"}</p>
            <p className="text-xs text-gray-500 mt-0.5">{deal.quotation_number} • {formatCurrency(deal.grand_total)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickActions.map((qa) => (
              <button
                key={qa}
                onClick={() => setAction(qa)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                  action === qa
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {qa}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ação a Realizar</label>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Descreva o que vai fazer..."
              className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Data Prevista
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Hora (Opcional)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2 p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg">
            <input 
              type="checkbox" 
              checked={reminders} 
              onChange={e => setReminders(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-medium text-indigo-900">Receber lembrete no dispositivo</span>
          </label>
        </div>
        <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          {deal.next_action && (
            <button
              onClick={() => onSave(null, null, null, false)}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Remover
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isRequestingPermission}
            className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isRequestingPermission ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function MoveStageModal({
  deal,
  onClose,
  onSave,
}: {
  deal: Quotation;
  onClose: () => void;
  onSave: (stage: PipelineStage) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm scale-in-center overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900">Mover para Fase</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-2 space-y-1">
          {PIPELINE_STAGES.map(stage => (
            <button
              key={stage.key}
              onClick={() => onSave(stage.key)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                deal.pipeline_stage === stage.key ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "hover:bg-blue-50 text-gray-700 hover:text-blue-700"
              }`}
              disabled={deal.pipeline_stage === stage.key}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
              {stage.label}
              {deal.pipeline_stage === stage.key && <span className="ml-auto text-xs text-gray-400">(Atual)</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { quotations, fetchQuotations, setNextActionFull } = useQuotationsStore();
  const { moveDeal, setPriority, getDealsByStage, getPipelineMetrics } = usePipelineStore();
  const { addInteraction } = useInteractionsStore();
  const { company } = useCompanyStore();

  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  const [actionModal, setActionModal] = useState<Quotation | null>(null);
  const [moveModal, setMoveModal] = useState<Quotation | null>(null);
  const [filter, setFilter] = useState<"all" | "high" | "negotiation" | "inactive" | "no_action" | "expiring" | "follow_up">("all");

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const activeQuotations = useMemo(() => quotations.filter(q => q.pipeline_stage !== "won" && q.pipeline_stage !== "lost"), [quotations]);

  // Dashboard "HOJE" Lists
  const todoToday = useMemo(() => activeQuotations.filter(q => q.next_action && isTodayOrPast(q.next_action_date)), [activeQuotations]);
  const noNextAction = useMemo(() => activeQuotations.filter(q => !q.next_action), [activeQuotations]);
  const expiringSoon = useMemo(() => activeQuotations.filter(q => {
    const days = getDaysUntil(q.expiry_date);
    return days <= 3 && days >= 0;
  }), [activeQuotations]);
  const inactiveDeals = useMemo(() => activeQuotations.filter(q => daysSince(q.updated_at) > 7), [activeQuotations]);
  const highPriorityInactive = useMemo(() => activeQuotations.filter(q => q.priority === "high" && daysSince(q.updated_at) > 3), [activeQuotations]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData("text/plain");
    if (!dealId) return;

    try {
      await moveDeal(dealId, stage);
      await fetchQuotations();
    } catch (err: any) {
      alert(err.message || "Erro ao mover proforma.");
    }
  };

  const handleSaveNextAction = async (action: string | null, date: string | null, time: string | null, reminders: boolean) => {
    if (!actionModal) return;
    await setNextActionFull(actionModal.id, action, date, time, reminders);
    setActionModal(null);
    await fetchQuotations();
  };

  const handleCompleteAction = async (deal: Quotation) => {
    try {
      if (deal.client_id) {
        await addInteraction(deal.client_id, "note", `Ação concluída: ${deal.next_action}`, null);
      }
      await setNextActionFull(deal.id, null, null, null, false);
      await fetchQuotations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogWhatsApp = async (deal: Quotation) => {
    try {
      if (deal.client_id) {
        await addInteraction(deal.client_id, "whatsapp", "Follow-up enviado por WhatsApp", `Proforma: ${deal.quotation_number}`);
        // Refresh to update aging
        await fetchQuotations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetPriority = async (id: string, priority: "low"|"medium"|"high") => {
    await setPriority(id, priority);
    await fetchQuotations();
  };

  const handleMoveStage = async (stage: PipelineStage) => {
    if (!moveModal) return;
    try {
      await moveDeal(moveModal.id, stage);
      setMoveModal(null);
      await fetchQuotations();
    } catch (err: any) {
      alert(err.message || "Erro ao mover proforma.");
    }
  };

  const metrics = getPipelineMetrics(quotations);

  const filteredQuotations = quotations.filter(q => {
    if (filter === "high") return q.priority === "high";
    if (filter === "negotiation") return q.pipeline_stage === "negotiation";
    if (filter === "inactive") return daysSince(q.updated_at || q.created_at) > 7;
    if (filter === "no_action") return !q.next_action && q.pipeline_stage !== "won" && q.pipeline_stage !== "lost";
    if (filter === "expiring") return getDaysUntil(q.expiry_date) <= 3 && getDaysUntil(q.expiry_date) >= 0;
    if (filter === "follow_up") return q.next_action && isTodayOrPast(q.next_action_date);
    return true;
  });

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full min-h-[calc(100vh-80px)]">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-page-title">Pipeline</h1>
        <p className="text-page-subtitle">
          Acompanhamento de negócios e CRM.
        </p>
      </div>

      {/* Dashboard "Hoje" - The Operational Hub */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* A Fazer Hoje */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="bg-indigo-50 border-b border-indigo-100 p-3 flex items-center justify-between">
            <h2 className="font-bold text-indigo-900 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-indigo-600" /> A Fazer Hoje
            </h2>
            <span className="text-xs font-bold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">{todoToday.length} pendentes</span>
          </div>
          <div className="p-2 flex-1 overflow-y-auto max-h-48 space-y-1">
            {todoToday.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 italic">Nada agendado para hoje. Tudo em dia! 🎉</div>
            ) : (
              todoToday.map(deal => (
                <div key={deal.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group">
                  <div className="flex items-start gap-2 overflow-hidden">
                    <Target className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{deal.next_action}</p>
                      <p className="text-xs text-gray-500 truncate">{deal.client_name} • {deal.quotation_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => setActionModal(deal)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleCompleteAction(deal)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"><CheckCircle2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Atenção Necessária */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="bg-rose-50 border-b border-rose-100 p-3 flex items-center justify-between">
            <h2 className="font-bold text-rose-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-rose-600" /> Atenção Necessária
            </h2>
            <span className="text-xs font-bold bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">
              {noNextAction.length + expiringSoon.length + inactiveDeals.length + highPriorityInactive.length} alertas
            </span>
          </div>
          <div className="p-2 flex-1 overflow-y-auto max-h-48 space-y-1">
            {noNextAction.length === 0 && expiringSoon.length === 0 && inactiveDeals.length === 0 && highPriorityInactive.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 italic">Sem alertas críticos no pipeline.</div>
            ) : (
              <>
                {noNextAction.map(deal => (
                  <div key={deal.id} className="flex items-center justify-between p-2 bg-red-50/50 rounded-lg">
                    <div className="flex items-start gap-2 overflow-hidden">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-red-900 truncate">Sem próxima ação</p>
                        <p className="text-xs text-red-700/70 truncate">{deal.client_name} • {formatCurrency(deal.grand_total)}</p>
                      </div>
                    </div>
                    <button onClick={() => setActionModal(deal)} className="text-xs font-bold text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded">Definir</button>
                  </div>
                ))}
                {expiringSoon.map(deal => (
                  <div key={deal.id} className="flex items-center justify-between p-2 hover:bg-amber-50 rounded-lg">
                    <div className="flex items-start gap-2 overflow-hidden">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-amber-900 truncate">Expira em {getDaysUntil(deal.expiry_date)} dias</p>
                        <p className="text-xs text-amber-700/70 truncate">{deal.client_name} • {deal.quotation_number}</p>
                      </div>
                    </div>
                    <a href={`https://wa.me/?text=${encodeURIComponent(`Olá ${deal.client_name || ""}, a sua proposta ${deal.quotation_number} expira em breve.`)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-amber-600 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded flex items-center gap-1"><MessageCircle className="w-3 h-3"/> Alerta</a>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Forecast & Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-12 h-12" /></div>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider truncate">Pipeline Potencial</p>
          <p className="text-lg md:text-xl lg:text-2xl font-black text-gray-900 mt-1 truncate" title={formatCurrency(metrics.totalPipeline)}>{formatCurrency(metrics.totalPipeline)}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-center">
          <p className="text-[10px] md:text-xs font-bold text-indigo-700 uppercase tracking-wider truncate">Em Negociação</p>
          <p className="text-lg md:text-xl lg:text-2xl font-black text-indigo-900 mt-1 truncate" title={formatCurrency(metrics.inNegotiation)}>{formatCurrency(metrics.inNegotiation)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4 shadow-sm flex flex-col justify-center overflow-hidden">
          <p className="text-[10px] md:text-xs font-bold text-green-700 uppercase tracking-wider truncate">Ganhos</p>
          <p className="text-lg md:text-xl lg:text-2xl font-black text-green-900 mt-1 truncate" title={formatCurrency(metrics.won)}>{formatCurrency(metrics.won)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-xl p-4 shadow-sm flex flex-col justify-center overflow-hidden">
          <p className="text-[10px] md:text-xs font-bold text-red-700 uppercase tracking-wider truncate">Perdidos</p>
          <p className="text-lg md:text-xl lg:text-2xl font-black text-red-900 mt-1 truncate" title={formatCurrency(metrics.lost)}>{formatCurrency(metrics.lost)}</p>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-4 scrollbar-hide">
        <button 
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter === "all" ? "bg-gray-800 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          Todos os Negócios
        </button>
        <button 
          onClick={() => setFilter("no_action")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${filter === "no_action" ? "bg-red-100 text-red-800 border border-red-200" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Sem Próxima Ação
        </button>
        <button 
          onClick={() => setFilter("follow_up")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${filter === "follow_up" ? "bg-indigo-100 text-indigo-800 border border-indigo-200" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          <ListTodo className="w-3.5 h-3.5" /> Follow-up Pendente
        </button>
        <button 
          onClick={() => setFilter("high")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${filter === "high" ? "bg-orange-100 text-orange-800 border border-orange-200" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          <span className="w-2 h-2 rounded-full bg-orange-500"></span> Alta Prioridade
        </button>
        <button 
          onClick={() => setFilter("expiring")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${filter === "expiring" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          Expirando Hoje
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory hide-scrollbar">
        <div className="flex gap-4 h-full min-w-max items-start">
          {PIPELINE_STAGES.map((stage) => {
            const deals = getDealsByStage(filteredQuotations, stage.key);
            return (
              <KanbanColumn
                key={stage.key}
                stage={stage}
                deals={deals}
                companyName={company?.name || "A Empresa"}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  handleDragOver(e);
                  setDragOverStage(stage.key);
                }}
                isDragOver={dragOverStage === stage.key}
                onSetNextAction={setActionModal}
                onSetPriority={handleSetPriority}
                onSetStage={setMoveModal}
                onCompleteAction={handleCompleteAction}
                onLogWhatsApp={handleLogWhatsApp}
              />
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {actionModal && (
        <NextActionModal
          deal={actionModal}
          onClose={() => setActionModal(null)}
          onSave={handleSaveNextAction}
        />
      )}
      
      {moveModal && (
        <MoveStageModal
          deal={moveModal}
          onClose={() => setMoveModal(null)}
          onSave={handleMoveStage}
        />
      )}
    </div>
  );
}
