"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  FileText, 
  Users, 
  Send, 
  Cloud, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Rocket,
  Package,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOUR_STORAGE_KEY = "proforma360_tour_completed";

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    icon: Sparkles,
    title: "Bem-vindo ao Proforma360!",
    description: "A sua plataforma profissional para criar cotações, gerir clientes e acompanhar o seu negócio — tudo num só lugar.",
    tip: "Funciona offline no telemóvel e no computador.",
    color: "from-blue-600 to-indigo-700",
    iconBg: "bg-blue-100 text-blue-600",
    illustration: "🚀",
  },
  {
    icon: FileText,
    title: "Crie Proformas Profissionais",
    description: "Crie cotações elegantes em segundos. Adicione itens, defina preços, aplique descontos e IVA automaticamente.",
    tip: "Dica: Use o botão '+' azul para criar a sua primeira proforma.",
    color: "from-emerald-600 to-teal-700",
    iconBg: "bg-emerald-100 text-emerald-600",
    illustration: "📄",
  },
  {
    icon: Users,
    title: "Gestão de Clientes & Produtos",
    description: "Mantenha uma base de dados organizada dos seus clientes e produtos. Ao criar proformas, os dados são preenchidos automaticamente.",
    tip: "Os clientes são guardados automaticamente ao criar uma proforma.",
    color: "from-purple-600 to-violet-700",
    iconBg: "bg-purple-100 text-purple-600",
    illustration: "👥",
  },
  {
    icon: Send,
    title: "Partilhe com Um Clique",
    description: "Envie propostas profissionais por WhatsApp, Email ou Link direto. O seu cliente recebe uma página elegante para visualizar e descarregar o PDF.",
    tip: "Use o botão 'Partilhar' em qualquer proforma para enviar ao cliente.",
    color: "from-orange-500 to-red-600",
    iconBg: "bg-orange-100 text-orange-600",
    illustration: "📲",
  },
  {
    icon: Cloud,
    title: "Backup Seguro na Cloud",
    description: "Os seus dados são guardados localmente e pode fazer backup automático no Google Drive. Nunca perca uma cotação.",
    tip: "Clique em 'Sync' no topo da página para guardar os seus dados na cloud.",
    color: "from-cyan-600 to-blue-700",
    iconBg: "bg-cyan-100 text-cyan-600",
    illustration: "☁️",
  },
];

export default function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoOpen, setIsAutoOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Auto-open on first visit
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Small delay for smooth entrance after dashboard loads
      const timer = setTimeout(() => {
        setIsAutoOpen(true);
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle manual open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsVisible(true);
    }
  }, [isOpen]);

  const shouldShow = isVisible || isAutoOpen;

  if (!shouldShow) return null;

  const handleClose = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsVisible(false);
    setIsAutoOpen(false);
    setCurrentStep(0);
    onClose();
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={handleClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Section with Gradient */}
        <div className={cn("relative px-8 pt-12 pb-10 bg-gradient-to-br text-white text-center overflow-hidden", step.color)}>
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-8 w-20 h-20 border-2 border-white rounded-full" />
            <div className="absolute bottom-6 right-10 w-14 h-14 border-2 border-white rounded-lg rotate-45" />
            <div className="absolute top-10 right-20 w-6 h-6 bg-white rounded-full" />
            <div className="absolute bottom-12 left-16 w-4 h-4 bg-white rounded-full" />
          </div>
          
          {/* Icon */}
          <div className="relative">
            <div className="text-6xl mb-5 animate-bounce" style={{ animationDuration: "2s" }}>
              {step.illustration}
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">{step.title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 flex-1">
          <p className="text-gray-600 text-[15px] leading-relaxed mb-4">
            {step.description}
          </p>
          
          {/* Tip Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2.5">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", step.iconBg)}>
              <StepIcon className="w-4 h-4" />
            </div>
            <p className="text-sm text-blue-800 font-medium leading-snug">
              {step.tip}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 pt-2">
          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 mb-5">
            {TOUR_STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "transition-all duration-300 rounded-full",
                  index === currentStep 
                    ? "w-8 h-2.5 bg-blue-600" 
                    : index < currentStep
                      ? "w-2.5 h-2.5 bg-blue-300 hover:bg-blue-400"
                      : "w-2.5 h-2.5 bg-gray-200 hover:bg-gray-300"
                )}
                aria-label={`Passo ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            {!isFirst ? (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Saltar
              </button>
            )}

            <button
              onClick={handleNext}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-sm",
                isLast
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-200"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {isLast ? (
                <>
                  <Rocket className="w-4 h-4" />
                  Começar a Usar!
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Step Counter */}
          <p className="text-center text-xs text-gray-400 mt-3">
            {currentStep + 1} de {TOUR_STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
