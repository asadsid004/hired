"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PlusSignIcon,
  ArrowRight01Icon,
  Search01Icon,
  Close,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { client } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { PracticeForm } from "@/components/practice/practice-form";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Session } from "./results/[id]/page";

export default function PracticeMainPage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Completed" | "Pending">(
    "All",
  );

  const {
    data: sessions,
    isLoading,
    error,
  } = useQuery<Session[]>({
    queryKey: ["practice-sessions"],
    queryFn: async () => {
      const res = await client.practice.sessions.get();
      if (!res.data || res.error) throw new Error("Failed to load sessions");
      return res.data;
    },
  });

  const allSessions = sessions || [];

  const counts = {
    All: allSessions.length,
    Completed: allSessions.filter((s) => s.status === "completed").length,
    Pending: allSessions.filter((s) => s.status !== "completed").length,
  };

  let filteredSessions = allSessions;
  if (activeTab === "Completed") {
    filteredSessions = allSessions.filter((s) => s.status === "completed");
  } else if (activeTab === "Pending") {
    filteredSessions = allSessions.filter((s) => s.status !== "completed");
  }

  if (search.trim()) {
    const s = search.toLowerCase();
    filteredSessions = filteredSessions.filter(
      (session) =>
        session.topics.join(", ").toLowerCase().includes(s) ||
        session.difficulty.toLowerCase().includes(s),
    );
  }

  const TABS = ["All", "Completed", "Pending"] as const;

  return (
    <div className="w-full space-y-6 py-4">
      <div className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-[60px] z-40 -mx-1 flex flex-col gap-4 px-1 py-2 backdrop-blur md:flex-row md:items-center">
        <div className="flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium tracking-tight uppercase">
              Practice
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

        <div className="relative ml-auto w-full md:max-w-60 lg:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <HugeiconsIcon
              icon={Search01Icon}
              className="text-muted-foreground h-4 w-4"
              strokeWidth={2}
            />
          </div>
          <input
            type="text"
            placeholder="Search practices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border pr-3 pl-10 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Button
          size="lg"
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
        >
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} /> New Practice
        </Button>
      </div>

      {showForm && (
        <div className="bg-card animate-in fade-in slide-in-from-top-4 mb-6 rounded-lg border p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Start New Practice Session
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              <HugeiconsIcon
                icon={Close}
                strokeWidth={2}
                className="h-5! w-5!"
              />
            </Button>
          </div>
          <PracticeForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {isLoading ? (
        <div className="text-muted-foreground p-12 text-center">
          Loading sessions...
        </div>
      ) : error ? (
        <div className="text-destructive p-12 text-center">
          Failed to load sessions.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.length === 0 ? (
            <div className="text-muted-foreground col-span-full flex flex-col items-center rounded-md border border-dashed py-12 text-center">
              <div>No practice sessions found.</div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowForm(true)}
              >
                Start your first one
              </Button>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-card flex flex-col gap-4 rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h3 className="mr-4 line-clamp-1 flex-1 font-semibold">
                    {session.topics.join(", ")}
                  </h3>
                  <div
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap",
                      session.status === "completed"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : session.status === "evaluating"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                    )}
                  >
                    {session.status.replace("_", " ").toUpperCase()}
                  </div>
                </div>

                <div className="text-muted-foreground grid grid-cols-2 gap-y-2 text-sm">
                  <div>
                    <span className="mr-1 font-medium">Difficulty:</span>
                    <span className="capitalize">{session.difficulty}</span>
                  </div>
                  <div>
                    <span className="mr-1 font-medium">Questions:</span>
                    {session.questions.length}
                  </div>
                  <div className="col-span-2">
                    <span className="mr-1 font-medium">Created:</span>
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    }).format(new Date(session.createdAt))}
                  </div>
                </div>

                <div className="mt-auto border-t pt-4">
                  <Button asChild variant="secondary" className="h-9 w-full">
                    <Link
                      href={
                        session.status === "completed" ||
                        session.status === "evaluating"
                          ? `/practice/results/${session.id}`
                          : `/practice/session/${session.id}`
                      }
                    >
                      {session.status === "completed"
                        ? "View Results"
                        : session.status === "evaluating"
                          ? "Check Evaluation"
                          : "Continue Practice"}
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
