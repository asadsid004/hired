"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { client } from "@/lib/client";
import { JobCard, JobData } from "./job-card";
import { Button } from "../ui/button";

export const JobListingWithFilers = () => {
  const [activeTab, setActiveTab] = useState<
    "All" | "Recommended" | "Saved" | "Applied"
  >("All");
  const [search, setSearch] = useState("");

  const {
    data: jobs,
    isLoading,
    error,
  } = useQuery<JobData[]>({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await client.jobs.get();
      if (!res.data || res.error) throw new Error("Failed to load jobs");
      const jobs = res.data.map((job) => ({
        id: job.id,
        jobTitle: job.jobTitle,
        company: job.company,
        location: job.location,
        userJobRecord: {
          status: job.userJobRecord.status,
          relevanceScore: job.userJobRecord.relevanceScore,
        },
      }));
      return jobs;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-sm">
          Loading jobs...
        </p>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">{error.message}</div>;
  }

  const allJobs = jobs || [];

  const counts = {
    All: allJobs.length,
    Recommended: Math.min(allJobs.length, 7),
    Saved: allJobs.filter((j) => j.userJobRecord.status === "saved").length,
    Applied: allJobs.filter((j) => j.userJobRecord.status === "applied").length,
  };

  let filteredJobs = allJobs;
  if (activeTab === "Recommended") {
    filteredJobs = allJobs.slice(0, 7);
  } else if (activeTab === "Saved") {
    filteredJobs = allJobs.filter((j) => j.userJobRecord.status === "saved");
  } else if (activeTab === "Applied") {
    filteredJobs = allJobs.filter((j) => j.userJobRecord.status === "applied");
  }

  if (search.trim()) {
    const s = search.toLowerCase();
    filteredJobs = filteredJobs.filter(
      (job) =>
        job.jobTitle.toLowerCase().includes(s) ||
        job.company.toLowerCase().includes(s) ||
        (job.location && job.location.toLowerCase().includes(s)),
    );
  }

  const TABS = ["All", "Recommended", "Saved", "Applied"] as const;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium tracking-tight uppercase">
              Jobs
            </h1>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="text-muted-foreground"
              strokeWidth={2.5}
            />
          </div>
        </div>

        <div className="bg-secondary/50 flex items-center gap-2 overflow-x-auto rounded-full p-1">
          {TABS.map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? "default" : "ghost"}
              className="rounded-full"
            >
              {tab}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  activeTab === tab ? "bg-muted text-primary" : "bg-muted",
                )}
              >
                {counts[tab]}
              </span>
            </Button>
          ))}
        </div>
        <div className="relative ml-auto w-full md:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <HugeiconsIcon
              icon={Search01Icon}
              className="text-muted-foreground h-4 w-4"
              strokeWidth={2}
            />
          </div>
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border pr-3 pl-10 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredJobs.length === 0 ? (
          <div className="text-muted-foreground rounded-md border border-dashed py-12 text-center">
            No jobs found.
          </div>
        ) : (
          filteredJobs.map((job) => (
            <JobCard key={job.id} job={job as JobData} />
          ))
        )}
      </div>
    </div>
  );
};
