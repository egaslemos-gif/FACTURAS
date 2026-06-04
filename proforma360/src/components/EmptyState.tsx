"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500", className)}>
      <div className="w-20 h-20 mb-6 rounded-3xl bg-white shadow-soft flex items-center justify-center border border-gray-100">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
          <Icon className="w-7 h-7 text-teal-600 stroke-[1.5px]" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed mb-8">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary px-6 py-3 shadow-md"
        >
          {action.icon && <action.icon className="w-4 h-4 mr-2" />}
          {action.label}
        </button>
      )}
    </div>
  );
}
