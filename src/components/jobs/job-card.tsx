"use client";

import type { ParsedJobDescription } from "@/lib/ai/schemas/job-description.schema";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { cn } from "@/lib/utils";
import {
  Bookmark02Icon,
  Location01Icon,
  Money01Icon,
  Clock01Icon,
  Briefcase02Icon,
  MoreVerticalCircle01Icon,
  Tick01Icon,
  UserEdit01Icon,
  House01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type JobData = {
  id: number;
  jobTitle: string;
  company: string;
  location: string | null;
  companyLogo?: string | null;
  datePosted?: string | Date | null;
  salaryString?: string | null;
  minAnnualSalaryUsd?: number | null;
  maxAnnualSalaryUsd?: number | null;
  seniority?: string | null;
  employmentStatuses?: string[] | null;
  remote?: boolean | null;
  hybrid?: boolean | null;
  companyIndustry?: string | null;
  url: string;
  tailoredResumeId?: string | null;
  parsedDescription?: ParsedJobDescription | null;
  userJobRecord: {
    status: "new" | "viewed" | "saved" | "applied" | "hidden" | "rejected";
    relevanceScore: string | null | number;
  };
};

export const JobCard = ({
  job,
  compact = false,
}: {
  job: JobData;
  compact?: boolean;
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [creating, setCreating] = useState<"interview" | "practice" | null>(
    null,
  );

  const updateStatus = useMutation({
    mutationFn: async (newStatus: JobData["userJobRecord"]["status"]) => {
      const res = await client.jobs({ id: String(job.id) }).status.patch({
        status: newStatus,
      });

      if (res.error)
        throw new Error(
          (res.error.value as string) ?? "Failed to update status",
        );

      return {
        id: job.id,
        status: newStatus,
      };
    },

    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ["jobs"] });

      const previousJobs = queryClient.getQueryData<JobData[]>(["jobs"]);

      queryClient.setQueryData<JobData[]>(["jobs"], (old) =>
        old?.map((j) =>
          j.id === job.id
            ? {
                ...j,
                userJobRecord: {
                  ...j.userJobRecord,
                  status: newStatus,
                },
              }
            : j,
        ),
      );

      return { previousJobs };
    },

    onError: (_err, _newStatus, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(["jobs"], context.previousJobs);
      }
    },
  });

  const isSaved = job.userJobRecord.status === "saved";
  const isApplied = job.userJobRecord.status === "applied";
  const hasTailored = !!job.tailoredResumeId;

  const tailorMutation = useMutation({
    mutationFn: async () => {
      const res = await client.resume.create.post({
        jobTitle: job.jobTitle,
        jobDescription: `${job.jobTitle} at ${job.company}`,
        jobId: job.id,
        fileName: `${job.jobTitle} - ${job.company}`,
      });
      if (res.error) throw new Error("Failed to tailor resume");
      return res.data;
    },
    onSuccess: () => {
      toast.success(hasTailored ? "Resume re-tailored!" : "Resume tailored!");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: () => {
      toast.error("Failed to tailor resume");
    },
  });

  const toggleSave = () => {
    updateStatus.mutate(isSaved ? "new" : "saved");
  };

  const markApplied = () => {
    updateStatus.mutate("applied");
  };

  const markUnapplied = () => {
    updateStatus.mutate("new");
  };

  const createPractice = async () => {
    setCreating("practice");
    try {
      const res = await client.practice.sessions.post({
        topics: [job.companyIndustry || job.jobTitle, job.company],
        difficulty: "medium",
        questionCount: 5,
        durationMinutes: 30,
      });

      if (res.data) {
        toast.success("Practice session created!");
        router.push(`/practice/session/${res.data.sessionId}`);
      } else {
        toast.error("Failed to start session.");
        setCreating(null);
      }
    } catch {
      toast.error("An error occurred.");
      setCreating(null);
    }
  };

  const simulateInterview = async () => {
    setCreating("interview");
    try {
      const res = await client.interview.sessions.post({
        jobId: job.id,
        jobRole: job.jobTitle,
        jobDescription: `${job.jobTitle} at ${job.company}`,
        interviewType: "technical",
        difficulty: "medium",
        durationMinutes: 30,
      });

      if (res.data) {
        toast.success("Interview session created!");
        router.push(`/interview/${res.data.interviewId}`);
      } else {
        toast.error("Failed to start session.");
        setCreating(null);
      }
    } catch {
      toast.error("An error occurred.");
      setCreating(null);
    }
  };

  const score =
    job.userJobRecord.relevanceScore != null
      ? Math.round(Number(job.userJobRecord.relevanceScore) * 100)
      : 0;

  const getDaysAgo = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const diffTime = Math.abs(new Date().getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  };

  const getWorkMode = () => {
    if (job.remote) return "Remote";
    if (job.hybrid) return "Hybrid";
    return "Onsite";
  };

  const formattedSalary =
    job.minAnnualSalaryUsd && job.maxAnnualSalaryUsd
      ? `$${Math.round(job.minAnnualSalaryUsd / 1000)}K/yr - $${Math.round(job.maxAnnualSalaryUsd / 1000)}K/yr`
      : job.salaryString || "Not specified";

  const getSeniority = () => {
    if (!job.seniority) return "Not specified";
    return job.seniority.charAt(0).toUpperCase() + job.seniority.slice(1);
  };

  const getEmploymentType = () => {
    if (job.employmentStatuses && job.employmentStatuses.length > 0) {
      const type = job.employmentStatuses[0].replace("_", " ");
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
    return "Full-time";
  };

  const scoreColor =
    score >= 80
      ? "border-l-emerald-500"
      : score >= 60
        ? "border-l-amber-500"
        : "border-l-muted-foreground/30";

  const scoreBgColor =
    score >= 80
      ? "bg-emerald-100/50 dark:bg-emerald-950/40"
      : score >= 60
        ? "bg-amber-100/50 dark:bg-amber-950/40"
        : "bg-red-100/50 dark:bg-red-950/40";

  const strokeColor =
    score >= 80
      ? "text-emerald-500"
      : score >= 60
        ? "text-amber-500"
        : "text-red-500";

  const strokeSecondaryColor =
    score >= 80
      ? "text-emerald-100/50"
      : score >= 60
        ? "text-amber-100/50"
        : "text-red-100/50";

  const borderColor =
    score >= 80
      ? "border-emerald-500/50"
      : score >= 60
        ? "border-amber-500/50"
        : "border-red-500/50";

  const techPills =
    job.parsedDescription?.techStack ??
    (job as unknown as { technologySlugs?: string[] }).technologySlugs ??
    [];

  return (
    <div
      className={cn(
        "bg-card flex flex-col gap-6 rounded-md border border-l-[3px] p-5 transition-all hover:shadow-md",
        compact ? "flex-col" : "md:flex-row",
        scoreColor,
      )}
    >
      <div className={cn("space-y-4", compact ? "w-full" : "flex-1")}>
        <div className="flex items-start gap-4">
          <div className="flex h-21 w-21 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">
            {job.companyLogo ? (
              <Image
                src={job.companyLogo}
                alt={job.company}
                className="h-full w-full object-contain p-1"
                width={100}
                height={100}
              />
            ) : (
              <HugeiconsIcon
                icon={House01Icon}
                className="text-muted-foreground"
                size={30}
                strokeWidth={2}
              />
            )}
          </div>
          <div>
            {job.datePosted && (
              <span className="mb-2 inline-block rounded bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {getDaysAgo(job.datePosted)}
              </span>
            )}
            <a href={`/jobs/${job.id}`} className="hover:underline">
              <h3 className="text-lg leading-tight font-semibold">
                {job.jobTitle}
              </h3>
            </a>
            <p className="text-muted-foreground mt-1 text-sm">
              {job.company}
              {job.companyIndustry && (
                <span className="mx-1.5 opacity-50">•</span>
              )}
              {job.companyIndustry && <span>{job.companyIndustry}</span>}
            </p>
          </div>
          {compact && (
            <div className="ml-auto flex shrink-0 items-center">
              <span
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-semibold",
                  scoreBgColor,
                  borderColor,
                  strokeColor,
                )}
              >
                <span className="block text-xl">{score}%</span>
                <span>Match</span>
              </span>
            </div>
          )}
        </div>

        {/* Details Grid */}
        {!compact && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-muted-foreground flex items-center gap-2">
              <HugeiconsIcon
                icon={Location01Icon}
                strokeWidth={2}
                className="h-4 w-4"
              />
              <span className="truncate">
                {job.location || "Location not provided"}
              </span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <HugeiconsIcon
                icon={Money01Icon}
                strokeWidth={2}
                className="h-4 w-4"
              />
              <span className="truncate">{formattedSalary}</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <HugeiconsIcon
                icon={UserEdit01Icon}
                strokeWidth={2}
                className="h-4 w-4"
              />
              <span>{getSeniority()}</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <HugeiconsIcon
                icon={Clock01Icon}
                strokeWidth={2}
                className="h-4 w-4"
              />
              <span>{getEmploymentType()}</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              <HugeiconsIcon
                icon={Briefcase02Icon}
                strokeWidth={2}
                className="h-4 w-4"
              />
              <span>{getWorkMode()}</span>
            </div>
          </div>
        )}

        {/* Tech Stack Pills */}
        {!compact && techPills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground text-sm font-medium">
              Technologies:
            </span>
            {techPills.slice(0, 9).map((tech) => (
              <span
                key={tech}
                className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-[0.8rem] font-medium"
              >
                {tech.replace(/-/g, " ")}
              </span>
            ))}
            {techPills.length > 9 && (
              <span className="text-muted-foreground text-[0.8rem]">
                +{techPills.length - 9} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right side: Score & Actions */}
      <div
        className={cn(
          "flex shrink-0 flex-col items-center justify-between border-t",
          compact
            ? "border-border/50 w-full flex-row items-center space-y-4 border-t pt-4"
            : "space-y-4 pt-4 sm:items-end md:w-56 md:border-t-0 md:border-l md:pt-0 md:pl-6",
        )}
      >
        {!compact && (
          <div
            className={`flex h-full w-full flex-col items-center justify-center rounded-md ${scoreBgColor} border ${borderColor} `}
          >
            <div className="relative h-18 w-18">
              <svg className="h-full w-full" viewBox="0 0 36 36">
                <path
                  className={`${strokeSecondaryColor}`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className={strokeColor}
                  strokeDasharray={`${score}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.3"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-semibold ${strokeColor}`}>
                  {score}%
                </span>
              </div>
            </div>
            <p className={`text-sm font-semibold uppercase ${strokeColor}`}>
              {score >= 80
                ? "Strong Match"
                : score >= 60
                  ? "Good Match"
                  : "Fair Match"}
            </p>
          </div>
        )}
        {/* Action Buttons */}
        <div
          className={cn(
            "flex w-full items-center gap-2",
            compact ? "mt-0" : "mt-auto",
          )}
        >
          {isApplied ? (
            <Button
              variant="outline"
              className="pointer-events-none flex-1 gap-2 border-emerald-100 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-800 dark:text-emerald-200"
              disabled
            >
              <HugeiconsIcon
                icon={Tick01Icon}
                strokeWidth={3}
                className="h-4 w-4"
              />
              Applied
            </Button>
          ) : (
            <Button variant="default" className="flex-1" asChild>
              <Link href={job.url} target="_blank" rel="noopener noreferrer">
                Apply Now
              </Link>
            </Button>
          )}

          <Button
            variant={isSaved ? "secondary" : "outline"}
            size="icon"
            onClick={toggleSave}
            title={isSaved ? "Unsave" : "Save Job"}
            disabled={isApplied}
          >
            <HugeiconsIcon
              icon={Bookmark02Icon}
              strokeWidth={isSaved ? 3 : 2}
              className={cn("h-4 w-4", isSaved && "fill-current")}
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <HugeiconsIcon
                  icon={MoreVerticalCircle01Icon}
                  strokeWidth={2}
                  className="h-4 w-4"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isApplied ? (
                <DropdownMenuItem onClick={markUnapplied}>
                  Mark as Unapplied
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={markApplied}>
                  Mark as Applied
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {hasTailored ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/resume/${job.tailoredResumeId}`}>
                      View Tailored Resume
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => tailorMutation.mutate()}
                    disabled={tailorMutation.isPending}
                  >
                    {tailorMutation.isPending
                      ? "Re-tailoring..."
                      : "Re-tailor Resume"}
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onClick={() => tailorMutation.mutate()}
                  disabled={tailorMutation.isPending}
                >
                  {tailorMutation.isPending ? "Tailoring..." : "Tailor Resume"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={simulateInterview}
                disabled={!!creating}
              >
                {creating === "interview"
                  ? "Starting..."
                  : "Simulate Interview"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={createPractice} disabled={!!creating}>
                {creating === "practice" ? "Starting..." : "Create Practice"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
