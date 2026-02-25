"use client";

import React from "react";
import { ResumeAnalysis } from "@/lib/ai/schemas/resume.schema";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartBarLineIcon,
  Tick01Icon,
  Alert01Icon,
  InformationCircleIcon,
  Alert02Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  MagicWand01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface ResumeAnalysisTabProps {
  analysis?: ResumeAnalysis | null;
  onOptimizeClick: () => void;
}

function ScoreRing({
  score,
  size = "lg",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  let colorClass = "text-emerald-500";
  let bgClass = "text-emerald-500/10 dark:text-emerald-500/20";
  let textClass = "text-emerald-600 dark:text-emerald-400";

  if (score < 50) {
    colorClass = "text-destructive";
    bgClass = "text-destructive/10 dark:text-destructive/20";
    textClass = "text-destructive font-bold";
  } else if (score < 75) {
    colorClass = "text-amber-500";
    bgClass = "text-amber-500/10 dark:text-amber-500/20";
    textClass = "text-amber-600 dark:text-amber-400 font-bold";
  }

  const dimensions = {
    sm: "h-12 w-12 text-sm",
    md: "h-20 w-20 text-xl",
    lg: "h-32 w-32 text-4xl",
  };

  return (
    <div
      className={`relative ${dimensions[size].split(" ").slice(0, 2).join(" ")}`}
    >
      <svg className="h-full w-full" viewBox="0 0 36 36">
        <path
          className={bgClass}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth={size === "sm" ? "4" : "3.5"}
        />
        <path
          className={colorClass}
          strokeDasharray={`${score}, 100`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth={size === "sm" ? "4" : "3.5"}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`${dimensions[size].split(" ").slice(-1)[0]} font-bold ${textClass}`}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

export function ResumeAnalysisTab({
  analysis,
  onOptimizeClick,
}: ResumeAnalysisTabProps) {
  if (!analysis) {
    return (
      <div className="bg-card flex min-h-[400px] flex-col items-center justify-center rounded-xl border p-8 shadow-sm">
        <HugeiconsIcon
          icon={ChartBarLineIcon}
          className="text-muted-foreground/30 mb-4 h-16 w-16"
        />
        <h3 className="mb-2 text-xl font-bold">No Analysis Available</h3>
        <p className="text-muted-foreground mb-6 max-w-md text-center">
          We haven&apos;t analyzed this resume yet. Run the optimization process
          to get detailed ATS scoring, section feedback, and semantic
          improvements to help you land more interviews.
        </p>
        <button
          onClick={onOptimizeClick}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 font-medium transition-colors"
        >
          Optimize Resume Now
        </button>
      </div>
    );
  }

  const { overall, ats, section, semantic } = analysis;

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="bg-card flex flex-col items-center justify-center rounded-xl border p-6 shadow-sm">
          <h3 className="text-muted-foreground mb-4 text-sm font-bold tracking-wider uppercase">
            Overall Score
          </h3>
          <ScoreRing score={overall} size="lg" />
        </div>

        <div className="bg-card col-span-3 flex flex-col justify-center rounded-xl border p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold">Category Breakdown</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <ScoreRing score={ats.score} size="md" />
              <span className="text-sm font-semibold">ATS Compatibility</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <ScoreRing score={section.score} size="md" />
              <span className="text-sm font-semibold">
                Section Completeness
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <ScoreRing score={semantic.score} size="md" />
              <span className="text-sm font-semibold">Semantic Impact</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* ATS Analysis Details */}
        <section className="bg-card rounded-xl border p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              className="h-5 w-5 text-blue-500"
            />
            ATS Insights
          </h3>

          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="border-b pb-2 text-sm font-semibold">
                Key Strengths
              </h4>
              {ats.strengths.length > 0 ? (
                <ul className="space-y-2">
                  {ats.strengths.map((strength, idx) => (
                    <li
                      key={idx}
                      className="text-muted-foreground flex items-start gap-2 text-sm"
                    >
                      <HugeiconsIcon
                        icon={Tick01Icon}
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                      />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No specific strengths highlighted.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="border-b pb-2 text-sm font-semibold">
                Priority Issues
              </h4>
              {ats.issues.length > 0 ? (
                <div className="space-y-4">
                  {ats.issues.map((issue, idx) => {
                    const isCritical = issue.severity === "critical";
                    const isWarning = issue.severity === "warning";
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "rounded-lg border p-4",
                          isCritical
                            ? "border-red-500/20 bg-red-500/5"
                            : isWarning
                              ? "border-amber-500/20 bg-amber-500/5"
                              : "border-blue-500/20 bg-blue-500/5",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <HugeiconsIcon
                            icon={
                              isCritical
                                ? Alert02Icon
                                : isWarning
                                  ? Alert01Icon
                                  : InformationCircleIcon
                            }
                            className={cn(
                              "mt-0.5 h-5 w-5 shrink-0",
                              isCritical
                                ? "text-red-500"
                                : isWarning
                                  ? "text-amber-500"
                                  : "text-blue-500",
                            )}
                          />
                          <div>
                            <span className="mb-1 block text-xs font-bold tracking-wider uppercase opacity-70">
                              {issue.category} • {issue.severity}
                            </span>
                            <p className="mb-1 text-sm font-medium">
                              {issue.message}
                            </p>
                            <p className="text-sm opacity-80">
                              {issue.suggestion}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <HugeiconsIcon icon={Tick01Icon} className="h-4 w-4" />
                  No major ATS parsing issues detected!
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section Analysis Details */}
        <section className="bg-card rounded-xl border p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <HugeiconsIcon
              icon={ChartBarLineIcon}
              className="h-5 w-5 text-indigo-500"
            />
            Section Analysis
          </h3>

          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="border-b pb-2 text-sm font-semibold">
                Missing/Weak Sections
              </h4>
              {section.missing.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {section.missing.map((ms, idx) => (
                    <div
                      key={idx}
                      className="bg-muted/30 border-muted flex flex-col gap-1 rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{ms.name}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            ms.importance === "critical"
                              ? "bg-red-500/10 text-red-500"
                              : ms.importance === "recommended"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-blue-500/10 text-blue-500",
                          )}
                        >
                          {ms.importance}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {ms.reason}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="flex items-center gap-2 text-sm text-emerald-600">
                  <HugeiconsIcon icon={Tick01Icon} className="h-4 w-4" /> All
                  critical sections are present.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="border-b pb-2 text-sm font-semibold">
                Feedback on Existing Sections
              </h4>
              {section.present.length > 0 ? (
                <div className="space-y-3">
                  {section.present
                    .filter((s) => s.quality !== "excellent")
                    .map((ps, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {ps.name}
                          </span>
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-xs font-medium",
                              ps.quality === "good"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : ps.quality === "average"
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {ps.quality}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {ps.feedback}
                        </p>
                      </div>
                    ))}
                  {section.present.filter((s) => s.quality === "excellent")
                    .length > 0 && (
                    <p className="text-muted-foreground mt-4 text-xs italic">
                      Other sections are marked as excellent.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No section data
                </p>
              )}
            </div>

            {section.suggestions.length > 0 && (
              <div className="space-y-2 border-t pt-2">
                <h5 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  General Suggestions
                </h5>
                <ul className="space-y-1">
                  {section.suggestions.map((sug, idx) => (
                    <li
                      key={idx}
                      className="text-muted-foreground flex items-start gap-2 text-sm"
                    >
                      <span className="mt-0.5 text-lg leading-none text-indigo-400">
                        •
                      </span>{" "}
                      {sug}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Semantic Improvements */}
      <section className="bg-card rounded-xl border p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-end">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <HugeiconsIcon
                icon={MagicWand01Icon}
                className="h-5 w-5 text-purple-500"
              />
              Content Impact & Semantic Analysis
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              How recruiters and hiring algorithms interpret the meaning and
              strength of your bullet points.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <span className="block text-xl font-bold text-purple-600 dark:text-purple-400">
                {semantic.clarity.score}
              </span>
              <span className="text-muted-foreground text-xs font-medium uppercase">
                Clarity
              </span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-bold text-purple-600 dark:text-purple-400">
                {semantic.impact.score}
              </span>
              <span className="text-muted-foreground text-xs font-medium uppercase">
                Impact
              </span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-bold text-purple-600 dark:text-purple-400">
                {semantic.relevance.score}
              </span>
              <span className="text-muted-foreground text-xs font-medium uppercase">
                Relevance
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {semantic.keywordGaps.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-semibold">
                Suggested Power Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {semantic.keywordGaps.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {semantic.improvements.length > 0 && (
            <div>
              <h4 className="mb-4 text-sm font-semibold">
                Recommended Revisions
              </h4>
              <div className="space-y-4">
                {semantic.improvements.map((imp, idx) => (
                  <div
                    key={idx}
                    className="bg-muted/10 relative grid grid-cols-1 gap-4 rounded-xl border p-4 md:grid-cols-2"
                  >
                    <div className="bg-card absolute top-1/2 left-1/2 z-10 -mt-3 -ml-3 hidden h-8 w-8 items-center justify-center rounded-full border shadow-sm md:flex">
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        className="text-muted-foreground h-4 w-4"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="text-destructive bg-destructive/10 inline-block rounded px-2 py-0.5 text-xs font-bold tracking-widest uppercase">
                        Before ({imp.section})
                      </span>
                      <p className="text-muted-foreground bg-destructive/5 border-destructive/10 rounded-md border p-2 text-sm line-through opacity-70">
                        {imp.current}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="inline-block rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold tracking-widest text-emerald-600 uppercase">
                        Suggested
                      </span>
                      <p className="rounded-md border border-emerald-500/10 bg-emerald-500/5 p-2 text-sm font-medium">
                        {imp.suggested}
                      </p>
                    </div>

                    <div className="mt-2 border-t pt-2 md:col-span-2">
                      <p className="text-foreground/80 text-sm">
                        <span className="text-foreground font-medium">
                          Why:{" "}
                        </span>
                        {imp.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
