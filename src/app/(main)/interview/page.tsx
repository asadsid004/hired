"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Add01Icon,
  ArrowRight01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/client";
import Image from "next/image";
import {
  DIFFICULTY_CONFIG,
  getRoleIcon,
  STATUS_CONFIG,
  TYPE_LABELS,
} from "@/constants/interview";

function ScoreRing({ score }: { score: number | null }) {
  if (score === null || score === undefined) return null;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="relative flex items-center justify-center"
        style={{ width: 48, height: 48 }}
      >
        <svg width="48" height="48" className="-rotate-90">
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            strokeWidth="4.3"
            className="stroke-muted-foreground/50"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4.5"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute font-semibold" style={{ color }}>
          {score}
        </span>
      </div>
      <span className="text-muted-foreground pt-1 text-xs tracking-wide uppercase">
        Score
      </span>
    </div>
  );
}

export default function MockInterviewPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const {
    data: interviews,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["interviews"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const res = await client.interview.sessions.get();
      if (!res.data) throw new Error("Failed to load interviews");
      return res.data;
    },
  });

  const allInterviews = interviews || [];

  let filteredInterviews = allInterviews;
  if (search.trim()) {
    const s = search.toLowerCase();
    filteredInterviews = allInterviews.filter(
      (interview) =>
        (interview.jobRole && interview.jobRole.toLowerCase().includes(s)) ||
        (interview.jobDescription &&
          interview.jobDescription.toLowerCase().includes(s)) ||
        (interview.job?.company &&
          interview.job.company.toLowerCase().includes(s)),
    );
  }

  return (
    <div className="w-full space-y-6 py-4">
      <div className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-[60px] z-40 -mx-1 flex flex-col gap-4 px-1 py-2 backdrop-blur md:flex-row md:items-center">
        <div className="flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium tracking-tight uppercase">
              Interviews
            </h1>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="text-muted-foreground"
              strokeWidth={2.5}
            />
          </div>
        </div>

        <div className="relative ml-auto flex w-full gap-2 md:max-w-md">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <HugeiconsIcon
                icon={Search01Icon}
                className="text-muted-foreground h-4 w-4"
                strokeWidth={2}
              />
            </div>
            <input
              type="text"
              placeholder="Search past interviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border pr-3 pl-10 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Button
            size="lg"
            onClick={() => router.push("/interview/new")}
            className="shrink-0 cursor-pointer"
          >
            <span className="hidden sm:inline-block">New Interview</span>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-card animate-pulse space-y-4 rounded-xl border p-5"
            >
              <div className="flex items-start gap-3">
                <div className="bg-muted h-10 w-10 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="bg-muted h-4 w-3/4 rounded" />
                  <div className="bg-muted h-3 w-1/2 rounded" />
                </div>
              </div>
              <div className="bg-muted h-px" />
              <div className="flex gap-2">
                <div className="bg-muted h-5 w-16 rounded-full" />
                <div className="bg-muted h-5 w-20 rounded-full" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="bg-card text-destructive col-span-full rounded-xl border py-12 text-center">
            {(error as Error).message}
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div className="bg-card text-muted-foreground col-span-full rounded-xl border border-dashed py-12 text-center">
            No interviews found. Create one to get started!
          </div>
        ) : (
          filteredInterviews.map((interview) => {
            const statusCfg =
              STATUS_CONFIG[interview.status as keyof typeof STATUS_CONFIG] ??
              STATUS_CONFIG.in_progress;
            const diffCfg = interview.difficulty
              ? DIFFICULTY_CONFIG[
                  interview.difficulty as keyof typeof DIFFICULTY_CONFIG
                ]
              : null;
            const RoleIcon = getRoleIcon(interview.jobRole ?? interview.id);
            const typeLabel = interview.interviewType
              ? (TYPE_LABELS[interview.interviewType] ??
                interview.interviewType)
              : null;
            const duration = interview.durationMinutes
              ? `${interview.durationMinutes} min`
              : null;

            return (
              <div
                key={interview.id}
                onClick={() => router.push(`/interview/${interview.id}`)}
                className="group bg-card hover:border-primary/50 flex cursor-pointer flex-col gap-4 rounded-lg border p-5 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-muted border-border/50 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                    {interview.job?.companyLogo ? (
                      <Image
                        width={100}
                        height={100}
                        src={interview.job.companyLogo}
                        alt={interview.job.company}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <HugeiconsIcon
                        icon={RoleIcon}
                        className="text-muted-foreground h-10 w-10"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="group-hover:text-primary line-clamp-1 text-lg leading-snug font-semibold transition-colors">
                      {interview.jobRole || "Custom Role"}
                    </p>
                    {interview.jobId && (
                      <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">
                        {interview.job?.company ?? ""}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-1 text-sm">
                      {new Intl.DateTimeFormat("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(interview.createdAt))}
                      {" - "}
                      {new Intl.DateTimeFormat("en-IN", {
                        hour: "numeric",
                        minute: "numeric",
                      }).format(new Date(interview.createdAt))}
                    </p>
                  </div>

                  {interview.status === "completed" && (
                    <ScoreRing score={interview.score ?? null} />
                  )}
                </div>

                {/* Bottom chips row */}
                <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t-2 pt-4">
                  {/* Status */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>

                  {/* Interview type */}
                  {typeLabel && (
                    <span className="border-border inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                      {typeLabel}
                    </span>
                  )}

                  {/* Difficulty */}
                  {diffCfg && (
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${diffCfg.className}`}
                    >
                      {diffCfg.label}
                    </span>
                  )}

                  {/* Duration — pushed to the right */}
                  {duration && (
                    <span className="text-muted-foreground ml-auto inline-flex items-center text-xs font-medium tabular-nums">
                      {duration}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
