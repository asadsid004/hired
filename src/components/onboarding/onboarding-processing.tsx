"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { client } from "@/lib/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick01Icon,
  Loading03Icon,
  FileSearchIcon,
  AiSearchIcon,
  SearchAreaIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "extracting" as const,
    label: "Extracting Resume",
    description: "Parsing and extracting data from your resume",
    icon: FileSearchIcon,
  },
  {
    id: "analyzing" as const,
    label: "AI Analysis",
    description: "Understanding your skills and experience",
    icon: AiSearchIcon,
  },
  {
    id: "searching" as const,
    label: "Finding Jobs",
    description: "Searching for jobs that match your profile",
    icon: SearchAreaIcon,
  },
  {
    id: "matching" as const,
    label: "Scoring Matches",
    description: "Computing relevance scores for each job",
    icon: Target01Icon,
  },
  {
    id: "finished" as const,
    label: "All Done!",
    description: "Your profile is ready",
    icon: Tick01Icon,
  },
];

type StepId = (typeof STEPS)[number]["id"];

function getStepIndex(stepId: StepId | null): number {
  if (!stepId) return -1;
  return STEPS.findIndex((s) => s.id === stepId);
}

export const OnboardingProcessing = ({ isOpen }: { isOpen: boolean }) => {
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const { data } = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: async () => {
      const res = await client.onboarding.status.get();
      if (res.error) throw res.error;
      return res.data;
    },
    refetchInterval: (query) => {
      const d = query.state.data;
      if (d === "finished") return false;
      return 3000;
    },
    enabled: isOpen,
  });

  const currentStep = data ?? "extracting";
  const currentStepIndex = getStepIndex(currentStep);
  const isFinished = data === "finished";

  useEffect(() => {
    if (isFinished) {
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isFinished]);

  useEffect(() => {
    if (shouldRedirect) {
      router.push("/jobs");
    }
  }, [shouldRedirect, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-background/80 absolute inset-0 backdrop-blur-md" />

      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="bg-card rounded-md border px-4 py-6 shadow-2xl">
          <div className="mb-4 text-center">
            <h2 className="text-xl font-semibold">Setting up your profile</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {isFinished
                ? "Redirecting to your dashboard..."
                : "This usually takes about a minute"}
            </p>
          </div>
          <div className="space-y-1">
            {STEPS.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-4 rounded-md px-4 py-3 transition-all duration-500",
                    isActive && "bg-primary/5 ring-primary/20 ring-1",
                    isCompleted && "opacity-90",
                    isPending && "opacity-70",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-500",
                      isCompleted && "bg-emerald-500/10 text-emerald-500",
                      isActive && "bg-primary/10 text-primary",
                      isPending && "bg-muted text-muted-foreground",
                    )}
                  >
                    {isCompleted ? (
                      <HugeiconsIcon
                        icon={Tick01Icon}
                        className="h-5 w-5"
                        strokeWidth={2.5}
                      />
                    ) : isActive ? (
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        className="h-5 w-5 animate-spin"
                        strokeWidth={2}
                      />
                    ) : (
                      <HugeiconsIcon
                        icon={step.icon}
                        className="h-5 w-5"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium transition-all duration-300",
                        isActive && "text-foreground",
                        isCompleted && "text-muted-foreground line-through",
                        isPending && "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </p>
                    {(isActive || isCompleted) && (
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {isActive ? step.description : "Completed"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom pulse indicator */}
          {!isFinished && (
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-1.5">
                <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
                <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:150ms]" />
                <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
