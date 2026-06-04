"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
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
          <div className="w-10 h-10 bg-[var(--color-primary)] rounded-md flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">Proforma360</span>
        </Link>

        <div className="relative z-10 max-w-lg mb-10">
          <div className="text-[var(--color-primary)] text-6xl font-serif leading-none mb-4">"</div>
          <p className="text-2xl font-medium leading-relaxed mb-8">
            "O Proforma360 transformou fundamentalmente as nossas operações financeiras. A velocidade e clareza que traz aos fluxos de trabalho de faturação são incomparáveis no espaço corporativo."
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
              <img src="https://ui-avatars.com/api/?name=Alexander+Vance&background=1f2937&color=fff" alt="Alexander Vance" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-semibold">Alexander Vance</div>
              <div className="text-[var(--color-primary-fixed-dim)] text-sm">CFO, Apex Global Logistics</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 w-full lg:w-1/2 flex flex-col p-6 sm:p-8 lg:p-12 overflow-y-auto">
        
        {/* Mobile logo (hidden on desktop) */}
        <Link href="/" className="flex lg:hidden items-center justify-center gap-3 mb-4 hover:opacity-80 transition-opacity w-fit mx-auto cursor-pointer flex-none">
          <div className="w-10 h-10 bg-[var(--color-primary)] rounded-md flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900">Proforma360</span>
        </Link>

        {/* Empty space for vertical centering */}
        <div className="hidden lg:block"></div>

        {/* Main Login Card */}
        <div className="w-full max-w-md mx-auto flex flex-col my-auto">
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
