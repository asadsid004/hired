"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/client";
import {
  ChartHistogramIcon,
  Briefcase02Icon,
  StarIcon,
  ArrowRight01Icon,
  Tick01Icon,
  Bookmark02Icon,
  Message01Icon,
  CpuIcon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { StatCard } from "./stat-card";
import { SectionCard } from "./section-card";
import { PerformanceChart } from "./performance-chart";
import { JobCard, JobData } from "../jobs/job-card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

export const DashboardView = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await client.dashboard.get();
      if (!res.data || res.error)
        throw new Error("Failed to load dashboard data");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-md" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[600px] rounded-xl" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-muted-foreground flex min-h-[400px] items-center justify-center rounded-xl border border-dashed">
        <p>Error loading dashboard. Please try again later.</p>
      </div>
    );
  }

  const { jobs, interviews, practice } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium tracking-tight uppercase">
          Overview
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <SectionCard
            title="Job Applications"
            description="Your pipeline and matches."
          >
            {/* Top Row: 3 mini cards */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              <StatCard
                title="Total"
                value={jobs.total}
                icon={<HugeiconsIcon icon={Briefcase02Icon} strokeWidth={2} />}
                tooltip="All jobs fetched based on your preferences."
                className="p-4"
              />
              <StatCard
                title="Saved"
                value={jobs.saved}
                icon={<HugeiconsIcon icon={Bookmark02Icon} strokeWidth={2} />}
                tooltip="Jobs you have bookmarked for later."
                className="p-4"
              />
              <StatCard
                title="Applied"
                value={jobs.applied}
                icon={<HugeiconsIcon icon={Tick01Icon} strokeWidth={2} />}
                tooltip="Jobs you have submitted an application for."
                className="p-4"
              />
            </div>

            {/* Profile Matching Score */}
            <StatCard
              title="Avg Profile Match Score"
              value={
                Number(jobs.avgProfileMatch) > 0
                  ? `${Math.round(Number(jobs.avgProfileMatch) * 100)}%`
                  : "-"
              }
              icon={<HugeiconsIcon icon={StarIcon} strokeWidth={2} />}
              tooltip="The average AI-calculated relevance score comparing your resume to all jobs in your pipeline."
              className="bg-primary/5 border-primary/20 mb-6"
            />

            {/* Top 3 Matched Jobs */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-medium">Top 3 Matched Jobs</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 text-sm"
                >
                  <Link href="/jobs">
                    View All{" "}
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                      className="ml-1 h-4 w-4"
                    />
                  </Link>
                </Button>
              </div>

              {jobs.topMatches.length === 0 ? (
                <div className="text-muted-foreground flex h-32 items-center justify-center rounded-md border border-dashed text-sm">
                  No jobs matched yet.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {jobs.topMatches.map((job) => (
                    <JobCard key={job.id} job={job as JobData} compact />
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Performance"
            description="Your interview and practice trends."
          >
            {/* INTERVIEW STATS */}
            <div className="mb-2">
              <h4 className="text-muted-foreground mb-3 text-sm font-medium tracking-wider uppercase">
                Interviews
              </h4>
              <div className="mb-6 grid grid-cols-3 gap-4">
                <StatCard
                  title="Overall"
                  value={
                    interviews.avgOverall > 0
                      ? `${interviews.avgOverall}%`
                      : "-"
                  }
                  icon={
                    <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />
                  }
                  tooltip="Average overall score across your last 5 interviews."
                  className="p-4"
                />
                <StatCard
                  title="Technical"
                  value={
                    interviews.avgTechnical > 0
                      ? `${interviews.avgTechnical}%`
                      : "-"
                  }
                  icon={<HugeiconsIcon icon={CpuIcon} strokeWidth={2} />}
                  tooltip="Average technical proficiency score across your last 5 interviews."
                  className="p-4"
                />
                <StatCard
                  title="Comm."
                  value={
                    interviews.avgCommunication > 0
                      ? `${interviews.avgCommunication}%`
                      : "-"
                  }
                  icon={<HugeiconsIcon icon={Message01Icon} strokeWidth={2} />}
                  tooltip="Average communication and clarity score across your last 5 interviews."
                  className="p-4"
                />
              </div>

              {/* Interview Chart */}
              <div className="bg-muted/20 mb-8 rounded-lg border p-4">
                <p className="mb-4 text-sm font-medium">Last 5 Interviews</p>
                <PerformanceChart
                  data={interviews.chartData}
                  emptyMessage="Complete an interview to see performance trends."
                  lines={[
                    { key: "technical", name: "Technical", color: "#3b82f6" },
                    {
                      key: "communication",
                      name: "Communication",
                      color: "#10b981",
                    },
                  ]}
                />
              </div>
            </div>

            {/* PRACTICE STATS */}
            <div>
              <h4 className="text-muted-foreground mb-3 text-sm font-medium tracking-wider uppercase">
                Practice Sessions
              </h4>
              <div className="mb-6 grid grid-cols-2 gap-4">
                <StatCard
                  title="Avg Score"
                  value={practice.avgScore > 0 ? `${practice.avgScore}%` : "-"}
                  icon={
                    <HugeiconsIcon
                      icon={CheckmarkBadge01Icon}
                      strokeWidth={2}
                    />
                  }
                  tooltip="Average score percentage (correct answers out of total questions) across your last 5 practice sessions."
                  className="p-4"
                />
                <StatCard
                  title="Avg Accuracy"
                  value={
                    practice.avgAccuracy > 0 ? `${practice.avgAccuracy}%` : "-"
                  }
                  icon={
                    <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />
                  }
                  tooltip="Average accuracy percentage (correct answers out of attempted questions) across your last 5 practice sessions."
                  className="p-4"
                />
              </div>

              {/* Practice Chart */}
              <div className="bg-muted/20 rounded-lg border p-4">
                <p className="mb-4 text-sm font-medium">
                  Last 5 Practice Sessions
                </p>
                <PerformanceChart
                  data={practice.chartData}
                  emptyMessage="Complete a practice session to see accuracy trends."
                  lines={[
                    {
                      key: "accuracy",
                      name: "Accuracy (%)",
                      color: "var(--primary)",
                    },
                    { key: "score", name: "Score", color: "#f59e0b" },
                  ]}
                />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
