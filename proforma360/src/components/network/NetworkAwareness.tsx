'use client';

import { useEffect } from 'react';
import { initNetworkAwareness } from '@/lib/network/networkManager';

export function NetworkAwareness() {
  useEffect(() => {
    const cleanup = initNetworkAwareness();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return null; // This component just mounts the hook
}
