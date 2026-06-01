"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] flex flex-col">
      {/* Navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-[var(--color-outline-variant)] bg-white/80 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="text-xl font-bold text-[var(--color-primary)] tracking-tight">
          Proforma360
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#funcionalidades" className="hover:text-[var(--color-primary)] transition-colors">Funcionalidades</a>
          <a href="#vantagens" className="hover:text-[var(--color-primary)] transition-colors">Vantagens BYOS</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-[var(--color-primary)] transition-colors">
            Entrar
          </Link>
          <Link href="/login" className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[#003ea8] transition-colors elevation-1">
            Começar Grátis
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 mt-20">
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
            A Sua Plataforma de Cotações
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[var(--color-on-surface)] max-w-4xl mb-6 leading-tight">
            Crie proformas profissionais em segundos. <br />
            <span className="text-[var(--color-primary)]">Os dados são 100% seus.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[var(--color-on-surface-variant)] max-w-2xl mb-10 leading-relaxed">
            A primeira plataforma construída com arquitetura BYOS (Bring Your Own Storage). 
            Nenhuma base de dados central. Tudo é guardado em segurança no seu Google Drive e localmente no seu dispositivo.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-[var(--color-primary)] hover:bg-[#003ea8] text-white rounded-xl text-lg font-medium transition-transform active:scale-95 elevation-2 flex items-center justify-center gap-2">
              Aceder ao Painel <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Features / Benefits */}
        <section id="funcionalidades" className="bg-white py-20 border-t border-[var(--color-outline-variant)]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Porquê escolher o Proforma360?</h2>
              <p className="text-[var(--color-on-surface-variant)] max-w-2xl mx-auto">
                Desenhado para freelancers, consultores e pequenas empresas que precisam de emitir documentos rápidos, sem pagar mensalidades absurdas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="p-8 rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] elevation-1">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3">100% Privacidade (BYOS)</h3>
                <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">
                  Não temos acesso aos seus clientes, preços ou proformas. Tudo o que cria fica alojado na sua própria conta Google.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] elevation-1">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Rápido e Offline</h3>
                <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">
                  A base de dados corre localmente no seu browser. Pode continuar a trabalhar e a gerar PDFs mesmo se perder a ligação à internet.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] elevation-1">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3">PDFs Profissionais</h3>
                <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">
                  Gere documentos A4 de alta qualidade instantaneamente. Pronto para imprimir, enviar por e-mail ou WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 text-center text-sm">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-white font-bold text-xl mb-4 md:mb-0">Proforma360</div>
          <p>© {new Date().getFullYear()} Proforma360. Plataforma de Gestão MVP.</p>
        </div>
      </footer>
    </div>
  );
}
