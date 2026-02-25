"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { client } from "@/lib/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import {
  ArrowLeft01Icon,
  Bookmark02Icon,
  Building04Icon,
  Location01Icon,
  Money01Icon,
  Clock01Icon,
  Briefcase02Icon,
  MoreVerticalCircle01Icon,
  Tick01Icon,
  UserEdit01Icon,
  GlobalIcon,
  UserGroupIcon,
  Calendar01Icon,
  Linkedin01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JobDetailPageSkeleton } from "@/components/jobs/job-details-page-skeleton";

export type DetailedJobData = {
  id: number;
  jobTitle: string;
  company: string;
  location: string | null;
  companyLogo?: string | null;
  companyDomain?: string | null;
  companyEmployeeCount?: number | null;
  datePosted?: string | Date | null;
  salaryString?: string | null;
  minAnnualSalaryUsd?: number | null;
  maxAnnualSalaryUsd?: number | null;
  seniority?: string | null;
  employmentStatuses?: string[] | null;
  remote?: boolean | null;
  hybrid?: boolean | null;
  companyIndustry?: string | null;
  companyDescription?: string | null;
  companyLinkedinUrl?: string | null;
  companyFoundedYear?: number | null;
  companyTechnologySlugs?: string[] | null;

  description: string;
  url: string;

  shortLocation?: string | null;
  stateCode?: string | null;
  countryCode?: string | null;

  hiringTeamFirstName?: string | null;
  hiringTeamLastName?: string | null;
  hiringTeamLinkedinUrl?: string | null;

  reposted?: boolean | null;
  dateReposted?: string | Date | null;
  easyApply?: boolean | null;
  technologySlugs?: string[] | null;

  tailoredResumeId?: string | null;

  userJobRecord: {
    status: "new" | "viewed" | "saved" | "applied" | "hidden" | "rejected";
    relevanceScore: string | null | number;
    matchReasons?: string[];
  };
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const jobId = params.jobId as string;

  const {
    data: job,
    isLoading,
    error,
  } = useQuery<DetailedJobData>({
    queryKey: ["jobs", jobId],
    staleTime: 1000 * 60 * 10, // 10 minutes
    queryFn: async () => {
      const res = await client.jobs({ id: jobId }).get();
      if (!res.data || res.error) throw new Error("Failed to load job details");
      return res.data as unknown as DetailedJobData;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (
      newStatus: "new" | "viewed" | "saved" | "applied" | "hidden" | "rejected",
    ) => {
      const res = await client.jobs({ id: jobId }).status.patch({
        status: newStatus,
      });
      if (res.error) throw new Error("Failed to update status");
      return { id: jobId, status: newStatus };
    },
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ["jobs", jobId] });
      const previousJob = queryClient.getQueryData<DetailedJobData>([
        "jobs",
        jobId,
      ]);

      queryClient.setQueryData<DetailedJobData>(["jobs", jobId], (old) => {
        if (!old) return old;
        return {
          ...old,
          userJobRecord: {
            ...old.userJobRecord,
            status: newStatus,
          },
        };
      });

      queryClient.setQueryData<DetailedJobData[]>(["jobs"], (old) => {
        return (
          old?.map((j) =>
            j.id.toString() === jobId
              ? {
                  ...j,
                  userJobRecord: { ...j.userJobRecord, status: newStatus },
                }
              : j,
          ) ?? []
        );
      });

      return { previousJob };
    },
    onError: (_err, _newStatus, context) => {
      if (context?.previousJob) {
        queryClient.setQueryData(["jobs", jobId], context.previousJob);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", jobId] });
    },
  });

  const tailorMutation = useMutation({
    mutationFn: async () => {
      if (!job) throw new Error("Job not loaded");
      const res = await client.resume.create.post({
        jobTitle: job.jobTitle,
        jobDescription: job.description || `${job.jobTitle} at ${job.company}`,
        jobId: job.id,
        fileName: `${job.jobTitle} - ${job.company}`,
      });
      if (res.error) throw new Error("Failed to tailor resume");
      return res.data;
    },
    onSuccess: () => {
      toast.success(
        job?.tailoredResumeId ? "Resume re-tailored!" : "Resume tailored!",
      );
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", jobId] });
    },
    onError: () => {
      toast.error("Failed to tailor resume");
    },
  });

  if (isLoading) {
    return <JobDetailPageSkeleton />;
  }

  if (error || !job) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive mb-4">Failed to load job details.</p>
        <Button onClick={() => router.push("/jobs")}>Back to Jobs</Button>
      </div>
    );
  }

  const isSaved = job.userJobRecord.status === "saved";
  const isApplied = job.userJobRecord.status === "applied";
  const hasTailored = !!job.tailoredResumeId;

  const toggleSave = () => updateStatus.mutate(isSaved ? "new" : "saved");
  const markApplied = () => updateStatus.mutate("applied");
  const markUnapplied = () => updateStatus.mutate("new");

  const score =
    job.userJobRecord.relevanceScore != null
      ? Math.round(Number(job.userJobRecord.relevanceScore) * 100)
      : 0;

  const formattedSalary =
    job.minAnnualSalaryUsd && job.maxAnnualSalaryUsd
      ? `$${Math.round(job.minAnnualSalaryUsd / 1000)}K - $${Math.round(job.maxAnnualSalaryUsd / 1000)}K`
      : job.salaryString || "Not specified";

  const getSeniority = () =>
    job.seniority
      ? job.seniority.charAt(0).toUpperCase() + job.seniority.slice(1)
      : "Not specified";
  const getWorkMode = () =>
    job.remote ? "Remote" : job.hybrid ? "Hybrid" : "Onsite";
  const getEmploymentType = () =>
    job.employmentStatuses && job.employmentStatuses.length > 0
      ? job.employmentStatuses[0].replace("_", " ").charAt(0).toUpperCase() +
        job.employmentStatuses[0].replace("_", " ").slice(1)
      : "Full-time";

  const matchReasonsList =
    job.userJobRecord.matchReasons &&
    Array.isArray(job.userJobRecord.matchReasons)
      ? job.userJobRecord.matchReasons
      : [];

  const companyUrl = job.companyDomain
    ? job.companyDomain.startsWith("http")
      ? job.companyDomain
      : `https://${job.companyDomain}`
    : "#";

  return (
    <div className="mx-auto max-w-360 space-y-6 pt-4 pb-12">
      <Link href="/jobs" className={buttonVariants({ variant: "ghost" })}>
        <HugeiconsIcon
          icon={ArrowLeft01Icon}
          strokeWidth={2}
          className="h-4 w-4"
        />
        Back to Jobs
      </Link>

      <div className="bg-card flex flex-col gap-6 rounded-md border p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-1 items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white p-1">
              {job.companyLogo ? (
                <Image
                  src={job.companyLogo}
                  alt={job.company}
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                />
              ) : (
                <HugeiconsIcon
                  icon={Building04Icon}
                  className="text-muted-foreground h-8 w-8"
                  strokeWidth={2}
                />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {job.jobTitle}
              </h1>
              <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-foreground font-medium">
                  {job.company}
                </span>

                {job.companyDomain && (
                  <>
                    <span className="opacity-50">•</span>
                    <a
                      href={companyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground flex items-center gap-1.5 transition-colors"
                    >
                      <HugeiconsIcon
                        icon={GlobalIcon}
                        className="h-4 w-4"
                        strokeWidth={2}
                      />
                      {job.companyDomain}
                    </a>
                  </>
                )}
                {job.companyEmployeeCount && (
                  <>
                    <span className="opacity-50">•</span>
                    <span className="flex items-center gap-1.5">
                      <HugeiconsIcon
                        icon={UserGroupIcon}
                        className="h-4 w-4"
                        strokeWidth={2}
                      />
                      {job.companyEmployeeCount}+ employees
                    </span>
                  </>
                )}
                {job.companyIndustry && (
                  <>
                    <span className="opacity-50">•</span>
                    <span>{job.companyIndustry}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="border-border mt-4 flex shrink-0 items-center gap-4 md:mt-0 md:border-l md:pl-6">
            <div className="flex w-full items-center gap-3">
              {isApplied ? (
                <Button
                  variant="outline"
                  className="pointer-events-none gap-2 border-emerald-100 bg-emerald-100 text-emerald-700 lg:w-32 dark:border-emerald-800 dark:bg-emerald-800 dark:text-emerald-200"
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
                <Button variant="default" className="lg:w-32" asChild>
                  <Link
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
                  className={cn(
                    "h-4 w-4",
                    isSaved && "text-primary fill-current",
                  )}
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
                {isApplied ? (
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={markUnapplied}>
                      Mark as Unapplied
                    </DropdownMenuItem>
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
                        {tailorMutation.isPending
                          ? "Tailoring..."
                          : "Tailor Resume"}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                ) : (
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={markApplied}>
                      Mark as Applied
                    </DropdownMenuItem>
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
                        {tailorMutation.isPending
                          ? "Tailoring..."
                          : "Tailor Resume"}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                )}
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
          <div className="text-muted-foreground flex items-center gap-2.5">
            <HugeiconsIcon
              icon={Location01Icon}
              strokeWidth={2}
              className="h-4.5 w-4.5"
            />
            <span>{job.location || "Location not specified"}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2.5">
            <HugeiconsIcon
              icon={Money01Icon}
              strokeWidth={2}
              className="h-4.5 w-4.5"
            />
            <span>{formattedSalary}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2.5">
            <HugeiconsIcon
              icon={UserEdit01Icon}
              strokeWidth={2}
              className="h-4.5 w-4.5"
            />
            <span>{getSeniority()}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2.5">
            <HugeiconsIcon
              icon={Clock01Icon}
              strokeWidth={2}
              className="h-4.5 w-4.5"
            />
            <span>{getEmploymentType()}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2.5">
            <HugeiconsIcon
              icon={Briefcase02Icon}
              strokeWidth={2}
              className="h-4.5 w-4.5"
            />
            <span>{getWorkMode()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Main Content: Description */}
        <div className="space-y-6 md:col-span-2">
          <div className="bg-card rounded-md border p-6">
            <h2 className="mb-4 text-xl font-semibold">Job Description</h2>
            <div className="prose prose-sm dark:prose-invert prose-headings:font-bold prose-headings:text-foreground prose-h1:text-lg prose-h2:text-base prose-h3:text-base prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-li:marker:text-muted-foreground max-w-none whitespace-pre-wrap">
              <ReactMarkdown
                components={{
                  h1: ({ ...props }) => (
                    <strong
                      className="text-foreground mt-8 mb-3 block text-lg font-bold"
                      {...props}
                    />
                  ),
                  h2: ({ ...props }) => (
                    <strong
                      className="text-foreground mt-6 mb-3 block text-base font-bold"
                      {...props}
                    />
                  ),
                  h3: ({ ...props }) => (
                    <strong
                      className="text-foreground mt-5 mb-2 block text-base font-bold"
                      {...props}
                    />
                  ),
                  h4: ({ ...props }) => (
                    <strong
                      className="text-foreground mt-4 mb-2 block font-semibold"
                      {...props}
                    />
                  ),
                  h5: ({ ...props }) => (
                    <strong
                      className="text-foreground mt-4 mb-2 block font-semibold"
                      {...props}
                    />
                  ),
                  h6: ({ ...props }) => (
                    <strong
                      className="text-foreground mt-4 mb-2 block font-semibold"
                      {...props}
                    />
                  ),
                  a: ({ ...props }) => (
                    <a
                      className="text-primary font-medium hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    />
                  ),
                  ul: ({ ...props }) => (
                    <ul className="mb-4 list-disc space-y-1 pl-5" {...props} />
                  ),
                  ol: ({ ...props }) => (
                    <ol
                      className="mb-4 list-decimal space-y-1 pl-5"
                      {...props}
                    />
                  ),
                  p: ({ ...props }) => <p className="mb-4" {...props} />,
                }}
              >
                {job.description || "No description provided."}
              </ReactMarkdown>
            </div>

            {job.technologySlugs && job.technologySlugs.length > 0 && (
              <div className="mt-8 border-t pt-6">
                <h3 className="mb-4 text-base font-semibold">
                  Required Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.technologySlugs.map((tech) => (
                    <span
                      key={tech}
                      className="bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 text-xs font-medium capitalize"
                    >
                      {tech.replace(/-/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Match Info & Extra Data */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-card rounded-md border p-6">
            <h3 className="text-muted-foreground mb-4 text-xs font-bold tracking-wider uppercase">
              Job Overview
            </h3>
            <div className="space-y-4 text-sm">
              {job.datePosted && (
                <div className="flex items-start gap-3">
                  <HugeiconsIcon
                    icon={Calendar01Icon}
                    className="text-muted-foreground mt-0.5 h-4.5 w-4.5 shrink-0"
                    strokeWidth={2}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Posted on</span>
                    <span className="text-muted-foreground">
                      {new Date(job.datePosted).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              )}
              {job.reposted && job.dateReposted && (
                <div className="flex items-start gap-3">
                  <HugeiconsIcon
                    icon={Calendar01Icon}
                    className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-500"
                    strokeWidth={2}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      Reposted
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(job.dateReposted).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "long", day: "numeric" },
                      )}
                    </span>
                  </div>
                </div>
              )}
              {job.easyApply && (
                <div className="flex items-center gap-3">
                  <HugeiconsIcon
                    icon={Tick01Icon}
                    className="h-4.5 w-4.5 shrink-0 text-blue-500"
                    strokeWidth={2}
                  />
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    Easy Apply Available
                  </span>
                </div>
              )}

              {(job.hiringTeamFirstName || job.hiringTeamLastName) && (
                <div className="flex items-start gap-3 pt-2">
                  <HugeiconsIcon
                    icon={UserEdit01Icon}
                    className="text-muted-foreground mt-0.5 h-4.5 w-4.5 shrink-0"
                    strokeWidth={2}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Hiring Team</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {job.hiringTeamFirstName} {job.hiringTeamLastName}
                      </span>
                      {job.hiringTeamLinkedinUrl && (
                        <a
                          href={job.hiringTeamLinkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                          title="LinkedIn Profile"
                        >
                          <HugeiconsIcon
                            icon={Linkedin01Icon}
                            className="h-4 w-4"
                            strokeWidth={2}
                          />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="bg-card rounded-md border p-6">
            <h3 className="text-muted-foreground mb-4 text-xs font-bold tracking-wider uppercase">
              Your Match Profile
            </h3>

            <div className="mb-6 flex w-full flex-col items-center rounded-md border border-emerald-500/20 bg-emerald-500/5 p-8 dark:border-emerald-500/10 dark:bg-emerald-500/5">
              <div className="relative mb-4 h-32 w-32">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path
                    className="text-emerald-500/10 dark:text-emerald-500/20"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-emerald-500 shadow-sm"
                    strokeDasharray={`${score}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 1s ease-out" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {score}%
                  </span>
                </div>
              </div>
              <p className="text-sm font-bold tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                {score >= 80
                  ? "Strong Match"
                  : score >= 60
                    ? "Good Match"
                    : "Fair Match"}
              </p>
            </div>

            {matchReasonsList.length > 0 && (
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-semibold">Match Reasons</h4>
                <ul className="space-y-3">
                  {matchReasonsList.map((reason: string, idx: number) => (
                    <li
                      key={idx}
                      className="text-muted-foreground flex items-start gap-3 text-sm leading-relaxed"
                    >
                      <HugeiconsIcon
                        icon={Tick01Icon}
                        className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-500"
                        strokeWidth={2}
                      />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="bg-card rounded-md border p-6">
            <h2 className="mb-4 text-xl font-semibold">About {job.company}</h2>
            {job.companyDescription ? (
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                {job.companyDescription}
              </p>
            ) : (
              <p className="text-muted-foreground mb-6 text-sm italic">
                No company description available.
              </p>
            )}

            <div className="mb-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {job.companyFoundedYear && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs font-medium uppercase">
                    Founded
                  </span>
                  <span className="font-semibold">
                    {job.companyFoundedYear}
                  </span>
                </div>
              )}
              {job.companyLinkedinUrl && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs font-medium uppercase">
                    LinkedIn
                  </span>
                  <a
                    href={job.companyLinkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
                  >
                    <HugeiconsIcon icon={Linkedin01Icon} className="h-4 w-4" />{" "}
                    Follow
                  </a>
                </div>
              )}
            </div>

            {job.companyTechnologySlugs &&
              job.companyTechnologySlugs.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold">
                    Company Tech Stack
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.companyTechnologySlugs.map((tech) => (
                      <span
                        key={tech}
                        className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium capitalize"
                      >
                        {tech.replace(/-/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
