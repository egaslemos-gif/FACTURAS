"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  ArrowRight, CheckCircle2, FileText, Share2, 
  Database, Cloud, Shield, KanbanSquare, 
  Zap, Smartphone, Menu, X, Plus, Bell, Search, Home, Users, Package
} from "lucide-react";

// --- REALISTIC CODE-BASED MOCKUPS ---

const RealDashboardMockup = () => (
  <div className="relative w-full max-w-2xl mx-auto rounded-xl border border-slate-200/60 bg-slate-50 shadow-2xl overflow-hidden select-none">
    {/* macOS Window Header */}
    <div className="h-10 border-b border-slate-200 bg-white flex items-center px-4 justify-between">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 text-slate-300"><Search size={14}/></div>
        <div className="w-4 h-4 text-slate-300"><Bell size={14}/></div>
        <div className="w-6 h-6 bg-slate-200 rounded-full ml-2"></div>
      </div>
    </div>
    
    <div className="flex h-[380px]">
      {/* Sidebar */}
      <div className="w-48 border-r border-slate-200 bg-slate-50 flex flex-col justify-between">
        <div className="p-3 space-y-1">
          <div className="text-xs font-bold text-slate-800 mb-4 px-2 tracking-tight">Proforma360</div>
          
          <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-200/50 text-slate-900 rounded-md text-[13px] font-medium">
             <Home size={14} className="text-slate-500" /> Dashboard
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-[13px] font-medium">
             <FileText size={14} className="text-slate-400" /> Proformas
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-[13px] font-medium">
             <KanbanSquare size={14} className="text-slate-400" /> Pipeline
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-[13px] font-medium">
             <Users size={14} className="text-slate-400" /> Clientes
          </div>
        </div>
        <div className="p-4 border-t border-slate-200">
           <button className="w-full flex items-center justify-center gap-1.5 bg-slate-900 text-white rounded py-1.5 text-xs font-medium">
             <Plus size={14} /> Nova Proforma
           </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-5 bg-white overflow-hidden">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Pipeline Comercial</h2>
          <p className="text-xs text-slate-500">Acompanhe as propostas ativas.</p>
        </div>
        
        {/* Kanban Board */}
        <div className="flex gap-4">
          {/* Column 1 */}
          <div className="w-64 flex-shrink-0 bg-slate-50/50 rounded-lg p-2.5 border border-slate-100">
             <div className="flex justify-between items-center mb-3 px-1">
               <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Aguardar Resposta</span>
               <span className="text-[10px] font-mono bg-slate-200 px-1.5 rounded text-slate-600">2</span>
             </div>
             
             <div className="space-y-2">
               {/* Card 1 */}
               <div className="bg-white p-3 rounded-md border border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-default">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-slate-900 truncate">Tech Solutions, Lda</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1"></div>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-2 truncate">PRF-2026-0042</div>
                  <div className="text-sm font-bold text-slate-900 mb-3">287.880,00 MTn</div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-red-50 text-red-700 border border-red-100 text-[9px] px-1.5 py-0.5 rounded font-medium">Expira em 2 dias</span>
                  </div>
               </div>

               {/* Card 2 */}
               <div className="bg-white p-3 rounded-md border border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-default">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-slate-900 truncate">Agência Digital MOZ</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-1"></div>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-2 truncate">PRF-2026-0038</div>
                  <div className="text-sm font-bold text-slate-900 mb-3">45.000,00 MTn</div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] px-1.5 py-0.5 rounded font-medium">Follow-up amanhã</span>
                  </div>
               </div>
             </div>
          </div>

          {/* Column 2 */}
          <div className="w-64 flex-shrink-0 bg-slate-50/50 rounded-lg p-2.5 border border-slate-100">
             <div className="flex justify-between items-center mb-3 px-1">
               <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Aprovado</span>
               <span className="text-[10px] font-mono bg-slate-200 px-1.5 rounded text-slate-600">1</span>
             </div>
             
             <div className="space-y-2">
               {/* Card 3 */}
               <div className="bg-white p-3 rounded-md border border-teal-200 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-default relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-0.5 h-full bg-teal-500"></div>
                  <div className="flex justify-between items-start mb-1 pl-1">
                    <span className="text-xs font-semibold text-slate-900 truncate">Consultoria Global SA</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-2 pl-1 truncate">PRF-2026-0031</div>
                  <div className="text-sm font-bold text-slate-900 mb-3 pl-1">1.250.000,00 MTn</div>
                  <div className="flex items-center gap-1.5 pl-1">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1"><CheckCircle2 size={10} /> Negócio Fechado</span>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RealMobileMockup = () => (
  <div className="w-[300px] h-[600px] bg-slate-50 rounded-[2.5rem] border-[10px] border-slate-900 shadow-2xl relative overflow-hidden select-none">
    {/* Notch */}
    <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 w-40 mx-auto rounded-b-xl z-20"></div>
    
    {/* Header */}
    <div className="bg-white pt-10 pb-4 px-5 border-b border-slate-200 relative z-10 shadow-sm">
       <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-bold text-slate-900">Proforma360</span>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
             <Search size={16} className="text-slate-600" />
          </div>
       </div>
       <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">Pipeline</span>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">3 Ativas</span>
       </div>
    </div>

    {/* Content */}
    <div className="p-4 h-full overflow-y-auto pb-24 bg-slate-50">
       <div className="space-y-3">
         {/* Card 1 */}
         <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-semibold text-slate-900">Tech Solutions, Lda</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">PRF-0042</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mb-3">287.880,00 MTn</div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">Aguardar Resposta</span>
              <button className="flex items-center justify-center w-8 h-8 bg-green-50 text-green-600 rounded-full">
                <Share2 size={14} />
              </button>
            </div>
         </div>

         {/* Card 2 */}
         <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 opacity-75">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-semibold text-slate-900">Agência Digital</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">PRF-0038</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mb-3">45.000,00 MTn</div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">Rascunho</span>
            </div>
         </div>
       </div>
    </div>

    {/* Bottom Navigation */}
    <div className="absolute bottom-0 inset-x-0 h-16 bg-white border-t border-slate-200 flex justify-around items-center px-2 z-20">
       <div className="flex flex-col items-center text-slate-400">
         <Home size={20} />
         <span className="text-[9px] mt-1 font-medium">Início</span>
       </div>
       <div className="flex flex-col items-center text-teal-600">
         <FileText size={20} />
         <span className="text-[9px] mt-1 font-medium">Proformas</span>
       </div>
       <div className="relative -top-5">
         <button className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg shadow-slate-900/30">
           <Plus size={24} />
         </button>
       </div>
       <div className="flex flex-col items-center text-slate-400">
         <Users size={20} />
         <span className="text-[9px] mt-1 font-medium">Clientes</span>
       </div>
       <div className="flex flex-col items-center text-slate-400">
         <Package size={20} />
         <span className="text-[9px] mt-1 font-medium">Produtos</span>
       </div>
    </div>
  </div>
);

const RealDarkPipelineMockup = () => (
  <div className="w-full max-w-5xl mx-auto rounded-xl border border-slate-800 bg-[#09090B] shadow-2xl overflow-hidden select-none">
    <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
      </div>
      <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
        <span className="text-white bg-slate-800 px-3 py-1 rounded-md">Pipeline</span>
        <span className="hover:text-slate-300">Propostas</span>
      </div>
    </div>

    <div className="p-6 md:p-8 flex gap-6 overflow-x-auto">
      {/* Col 1 */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aguardar Resposta</span>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">2</span>
        </div>

        <div className="bg-[#18181B] border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-all cursor-default">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-semibold text-slate-200">Tech Solutions, Lda</span>
            <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5"></div>
          </div>
          <div className="text-lg font-bold text-white mb-4">287.880,00 MTn</div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-red-950/50 text-red-400 border border-red-900/50 text-[10px] px-2 py-1 rounded font-medium">⚠ Expira amanhã</span>
            <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-2 py-1 rounded font-medium">📞 Ligar 15:00</span>
          </div>
        </div>

        <div className="bg-[#18181B] border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-all cursor-default">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-semibold text-slate-200">Construtora Apex</span>
            <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1.5"></div>
          </div>
          <div className="text-lg font-bold text-white mb-4">1.050.000,00 MTn</div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-amber-950/50 text-amber-400 border border-amber-900/50 text-[10px] px-2 py-1 rounded font-medium">Em análise</span>
          </div>
        </div>
      </div>

      {/* Col 2 */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aprovado</span>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">1</span>
        </div>

        <div className="bg-[#18181B] border border-emerald-900/50 rounded-lg p-4 relative overflow-hidden cursor-default">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
          <div className="flex justify-between items-start mb-2 pl-2">
            <span className="text-sm font-semibold text-slate-200">Consultoria Global SA</span>
          </div>
          <div className="text-lg font-bold text-white mb-4 pl-2">450.000,00 MTn</div>
          <div className="flex flex-wrap gap-2 pl-2">
            <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 text-[10px] px-2 py-1 rounded font-medium flex items-center gap-1">
               <CheckCircle2 size={12} /> Negócio Fechado
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- MAIN PAGE ---

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      
      {/* Navigation */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-200 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="Logo" className="w-7 h-7 rounded" />
            <span className="text-[17px] font-bold tracking-tight text-slate-900">Proforma360</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#workflow" className="hover:text-slate-900 transition-colors">Workspace</a>
            <a href="#pipeline" className="hover:text-slate-900 transition-colors">Pipeline</a>
            <a href="#precos" className="hover:text-slate-900 transition-colors">Preços</a>
          </nav>
          
          <div className="hidden md:flex items-center gap-5">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Entrar
            </Link>
            <Link href="/login" className="px-4 py-2 bg-slate-900 text-white rounded-md text-[13px] font-medium hover:bg-slate-800 transition-colors shadow-sm active:scale-95">
              Começar Grátis
            </Link>
          </div>

          <button className="md:hidden text-slate-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Backdrop */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40" 
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl py-4 px-6 flex flex-col gap-4 z-50">
             <a href="#workflow" className="text-slate-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Workspace</a>
             <a href="#pipeline" className="text-slate-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Pipeline</a>
             <a href="#precos" className="text-slate-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Preços</a>
             <div className="h-px w-full bg-slate-100 my-2"></div>
             <Link href="/login" className="text-slate-900 font-medium py-2 text-center border border-slate-200 rounded-md">Entrar</Link>
             <Link href="/login" className="bg-slate-900 text-white font-medium py-2 rounded-md text-center">Começar Grátis</Link>
          </div>
        )}
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-16 md:pt-36 md:pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          <div className="flex-1 lg:pr-12 text-center lg:text-left z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-5xl lg:text-[54px] font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              CRM, Pipeline <br className="hidden lg:block" /> e Proformas num <br className="hidden lg:block" /> único workspace.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Crie propostas profissionais, acompanhe negociações, envie via WhatsApp e opere a sua empresa mesmo sem internet.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Link href="/login" className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-lg text-[15px] font-medium hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95">
                Começar Gratuitamente <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-[15px] font-medium hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center active:scale-95">
                Explorar Plataforma
              </Link>
            </div>
            
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-[13px] font-medium text-slate-500">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-slate-400" /> Offline-First</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-slate-400" /> Sem cartões de crédito</div>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-3xl lg:max-w-none relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/40 to-slate-50/40 rounded-3xl blur-3xl -z-10 transform scale-110"></div>
            <RealDashboardMockup />
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section id="workflow" className="py-24 bg-white overflow-hidden border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-20 text-center">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                Operações unificadas e velozes.
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
                Abandone o Excel e os PDFs soltos. Acelere o ciclo de vendas e não perca nenhum negócio por falta de acompanhamento.
              </p>
            </div>

            <div className="space-y-28">
              {/* Block 1 */}
              <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                <div className="flex-1 space-y-6">
                  <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-900" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Crie propostas profissionais em segundos.</h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    A interface mais rápida para compor orçamentos. Grelha de produtos com cálculo automático, e conversão instantânea para PDFs limpos com o branding da sua empresa.
                  </p>
                </div>
                <div className="flex-1 w-full">
                   <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                     <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                       <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                         <div className="font-bold text-slate-800">FACTURA PROFORMA</div>
                         <div className="text-xs text-slate-500">Nº PRF-2026-0089</div>
                       </div>
                       
                       <div className="space-y-2 mb-6">
                         <div className="flex justify-between text-xs font-medium text-slate-500 bg-slate-50 p-2 rounded">
                           <span>Descrição</span>
                           <span>Total</span>
                         </div>
                         <div className="flex justify-between text-sm text-slate-800 px-2 py-1 border-b border-slate-50">
                           <span>Desenvolvimento Web App</span>
                           <span className="font-medium">150.000,00 MTn</span>
                         </div>
                         <div className="flex justify-between text-sm text-slate-800 px-2 py-1">
                           <span>Manutenção Mensal</span>
                           <span className="font-medium">25.000,00 MTn</span>
                         </div>
                       </div>
                       
                       <div className="flex justify-end pt-4 border-t border-slate-100">
                         <div className="text-right">
                           <div className="text-xs text-slate-500 mb-1">TOTAL GERAL</div>
                           <div className="text-lg font-bold text-slate-900">175.000,00 MTn</div>
                         </div>
                       </div>
                     </div>
                   </div>
                </div>
              </div>

              {/* Block 2 */}
              <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
                <div className="flex-1 space-y-6">
                  <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Envie propostas por WhatsApp em 1 clique.</h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    Não perca tempo a anexar ficheiros pesados. O sistema gera um link seguro e abre o WhatsApp com uma mensagem profissional pronta a enviar.
                  </p>
                </div>
                <div className="flex-1 w-full relative">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 max-w-sm mx-auto">
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                      <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                          <Share2 size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">Partilhar Proposta</div>
                          <div className="text-xs text-slate-500">Tech Solutions, Lda</div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 border border-slate-100 rounded-md p-3 mb-4 text-xs text-slate-600 font-medium">
                        "Olá! Segue o link para a proposta comercial conforme solicitado: https://proforma360... Qualquer dúvida, estou à disposição."
                      </div>
                      
                      <button className="w-full py-2.5 bg-[#25D366] text-white rounded-md text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-[#20bd5a] transition-colors">
                        Enviar via WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Block 3 */}
              <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                <div className="flex-1 space-y-6">
                  <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-slate-900" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Mobile Nativo. Trabalhe em movimento.</h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    Instale a aplicação no telemóvel e tenha acesso instantâneo ao seu CRM. O layout adapta-se para permitir que feche negócios mesmo no trânsito.
                  </p>
                </div>
                <div className="flex-1 w-full flex justify-center">
                   <RealMobileMockup />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PIPELINE SHOWCASE (DARK) */}
        <section id="pipeline" className="py-24 bg-slate-950 text-white overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-px bg-slate-800"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
                Controle negociações num único workspace.
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium">
                O Pipeline visual permite que acompanhe prazos, não perca follow-ups e feche mais oportunidades comerciais.
              </p>
            </div>
            
            <RealDarkPipelineMockup />
          </div>
          <div className="absolute bottom-0 inset-x-0 h-px bg-slate-900"></div>
        </section>

        {/* TRUST / BYOS */}
        <section className="py-24 bg-[#FAFAFA] border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                Os seus dados pertencem à sua empresa.
              </h2>
              <p className="text-lg text-slate-600 font-medium">
                Esqueça o aprisionamento (vendor lock-in) dos CRMs tradicionais. Construímos uma infraestrutura segura baseada em privacidade e controlo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <Zap className="w-8 h-8 text-slate-900 mb-6" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Offline-First Genuíno</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  Funciona de forma totalmente offline. Todas as alterações são sincronizadas quando a ligação for restabelecida, garantindo operação contínua.
                </p>
              </div>
              
              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <Cloud className="w-8 h-8 text-slate-900 mb-6" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Backup no Google Drive</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  A base de dados é encriptada e guardada como um ficheiro fechado unicamente na sua própria conta Google Drive. 
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <Database className="w-8 h-8 text-slate-900 mb-6" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Sem Servidores Centrais</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  Nós não temos acesso, não lemos nem vendemos as suas informações. Total privacidade para os dados dos seus clientes e propostas financeiras.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="precos" className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                Transparência total.
              </h2>
              <p className="text-lg text-slate-600 font-medium">
                Pricing honesto e direto para suportar a sua operação.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Free Plan */}
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Free</h3>
                <p className="text-slate-500 text-sm mb-6 font-medium">Operação inicial para freelancers.</p>
                <div className="mb-8">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">0 MTn</span>
                  <span className="text-slate-500 font-medium">/mês</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-slate-400" /> Até 3 propostas/mês</li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-slate-400" /> Gestão de Clientes e Produtos</li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-slate-400" /> Pipeline Comercial Ativo</li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-slate-400" /> Funcionalidade Offline-First</li>
                </ul>
                <Link href="/login" className="w-full py-2.5 bg-white border border-slate-200 text-slate-900 rounded-lg text-center font-bold hover:bg-slate-50 transition-colors shadow-sm">
                  Começar Grátis
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                <p className="text-slate-400 text-sm mb-6 font-medium">Capacidade ilimitada para empresas.</p>
                <div className="mb-8">
                  <span className="text-4xl font-bold tracking-tight text-white">À Medida</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-300"><CheckCircle2 size={18} className="text-teal-500" /> Propostas ilimitadas</li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-300"><CheckCircle2 size={18} className="text-teal-500" /> Remover Branding Proforma360</li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-300"><CheckCircle2 size={18} className="text-teal-500" /> Exportação de PDFs Personalizados</li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-300"><CheckCircle2 size={18} className="text-teal-500" /> Suporte Dedicado</li>
                </ul>
                <Link href="/login" className="w-full py-2.5 bg-white text-slate-900 rounded-lg text-center font-bold hover:bg-slate-100 transition-colors shadow-sm">
                  Solicitar Ampliação
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 bg-slate-50 border-t border-slate-200 text-center px-6">
           <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">
             Inicie a operação comercial hoje.
           </h2>
           <Link href="/login" className="inline-flex items-center justify-center px-8 py-3 bg-slate-900 text-white rounded-lg text-[15px] font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95">
             Entrar no Workspace
           </Link>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80">
            <img src="/icon.svg" alt="Logo" className="w-5 h-5 rounded grayscale" />
            <span className="text-[15px] font-bold text-slate-900 tracking-tight">Proforma360</span>
          </div>
          
          <div className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
            Offline-First Commercial Workspace
          </div>

          <div className="flex gap-5 text-[13px] font-medium text-slate-500">
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Termos</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacidade</Link>
            <Link href="/security" className="hover:text-slate-900 transition-colors">Segurança</Link>
            <Link href="/support" className="hover:text-slate-900 transition-colors">Suporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
