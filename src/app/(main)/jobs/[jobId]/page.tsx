"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { client } from "@/lib/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ParsedJobDescription } from "@/lib/ai/schemas/job-description.schema";
import {
  ArrowLeft01Icon,
  Bookmark02Icon,
  Building04Icon,
  Location01Icon,
  Clock01Icon,
  Briefcase02Icon,
  MoreVerticalCircle01Icon,
  Tick01Icon,
  Calendar01Icon,
  Linkedin01Icon,
  Money01Icon,
  UserEdit01Icon,
  CheckmarkBadge01Icon,
  Linkedin02FreeIcons,
  UserIcon,
  Close,
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
import { authClient } from "@/lib/auth-client";

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

  parsedDescription?: ParsedJobDescription | null;
  tailoredResumeId?: string | null;

  userSkills?: {
    languages?: string[];
    frameworks?: string[];
    mlAndAi?: string[];
    devops?: string[];
    databases?: string[];
    tools?: string[];
    other?: string[];
  } | null;

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

  const session = authClient.getSession();

  if (!session) {
    router.push("/");
  }

  const {
    data: job,
    isLoading,
    error,
  } = useQuery<DetailedJobData>({
    queryKey: ["jobs", jobId],
    staleTime: 1000 * 60 * 10,
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

  const companyUrl = job.companyDomain
    ? job.companyDomain.startsWith("http")
      ? job.companyDomain
      : `https://${job.companyDomain}`
    : "#";

  const userSkillsList = job.userSkills
    ? [
        ...(job.userSkills.languages || []),
        ...(job.userSkills.frameworks || []),
        ...(job.userSkills.mlAndAi || []),
        ...(job.userSkills.devops || []),
        ...(job.userSkills.databases || []),
        ...(job.userSkills.tools || []),
        ...(job.userSkills.other || []),
      ].map((s) => s.toLowerCase())
    : [];

  const mustHaveSkills = job.parsedDescription?.mustHaveSkills || [];
  const niceToHaveSkills = job.parsedDescription?.niceToHaveSkills || [];

  const matchedSkills = mustHaveSkills.filter((skill) =>
    userSkillsList.some(
      (us) =>
        us === skill.toLowerCase() ||
        us.includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(us),
    ),
  );

  const missingSkills = mustHaveSkills.filter(
    (skill) => !matchedSkills.includes(skill),
  );

  const techStack =
    job.parsedDescription?.techStack &&
    job.parsedDescription.techStack.length > 0
      ? job.parsedDescription.techStack
      : job.technologySlugs
        ? job.technologySlugs.map((t) => t.replace(/-/g, " "))
        : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pt-6 pb-12">
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
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white p-1">
              {job.companyLogo ? (
                <Image
                  src={job.companyLogo}
                  alt={job.company}
                  width={150}
                  height={150}
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
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-extrabold tracking-tight">
                {job.jobTitle}
              </h1>
              <span className="text-foreground text-lg font-medium">
                {job.company}
              </span>
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
                <Button
                  variant="default"
                  className="font-semibold lg:w-36"
                  asChild
                >
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
                <DropdownMenuContent align="end" className="w-48">
                  {isApplied ? (
                    <>
                      <DropdownMenuItem onClick={markUnapplied}>
                        Mark as Unapplied
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={markApplied}>
                        Mark as Applied
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
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
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 md:col-span-2">
          {/* Required Technologies */}
          {techStack.length > 0 && (
            <div className="bg-card rounded-md border p-6">
              <h3 className="mb-4 text-sm font-bold tracking-wider uppercase">
                Required Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech) => {
                  const hasSkill = userSkillsList.some(
                    (us) =>
                      us === tech.toLowerCase() ||
                      us.includes(tech.toLowerCase()) ||
                      tech.toLowerCase().includes(us),
                  );
                  return (
                    <span
                      key={tech}
                      className={cn(
                        "flex items-center rounded-md border px-3 py-1.5 text-sm font-bold transition-colors",
                        hasSkill
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-secondary text-secondary-foreground border-transparent",
                      )}
                    >
                      {hasSkill && (
                        <HugeiconsIcon
                          icon={CheckmarkBadge01Icon}
                          className="mr-1.5 h-5 w-5"
                          strokeWidth={2}
                        />
                      )}
                      {tech}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-card rounded-md border p-6">
            <Tabs
              defaultValue={job.parsedDescription ? "overview" : "description"}
            >
              <TabsList variant="line" className="mb-6 w-full justify-start">
                {job.parsedDescription && (
                  <>
                    <TabsTrigger
                      className="cursor-pointer font-bold uppercase"
                      value="overview"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      className="cursor-pointer font-bold uppercase"
                      value="requirements"
                    >
                      Requirements
                    </TabsTrigger>
                    <TabsTrigger
                      className="cursor-pointer font-bold uppercase"
                      value="benefits"
                    >
                      Benefits
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger
                  className="cursor-pointer font-bold uppercase"
                  value="description"
                >
                  Full Description
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              {job.parsedDescription && (
                <TabsContent value="overview" className="space-y-8">
                  {/* Grid of details */}
                  <div className="bg-muted/30 grid grid-cols-2 gap-6 rounded-md border p-4 font-semibold md:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={Location01Icon}
                          className="h-4 w-4"
                          strokeWidth={2}
                        />
                        <span className="text-xs uppercase">Location</span>
                      </div>
                      <span className="text-[1rem]">
                        {job.location || "Not specified"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={Briefcase02Icon}
                          className="h-4 w-4"
                          strokeWidth={2}
                        />
                        <span className="text-xs uppercase">Mode</span>
                      </div>
                      <span className="text-[1rem]">{getWorkMode()}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={Money01Icon}
                          className="h-4 w-4"
                          strokeWidth={2}
                        />
                        <span className="text-xs uppercase">Salary</span>
                      </div>
                      <span className="text-[1rem]">{formattedSalary}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={UserEdit01Icon}
                          className="h-4 w-4"
                          strokeWidth={2}
                        />
                        <span className="text-xs uppercase">Level</span>
                      </div>
                      <span className="text-[1rem]">{getSeniority()}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          className="h-4 w-4"
                          strokeWidth={2}
                        />
                        <span className="text-xs uppercase">Type</span>
                      </div>
                      <span className="text-[1rem]">{getEmploymentType()}</span>
                    </div>
                    {job.datePosted && (
                      <div className="flex flex-col gap-1.5">
                        <div className="text-muted-foreground flex items-center gap-1.5">
                          <HugeiconsIcon
                            icon={Calendar01Icon}
                            className="h-4 w-4"
                            strokeWidth={2}
                          />
                          <span className="text-xs uppercase">Posted On</span>
                        </div>
                        <span className="text-[1rem]">
                          {new Date(job.datePosted).toLocaleDateString(
                            "en-GB",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    )}
                    {job.easyApply && (
                      <div className="flex flex-col gap-1.5">
                        <div className="text-muted-foreground flex items-center gap-1.5">
                          <HugeiconsIcon
                            icon={CheckmarkBadge01Icon}
                            className="h-4 w-4"
                            strokeWidth={2}
                          />
                          <span className="text-xs uppercase">Easy Apply</span>
                        </div>
                        <span className="text-[1rem] text-blue-600">
                          Available
                        </span>
                      </div>
                    )}
                    {(job.hiringTeamFirstName || job.hiringTeamLastName) && (
                      <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
                        <div className="text-muted-foreground flex gap-1.5">
                          <HugeiconsIcon
                            icon={UserIcon}
                            className="h-4 w-4"
                            strokeWidth={2}
                          />
                          <span className="text-xs uppercase">Hiring Team</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[1rem]">
                            {job.hiringTeamFirstName} {job.hiringTeamLastName}
                          </span>
                          {job.hiringTeamLinkedinUrl && (
                            <a
                              href={job.hiringTeamLinkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80"
                            >
                              <HugeiconsIcon
                                icon={Linkedin02FreeIcons}
                                className="h-4 w-4"
                                strokeWidth={2}
                              />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {job.parsedDescription.jobSummary && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold tracking-wider uppercase">
                        Job Summary
                      </h3>
                      <p className="text-sm leading-relaxed font-medium">
                        {job.parsedDescription.jobSummary}
                      </p>
                    </div>
                  )}

                  {job.parsedDescription.keyResponsibilities.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold tracking-wider uppercase">
                        Key Responsibilities
                      </h3>
                      <ol className="marker:text-muted-foreground text-muted-foreground list-decimal space-y-3 pl-5 text-sm leading-relaxed marker:font-semibold">
                        {" "}
                        {job.parsedDescription.keyResponsibilities.map(
                          (r, i) => (
                            <li key={i} className="pl-1">
                              {" "}
                              <span className="text-foreground font-medium">
                                {" "}
                                {r}{" "}
                              </span>{" "}
                            </li>
                          ),
                        )}{" "}
                      </ol>
                    </div>
                  )}
                  {job.parsedDescription.interviewProcess && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold tracking-wider uppercase">
                        Interview Process
                      </h3>
                      <p className="text-sm leading-relaxed">
                        {job.parsedDescription.interviewProcess}
                      </p>
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Requirements Tab */}
              {job.parsedDescription && (
                <TabsContent value="requirements" className="space-y-8">
                  {mustHaveSkills.length > 0 && (
                    <div className="space-y-5">
                      <h3 className="text-sm font-bold tracking-wider uppercase">
                        Must-Have Skills
                      </h3>
                      <ol className="marker:text-muted-foreground list-decimal space-y-4 pl-5 text-sm leading-relaxed marker:font-semibold">
                        {matchedSkills.length > 0 && (
                          <li className="text-muted-foreground pl-1">
                            <span className="text-foreground mb-2 block font-medium">
                              Skills you already have:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {matchedSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                >
                                  <HugeiconsIcon
                                    icon={CheckmarkBadge01Icon}
                                    className="h-5 w-5"
                                    strokeWidth={2}
                                  />
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </li>
                        )}
                        {missingSkills.length > 0 && (
                          <li className="text-muted-foreground mt-2 pl-1">
                            <span className="text-foreground mb-2 block font-medium">
                              Consider showcasing the below skills in your
                              resume:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {missingSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                                >
                                  <HugeiconsIcon
                                    icon={Close}
                                    className="h-5 w-5"
                                    strokeWidth={2}
                                  />
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </li>
                        )}
                      </ol>
                    </div>
                  )}

                  {niceToHaveSkills.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold tracking-wider uppercase">
                        Nice-to-Have Skills
                      </h3>
                      <ol className="marker:text-muted-foreground text-muted-foreground list-decimal space-y-2 pl-5 text-sm leading-relaxed marker:font-semibold">
                        {niceToHaveSkills.map((skill, i) => (
                          <li key={i} className="pl-1">
                            <span className="text-foreground font-medium">
                              {skill}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Benefits Tab */}
              {job.parsedDescription && (
                <TabsContent value="benefits" className="space-y-6">
                  <h3 className="text-sm font-bold tracking-wider uppercase">
                    Benefits & Perks
                  </h3>
                  {job.parsedDescription.benefits.length > 0 ? (
                    <ol className="marker:text-muted-foreground text-muted-foreground list-decimal space-y-3 pl-5 text-sm leading-relaxed marker:font-semibold">
                      {job.parsedDescription.benefits.map((b, i) => (
                        <li key={i} className="pl-1">
                          <span className="text-foreground font-medium">
                            {b}
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">
                      No specific benefits were extracted from the description.
                    </p>
                  )}
                </TabsContent>
              )}

              {/* Full Description Tab */}
              <TabsContent value="description">
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
                        <ul
                          className="mb-4 list-disc space-y-1 pl-5"
                          {...props}
                        />
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
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-card rounded-md border p-6">
            <h3 className="mb-4 text-sm font-bold tracking-wider uppercase">
              Match Profile
            </h3>

            <div
              className={`flex w-full flex-col items-center rounded-md border ${score <= 60 ? "border-red-500/20 bg-red-500/5 dark:border-red-500/10 dark:bg-red-500/5" : score <= 80 ? "border-yellow-500/20 bg-yellow-500/5 dark:border-yellow-500/10 dark:bg-yellow-500/5" : "border-emerald-500/20 bg-emerald-500/5 dark:border-emerald-500/10 dark:bg-emerald-500/5"} p-8`}
            >
              <div className="relative mb-4 h-32 w-32">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path
                    className={`${score <= 60 ? "text-red-500/20 dark:text-red-500/20" : score <= 80 ? "text-yellow-500/20 dark:text-yellow-500/20" : "text-emerald-500/20 dark:text-emerald-500/20"}`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className={`${score <= 60 ? "text-red-500 shadow-sm" : score <= 80 ? "text-yellow-500 shadow-sm" : "text-emerald-500 shadow-sm"}`}
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
                  <span
                    className={`${score <= 60 ? "text-red-500" : score <= 80 ? "text-yellow-500" : "text-emerald-500"} text-3xl font-bold`}
                  >
                    {score}%
                  </span>
                </div>
              </div>
              <p
                className={`${score <= 60 ? "text-red-500" : score <= 80 ? "text-yellow-500" : "text-emerald-500"} text-sm font-bold tracking-wide uppercase`}
              >
                {score >= 80
                  ? "Strong Match"
                  : score >= 60
                    ? "Good Match"
                    : "Fair Match"}
              </p>
            </div>
          </div>

          <div className="bg-card rounded-md border p-6">
            <h3 className="mb-4 text-sm font-bold tracking-wider uppercase">
              About {job.company}
            </h3>
            {job.companyDescription ? (
              <p className="mb-6 text-sm leading-relaxed">
                {job.companyDescription}
              </p>
            ) : (
              <p className="text-muted-foreground mb-6 text-sm italic">
                No company description available.
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 text-sm font-semibold sm:grid-cols-2">
              {job.location && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs uppercase">
                    Location
                  </span>
                  <span>{job.location}</span>
                </div>
              )}
              {job.companyEmployeeCount && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs uppercase">
                    Employees
                  </span>
                  <span>{job.companyEmployeeCount}+</span>
                </div>
              )}
              {job.companyFoundedYear && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs uppercase">
                    Founded
                  </span>
                  <span>{job.companyFoundedYear}</span>
                </div>
              )}
              {job.companyDomain && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs uppercase">
                    Website
                  </span>
                  <a
                    href={companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    Visit Site
                  </a>
                </div>
              )}
              {job.companyLinkedinUrl && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs uppercase">
                    LinkedIn
                  </span>
                  <a
                    href={job.companyLinkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    <HugeiconsIcon
                      icon={Linkedin01Icon}
                      className="h-4 w-4"
                      strokeWidth={2}
                    />{" "}
                    Follow
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
