"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, FileText, Share2, Users, FileDown } from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navbar */}
      <header className="px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-xl fixed top-0 w-full z-50 transition-all border-b border-gray-100">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="Logo" className="w-8 h-8 rounded-md" />
          <div className="text-xl font-bold text-[#004ac6] tracking-tight">
            Proforma360
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-10 text-[14px] font-medium text-gray-600">
          <a href="#funcionalidades" className="hover:text-black transition-colors">Funcionalidades</a>
          <a href="#precos" className="hover:text-black transition-colors">Preços</a>
          <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-[14px] font-medium text-gray-600 hover:text-black transition-colors">
            Entrar
          </Link>
          <Link href="/login" className="px-5 py-2.5 bg-[#004ac6] text-white rounded-md text-[14px] font-medium hover:bg-[#003ea8] transition-colors shadow-sm">
            Começar Grátis
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 mt-[80px]">
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50/50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            🚀 VERSÃO 2.0 DISPONÍVEL
          </div>
          
          <h1 className="text-[48px] md:text-[64px] font-bold tracking-tight text-[#111827] max-w-4xl mb-6 leading-[1.1]">
            Faturas e Proformas Profissionais em <span className="text-[#004ac6]">Segundos</span>
          </h1>
          
          <p className="text-[18px] md:text-[20px] text-gray-500 max-w-2xl mb-12 leading-relaxed font-light">
            Otimize o fluxo de trabalho financeiro da sua empresa com ferramentas de precisão construídas para equipas rápidas. Gere, partilhe e monitorize proformas sem fricção.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
            <Link href="/login" className="w-full sm:w-auto px-8 py-3.5 bg-[#004ac6] hover:bg-[#003ea8] text-white rounded-md text-[15px] font-medium transition-all shadow-sm flex items-center justify-center gap-2">
              Começar Grátis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#precos" className="w-full sm:w-auto px-8 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-md text-[15px] font-medium transition-all shadow-sm flex items-center justify-center">
              Ver Preços
            </Link>
          </div>

          {/* Dashboard Mockup */}
          <div className="w-full max-w-5xl mx-auto rounded-[8px] border border-gray-200 bg-gray-50 p-2 shadow-2xl relative overflow-hidden">
             {/* Mac OS Window Controls Mock */}
             <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100/50 absolute top-0 w-full left-0 bg-white/50 z-10">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
             </div>
             <img 
               src="/dashboard_mockup.png" 
               alt="Proforma360 Dashboard Interface" 
               className="w-full h-auto rounded-[4px] object-cover mt-8"
               style={{ border: '1px solid rgba(0,0,0,0.05)' }}
             />
          </div>
        </section>

        {/* Features / Engineered for Velocity */}
        <section id="funcionalidades" className="bg-[#f8fafc] py-24 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-[32px] font-bold mb-4 text-[#111827]">Desenhado para Velocidade</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-[16px]">
                Tudo o que precisa para gerir proformas empresariais, despido de complexidade desnecessária.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: FileText,
                  title: "Gerar Proformas",
                  desc: "Crie faturas perfeitas e profissionais em segundos usando a nossa grelha de dados simplificada."
                },
                {
                  icon: FileDown,
                  title: "Exportar PDF",
                  desc: "Exportação a 1-clique para documentos PDF imutáveis e altamente profissionais, prontos para clientes."
                },
                {
                  icon: Share2,
                  title: "Partilha WhatsApp",
                  desc: "Envie proformas instantaneamente e de forma direta para os canais de comunicação preferidos dos seus clientes."
                },
                {
                  icon: Users,
                  title: "Gestão de Clientes",
                  desc: "Mantenha um repositório intocado de dados de clientes, históricos e estruturas de preços especializadas."
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-xl bg-white border border-gray-100 shadow-sm flex flex-col items-start transition-all hover:shadow-md">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-5">
                    <feature.icon className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <h3 className="text-[17px] font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-500 text-[14px] leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Transparent Pricing */}
        <section id="precos" className="bg-white py-24">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-[32px] font-bold mb-4 text-[#111827]">Preços Transparentes</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-[16px]">
                Escale as suas operações financeiras sem custos imprevisíveis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              
              {/* Free Tier */}
              <div className="p-8 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
                <p className="text-gray-500 text-sm mb-6">Para indivíduos a iniciar.</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-bold text-gray-900">0 MT</span>
                  <span className="text-gray-500 font-medium text-sm">/mês</span>
                </div>
                <div className="space-y-4 mb-8 flex-1">
                  {["Até 10 Proformas/mês", "Exportação Padrão PDF", "5 Clientes Máx"].map((b, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
                <Link href="/login" className="w-full py-2.5 rounded-md border border-gray-200 text-gray-900 font-medium text-sm text-center hover:bg-gray-50 transition-colors">
                  Começar Grátis
                </Link>
              </div>

              {/* Basic Tier (Highlighted) */}
              <div className="p-8 rounded-xl border-2 border-blue-600 bg-white shadow-lg relative flex flex-col md:-translate-y-4 z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-full">
                  Mais Popular
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Basic</h3>
                <p className="text-gray-500 text-sm mb-6">Para equipas profissionais em crescimento.</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-bold text-gray-900">2.500 MT</span>
                  <span className="text-gray-500 font-medium text-sm">/mês</span>
                </div>
                <div className="space-y-4 mb-8 flex-1">
                  {["Proformas Ilimitadas", "Branding & Marcas D'água", "Clientes Ilimitados", "Integração WhatsApp", "Backup Google Drive"].map((b, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
                <Link href="/login" className="w-full py-2.5 rounded-md bg-blue-600 text-white font-medium text-sm text-center hover:bg-blue-700 transition-colors shadow-sm">
                  Começar Teste Grátis
                </Link>
              </div>

              {/* Premium Tier */}
              <div className="p-8 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Premium</h3>
                <p className="text-gray-500 text-sm mb-6">Para operações empresariais.</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-bold text-gray-900">6.000 MT</span>
                  <span className="text-gray-500 font-medium text-sm">/mês</span>
                </div>
                <div className="space-y-4 mb-8 flex-1">
                  {["Tudo no Basic", "Acesso a API", "Painel de Análise Avançado", "Gestor de Conta Dedicado"].map((b, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-2.5 rounded-md border border-gray-200 text-gray-900 font-medium text-sm text-center hover:bg-gray-50 transition-colors">
                  Contactar Vendas
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-[#f8fafc] py-24 border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-[32px] font-bold mb-4 text-[#111827]">Perguntas Frequentes</h2>
            </div>

            <div className="space-y-4">
              {[
                { q: "Posso personalizar os layouts dos PDFs?", a: "Sim, os planos Basic e Premium permitem personalizar o logótipo, cores da marca e texto do rodapé." },
                { q: "Os meus dados financeiros estão seguros?", a: "Absolutamente. Graças à nossa arquitetura BYOS (Bring Your Own Storage), os seus dados nunca tocam nos nossos servidores. São alojados exclusivamente no seu Google Drive pessoal/empresarial." },
                { q: "Como funciona a partilha por WhatsApp?", a: "A plataforma gera um link seguro e formata uma mensagem otimizada que abre diretamente no seu WhatsApp Web ou Mobile, pronto a enviar ao cliente." }
              ].map((faq, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 shadow-sm">
                  <button 
                    onClick={() => toggleFaq(i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left font-medium text-gray-900 focus:outline-none"
                  >
                    {faq.q}
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <div 
                    className={`px-6 text-gray-600 text-sm leading-relaxed overflow-hidden transition-all duration-300 ${openFaq === i ? 'pb-4 max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center text-[13px] text-gray-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-medium">© {new Date().getFullYear()} Proforma360. Precisão em Finanças.</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-900 transition-colors">Termos de Serviço</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Política de Privacidade</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Segurança</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Suporte ao Cliente</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
