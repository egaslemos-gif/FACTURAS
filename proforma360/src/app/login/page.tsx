"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import Link from "next/link";

const testimonials = [
  {
    quote: "A gestão de proformas ficou muito mais intuitiva e ágil. O suporte offline é uma viragem de jogo para a nossa equipa no terreno.",
    name: "Canísio Arsénio",
    role: "CA Serviços e Consultoria Informatica"
  },
  {
    quote: "Finalmente uma ferramenta que entende a dinâmica do nosso negócio. A integração direta com o nosso Google Drive simplifica tudo.",
    name: "Roberto Carimo",
    role: "Nova Informatica"
  },
  {
    quote: "O Proforma360 elevou o nível de profissionalismo das nossas propostas. A rapidez com que as enviamos agora é o nosso maior diferencial.",
    name: "Egas Lemos",
    role: "CyberCode360"
  },
  {
    quote: "A clareza dos PDFs e a facilidade de criar propostas complexas poupa-nos horas de trabalho administrativo todas as semanas. Essencial!",
    name: "Leonardo Sozinho",
    role: "Portoquimica EI"
  },
  {
    quote: "A resiliência offline garante que a nossa operação nunca para. Emitimos propostas de qualquer lado, independentemente da internet.",
    name: "Prosperino Rodrigues",
    role: "Titanium"
  }
];

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000); // 8 segundos por slide (rotação razoavelmente lenta)
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Clear any stale NextAuth cookies to force a fresh OAuth flow
      document.cookie.split(";").forEach((c) => {
        const name = c.trim().split("=")[0];
        if (name.startsWith("next-auth") || name.startsWith("__Secure-next-auth")) {
          document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/`;
        }
      });
      // signIn with redirect to /dashboard and force account selection prompt
      await signIn("google", { callbackUrl: "/dashboard" }, { prompt: "select_account" });
    } catch (error) {
      console.error("Login failed", error);
      setIsLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-container-lowest)]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-white">
      {/* Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#042f2e] text-white flex-col justify-between p-12 relative overflow-hidden h-full">
        {/* Abstract background graphics */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full border-[40px] border-[#0d9488] blur-3xl"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[80%] h-[80%] rounded-full border-[60px] border-[#0d9488] blur-3xl"></div>
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-3 hover:opacity-90 transition-opacity w-fit cursor-pointer">
          <img src="/icon.svg" alt="Proforma360 Logo" className="w-10 h-10 shadow-sm rounded-md" />
          <span className="text-2xl font-bold tracking-tight">Proforma360</span>
        </Link>

        <div className="relative z-10 max-w-lg mb-10 min-h-[300px] flex flex-col justify-end">
          <div className="text-[var(--color-primary)] text-6xl font-serif leading-none mb-4">"</div>
          <div className="relative w-full h-[220px]">
            {testimonials.map((t, idx) => (
              <div 
                key={idx}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out flex flex-col ${
                  idx === currentTestimonialIndex 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 translate-x-8 pointer-events-none'
                }`}
              >
                <p className="text-xl sm:text-2xl font-medium leading-relaxed mb-8 flex-1 italic">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden flex-shrink-0 border-2 border-[var(--color-primary)]">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=1f2937&color=fff`} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{t.name}</div>
                    <div className="text-[var(--color-primary-fixed-dim)] text-sm">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Dots Indicator */}
          <div className="flex gap-2 mt-8 z-20">
            {testimonials.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentTestimonialIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === currentTestimonialIndex ? 'bg-[var(--color-primary)] w-8' : 'bg-white/30 hover:bg-white/50 w-2'
                }`}
                aria-label={`Ir para testemunho ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 w-full lg:w-1/2 flex flex-col p-6 sm:p-8 lg:p-12 overflow-y-auto">
        
        <div className="w-full max-w-md mx-auto flex flex-col my-auto gap-6 sm:gap-8">
          {/* Mobile logo (hidden on desktop) */}
          <Link href="/" className="flex lg:hidden items-center justify-center gap-2.5 hover:opacity-80 transition-opacity w-fit mx-auto cursor-pointer">
            <img src="/icon.svg" alt="Proforma360 Logo" className="w-10 h-10 shadow-sm rounded-md" />
            <span className="text-2xl font-bold tracking-tight text-gray-900">Proforma360</span>
          </Link>

          {/* Main Login Card */}
          <div className="border border-gray-200 rounded-2xl p-8 sm:p-10 shadow-sm bg-white text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">Bem-vindo de volta</h1>
            <p className="text-gray-500 text-sm sm:text-base mb-10 leading-relaxed px-4">
              Faça login para aceder ao seu ambiente de trabalho seguro e offline-first.
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-800 rounded-xl font-semibold transition-all shadow-sm disabled:opacity-70 text-base"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span>Continuar com o Google</span>
            </button>
            
            <div className="mt-6 text-[12px] text-gray-400 leading-relaxed max-w-[280px] mx-auto">
              Ao entrar, criaremos um cofre local seguro utilizando o seu Google Drive (BYOS).
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-gray-400 font-medium pb-2 flex-none">
          <Link href="/security" className="hover:text-gray-900 transition-colors">Segurança</Link>
          <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacidade</Link>
          <Link href="/terms" className="hover:text-gray-900 transition-colors">Termos</Link>
          <Link href="/support" className="hover:text-gray-900 transition-colors">Suporte</Link>
        </div>
      </div>
    </div>
  );
}
