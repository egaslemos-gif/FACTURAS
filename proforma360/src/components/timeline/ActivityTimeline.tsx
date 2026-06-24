"use client";

import React, { useEffect, useState } from "react";
import { TimelineBuilder, TimelineEvent } from "@/lib/timeline/timelineBuilder";

interface ActivityTimelineProps {
  clientId: string;
}

export function ActivityTimeline({ clientId }: ActivityTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTimeline() {
      try {
        setLoading(true);
        const timelineData = await TimelineBuilder.buildTimeline(clientId);
        setEvents(timelineData);
      } catch (error) {
        console.error("Failed to load timeline:", error);
      } finally {
        setLoading(false);
      }
    }
    if (clientId) {
      loadTimeline();
    }
  }, [clientId]);

  const getIcon = (event: TimelineEvent) => {
    if (event.type === "telemetry") {
      return event.action === "PROPOSAL_VIEWED" ? "👁️" : "📥";
    }
    if (event.type === "interaction") {
      switch (event.meta?.type) {
        case "call":
          return "📞";
        case "meeting":
          return "🤝";
        case "email":
          return "📧";
        case "whatsapp":
          return "💬";
        default:
          return "📝";
      }
    }
    // Quotation history
    if (event.action.includes("APPROVED")) return "✅";
    if (event.action.includes("REJECTED")) return "❌";
    return "📄";
  };

  const getBgColor = (event: TimelineEvent) => {
    if (event.type === "telemetry") {
      return event.action === "PROPOSAL_VIEWED" ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-blue-50 border-blue-200 text-blue-700";
    }
    if (event.type === "interaction") {
      return "bg-slate-50 border-slate-200 text-slate-700";
    }
    if (event.action.includes("APPROVED")) return "bg-emerald-50 border-emerald-200 text-emerald-700";
    if (event.action.includes("REJECTED")) return "bg-red-50 border-red-200 text-red-700";
    return "bg-indigo-50 border-indigo-200 text-indigo-700";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-2">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">A carregar linha do tempo...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-slate-500 text-sm font-medium">Nenhuma atividade registada para este cliente.</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {events.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== events.length - 1 ? (
                <span
                  className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-slate-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white border ${getBgColor(
                      event
                    )}`}
                  >
                    <span className="text-base">{getIcon(event)}</span>
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1.5">
                  <div className="flex justify-between items-start space-x-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {event.title}
                      </p>
                      {event.details && (
                        <p className="text-sm text-slate-600 mt-0.5 font-medium">
                          {event.details}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs whitespace-nowrap text-slate-500 font-semibold">
                      {new Date(event.timestamp).toLocaleString("pt-PT", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
