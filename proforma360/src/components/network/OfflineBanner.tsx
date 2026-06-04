'use client';

import { useNetworkStore } from '@/stores/useNetworkStore';
import { CloudOff } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline } = useNetworkStore();

  if (isOnline) return null;

  return (
    <div className="bg-amber-100 text-amber-900 border-b border-amber-200 overflow-hidden animate-in slide-in-from-top-2 fade-in">
      <div className="flex items-center justify-center py-2 px-4 text-sm font-medium">
        <CloudOff className="w-4 h-4 mr-2" />
        <span>Modo local ativo. A sincronização retomará automaticamente.</span>
      </div>
    </div>
  );
}
