"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Sparkles,
  FileText,
  Building2,
  BookOpen,
  ChevronRight,
  X,
} from "lucide-react";

const TOUR_KEY = "bidcraft_tour_completed";

interface TourStep {
  title: string;
  description: string;
  icon: typeof Upload;
  action?: string;
  href?: string;
}

const steps: TourStep[] = [
  {
    title: "Welcome to BidCraft",
    description:
      "BidCraft uses AI to help you respond to RFPs faster and win more contracts. Let's walk through the key features.",
    icon: Sparkles,
  },
  {
    title: "Upload Your RFP",
    description:
      "Start by uploading an RFP document (PDF, DOCX, or TXT). Our AI will extract every question and categorize them automatically.",
    icon: Upload,
    action: "Upload RFP",
    href: "/",
  },
  {
    title: "Set Up Company Profile",
    description:
      "Add your company info, certifications, and past projects. This helps the AI generate tailored, accurate responses specific to your organization.",
    icon: Building2,
    action: "Set Up Profile",
    href: "/profile",
  },
  {
    title: "Build Your Knowledge Base",
    description:
      "Add past responses and boilerplate text. The AI references these when generating new answers, ensuring consistency across proposals.",
    icon: BookOpen,
    action: "View Knowledge Base",
    href: "/knowledge-base",
  },
  {
    title: "Generate & Export",
    description:
      "Generate AI responses for each question, review and edit them, then export a polished Word document ready for submission.",
    icon: FileText,
  },
];

export default function OnboardingTour() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem(TOUR_KEY, "true");
  };

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const goToAction = () => {
    const step = steps[currentStep];
    if (step.href) {
      dismiss();
      router.push(step.href);
    }
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#12182B] shadow-2xl overflow-hidden"
        style={{ animation: "fadeIn 0.3s ease-out" }}
      >
        {/* Header gradient */}
        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-cyan-500 to-violet-500" />

        <div className="p-8">
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-6 bg-violet-400"
                    : i < currentStep
                    ? "w-3 bg-violet-400/40"
                    : "w-3 bg-white/10"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mb-5">
            <Icon className="w-7 h-7 text-violet-400" />
          </div>

          {/* Content */}
          <h2 className="text-xl font-bold mb-3">{step.title}</h2>
          <p className="text-sm text-white/50 leading-relaxed mb-8">
            {step.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={dismiss}
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {step.action && step.href && (
                <button
                  onClick={goToAction}
                  className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm hover:bg-white/[0.1] transition-colors"
                >
                  {step.action}
                </button>
              )}
              <button
                onClick={next}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-sm font-medium transition-colors"
              >
                {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Call this to restart the tour
export function resetOnboardingTour() {
  localStorage.removeItem(TOUR_KEY);
  window.location.reload();
}
