"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  title: string;
  subtitle?: string;
  progress: number;
  step: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  canGoNext?: boolean;
  loading?: boolean;
  showBack?: boolean;
}

export function WizardShell({
  children,
  title,
  subtitle,
  progress,
  step,
  totalSteps,
  onBack,
  onNext,
  nextLabel = "Continuar",
  canGoNext = true,
  loading = false,
  showBack = true,
}: Props) {
  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC] flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-[#161B22] sticky top-0 z-50">
        <div
          className="h-full bg-gradient-to-r from-[#3B82F6] to-[#F97316] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="border-b border-[#30363D]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#F97316] flex items-center justify-center font-bold text-white text-sm">A</div>
            <span className="font-bold">Arranca</span>
          </div>
          <div className="text-sm text-[#8B949E]">
            Paso {step} de {totalSteps}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full px-6 py-12">
        <div className="animate-[fadeUp_0.4s_ease-out]">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight">{title}</h1>
          {subtitle && <p className="text-[#8B949E] text-lg mb-10">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>

      {/* Footer nav */}
      <div className="border-t border-[#30363D] bg-[#0D1117] sticky bottom-0">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          {showBack ? (
            <button
              onClick={onBack}
              disabled={!onBack || loading}
              className="flex items-center gap-2 text-[#8B949E] hover:text-[#F0F6FC] px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onNext}
            disabled={!canGoNext || loading}
            className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-semibold px-8 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {nextLabel}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OptionCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected?: boolean;
  onClick: () => void;
  icon?: string | ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
        selected
          ? "border-[#3B82F6] bg-[#3B82F6]/10"
          : "border-[#30363D] bg-[#161B22] hover:border-[#8B949E]"
      }`}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className="text-3xl">
            {typeof icon === "string" ? icon : icon}
          </div>
        )}
        <div className="flex-1">
          <div className="font-semibold text-lg">{title}</div>
          {description && <div className="text-sm text-[#8B949E] mt-1">{description}</div>}
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
            selected ? "border-[#3B82F6] bg-[#3B82F6]" : "border-[#30363D]"
          }`}
        >
          {selected && <div className="w-full h-full rounded-full bg-white scale-50" />}
        </div>
      </div>
    </button>
  );
}
