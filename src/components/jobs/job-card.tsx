"use client";

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
  Building04Icon,
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
  userJobRecord: {
    status: "new" | "viewed" | "saved" | "applied" | "hidden" | "rejected";
    relevanceScore: string | null | number;
  };
};

export const JobCard = ({ job }: { job: JobData }) => {
  const queryClient = useQueryClient();

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

  return (
    <div className="bg-card flex flex-col gap-6 rounded-md border p-5 transition-all hover:shadow-md md:flex-row">
      <div className="flex-1 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">
            {job.companyLogo ? (
              <Image
                src={job.companyLogo}
                alt={job.company}
                className="h-full w-full object-contain p-1"
                width={56}
                height={56}
              />
            ) : (
              <HugeiconsIcon
                icon={Building04Icon}
                className="text-muted-foreground"
              />
            )}
          </div>
          <div>
            {job.datePosted && (
              <span className="mb-2 inline-block rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
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
        </div>

        {/* Details Grid */}
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
      </div>

      {/* Right side: Score & Actions */}
      <div className="flex shrink-0 flex-col items-center justify-between space-y-4 border-t pt-4 sm:items-end md:w-56 md:border-t-0 md:border-l md:pt-0 md:pl-6">
        <div className="flex w-full flex-col items-center rounded-md bg-emerald-100/50 p-4 dark:bg-emerald-950/40">
          <div className="relative mb-2 h-16 w-16">
            <svg className="h-full w-full" viewBox="0 0 36 36">
              <path
                className="text-emerald-500/20"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-emerald-500"
                strokeDasharray={`${score}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {score}%
              </span>
            </div>
          </div>
          <p className="text-xs font-semibold text-emerald-600 uppercase dark:text-emerald-400">
            {score >= 80
              ? "Strong Match"
              : score >= 60
                ? "Good Match"
                : "Fair Match"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex w-full items-center gap-2">
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
