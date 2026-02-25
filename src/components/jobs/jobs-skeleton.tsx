import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const TABS = ["All", "Recommended", "Saved", "Applied"] as const;

export const JobsListSkeleton = () => {
  return (
    <div className="w-full space-y-6">
      {/* Sticky Header */}
      <div className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-[60px] z-40 -mx-1 flex flex-col gap-4 px-1 py-2 backdrop-blur md:flex-row md:items-center">
        {/* Title */}
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

        {/* Tabs with 0 count */}
        <div className="bg-secondary/50 flex items-center gap-2 overflow-x-auto rounded-full p-1">
          {TABS.map((tab, index) => (
            <Button
              key={tab}
              variant={index === 0 ? "default" : "ghost"}
              className="rounded-full"
              disabled
            >
              {tab}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  index === 0 ? "bg-muted text-primary" : "bg-muted",
                )}
              >
                0
              </span>
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto w-full md:max-w-xs">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      {/* Job Cards Skeleton */}
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-card flex flex-col gap-6 rounded-md border p-5 md:flex-row"
          >
            {/* Left Section */}
            <div className="flex-1 space-y-4">
              {/* Header Row */}
              <div className="flex items-start gap-4">
                <Skeleton className="h-14 w-14 rounded-md" />

                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24 rounded-full" /> {/* date */}
                  <Skeleton className="h-5 w-3/4" /> {/* title */}
                  <Skeleton className="h-4 w-1/2" /> {/* company */}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex shrink-0 flex-col items-center justify-between space-y-4 border-t pt-4 sm:items-end md:w-56 md:border-t-0 md:border-l md:pt-0 md:pl-6">
              {/* Score Box */}
              <div className="flex w-full flex-col items-center rounded-md bg-emerald-100/30 p-4 dark:bg-emerald-950/30">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="mt-2 h-4 w-20" />
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex w-full items-center gap-2">
                <Skeleton className="h-10 flex-1 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
