"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export function JobDetailPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] animate-pulse space-y-6 pt-4 pb-12">
      {/* Back Button */}
      <Link href="#" className={buttonVariants({ variant: "ghost" })}>
        <Skeleton className="h-4 w-24" />
      </Link>

      {/* Header Card */}
      <div className="bg-card flex flex-col gap-6 rounded-md border p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-1 items-start gap-5">
            <Skeleton className="h-16 w-16 rounded-md" />
            <div className="flex w-full flex-col gap-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>

          <div className="mt-4 flex shrink-0 items-center gap-4 md:mt-0 md:border-l md:pl-6">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </div>

        {/* Meta Row */}
        <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Description */}
        <div className="space-y-6 md:col-span-2">
          <div className="bg-card space-y-4 rounded-md border p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 md:col-span-1">
          {/* Job Overview */}
          <div className="bg-card space-y-4 rounded-md border p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-28" />
          </div>

          {/* Match Profile */}
          <div className="bg-card space-y-6 rounded-md border p-6">
            <Skeleton className="h-4 w-40" />

            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-32 w-32 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>

            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>

          {/* About Company */}
          <div className="bg-card space-y-4 rounded-md border p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />

            <div className="grid grid-cols-2 gap-4 pt-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-6 w-14 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
