import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface LegalLayoutProps {
  children: React.ReactNode;
  title: string;
  lastUpdated?: string;
}

export default function LegalLayout({ children, title, lastUpdated }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#042f2e] rounded flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Proforma360</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <div className="mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">{title}</h1>
          {lastUpdated && (
            <p className="text-gray-500 font-medium">Última atualização: {lastUpdated}</p>
          )}
        </div>

        <div className="prose prose-gray prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-teal-600 hover:prose-a:text-teal-700">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 py-12 mt-20">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-gray-500 font-medium">
            © 2026 Proforma360. Todos os direitos reservados.
          </div>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/security" className="text-gray-500 hover:text-gray-900 transition-colors">Segurança</Link>
            <Link href="/privacy" className="text-gray-500 hover:text-gray-900 transition-colors">Privacidade</Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-900 transition-colors">Termos</Link>
            <Link href="/support" className="text-gray-500 hover:text-gray-900 transition-colors">Suporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
