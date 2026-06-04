"use client";

import React from 'react';
import { Download } from 'lucide-react';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
    >
      <Download className="w-4 h-4" /> 
      <span>Descarregar / Imprimir</span>
    </button>
  );
}
