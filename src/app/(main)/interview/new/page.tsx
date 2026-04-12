"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BriefcaseIcon,
  ArrowRight01Icon,
  ArtboardToolIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { client } from "@/lib/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DIFFICULTIES,
  DIFFICULTY_STYLES,
  DURATION_OPTIONS,
  INTERVIEW_TYPES,
  TEMPLATES,
  TYPE_BADGE_STYLES,
} from "@/constants/interview";

export default function NewInterviewPage() {
  const router = useRouter();
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewType, setInterviewType] = useState<
    "technical" | "behavioral" | "mixed"
  >("technical");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<number | null>(null);

  const errors = {
    jobRole: jobRole.trim().length === 0,
    jobDescription: jobDescription.trim().length < 20,
  };
  const isValid = !errors.jobRole && !errors.jobDescription;

  const handleCreate = async () => {
    if (!isValid) {
      if (errors.jobRole) toast.error("Please enter a job role.");
      else if (errors.jobDescription)
        toast.error("Job description must be at least 20 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await client.interview.sessions.post({
        jobRole: jobRole.trim(),
        jobDescription: jobDescription.trim(),
        interviewType,
        difficulty,
        durationMinutes,
      });

      if (res.error || !res.data) throw new Error("Failed to create session");
      router.push(`/interview/${res.data.interviewId}`);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const applyTemplate = (t: (typeof TEMPLATES)[number], i: number) => {
    setJobRole(t.role);
    setJobDescription(t.desc);
    setInterviewType(t.interviewType);
    setDifficulty(t.difficulty);
    setDurationMinutes(t.durationMinutes);
    setActiveTemplate(i);
  };

  return (
    <div className="space-y-10 py-10">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight">New Interview</h1>
        <p className="text-muted-foreground">
          Configure your own session below, or pick a template to get started
          quickly.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium tracking-widest uppercase">
          <HugeiconsIcon
            icon={BriefcaseIcon}
            strokeWidth={2}
            className="h-5 w-5"
          />
          Configure Session
        </p>

        <div className="bg-card space-y-6 rounded-lg border p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left column */}
            <div className="space-y-5">
              {/* Job Role */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Job Role <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Senior Software Engineer"
                  value={jobRole}
                  onChange={(e) => {
                    setJobRole(e.target.value);
                    setActiveTemplate(null);
                  }}
                  className={cn(
                    jobRole &&
                      errors.jobRole &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
              </div>

              {/* Job Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Job Description <span className="text-destructive">*</span>
                </label>
                <Textarea
                  placeholder="Paste the job description or write a brief overview (min. 20 characters)..."
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => {
                    setJobDescription(e.target.value);
                    setActiveTemplate(null);
                  }}
                  className={cn(
                    jobDescription &&
                      errors.jobDescription &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                <p
                  className={cn(
                    "text-xs tabular-nums",
                    jobDescription.trim().length < 20 &&
                      jobDescription.length > 0
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {jobDescription.trim().length} / 20 min characters
                </p>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Interview Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Interview Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {INTERVIEW_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setInterviewType(t.value)}
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border py-3 text-sm font-medium transition-all",
                        interviewType === t.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "text-muted-foreground hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      <HugeiconsIcon
                        icon={t.icon}
                        strokeWidth={2}
                        className="h-5 w-5"
                      />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDifficulty(d.value)}
                      className={cn(
                        "cursor-pointer rounded-lg border py-2.5 text-sm font-medium transition-all",
                        difficulty === d.value
                          ? DIFFICULTY_STYLES[d.value].active
                          : "text-muted-foreground hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Duration</label>
                <Select
                  value={String(durationMinutes)}
                  onValueChange={(v) => setDurationMinutes(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Summary card */}
              <div className="bg-muted/30 mt-auto space-y-2 rounded-lg border p-4">
                <p className="text-xs font-medium tracking-widest uppercase">
                  Session Summary
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <span className="max-w-[160px] truncate text-right font-medium">
                      {jobRole || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">
                      {interviewType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Difficulty</span>
                    <span
                      className={cn(
                        "font-medium capitalize",
                        difficulty === "easy"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : difficulty === "medium"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{durationMinutes} min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="flex items-center justify-between border-t-2 pt-6">
            <p className="text-muted-foreground text-xs">
              {!isValid
                ? "Fill in all required fields to continue."
                : "Ready to start your interview session."}
            </p>
            <Button
              size="lg"
              onClick={handleCreate}
              disabled={loading || !isValid}
              className="min-w-40 gap-2"
            >
              {loading ? (
                "Preparing…"
              ) : (
                <>
                  Start Interview
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium tracking-widest uppercase">
          <HugeiconsIcon
            icon={ArtboardToolIcon}
            strokeWidth={2}
            className="h-5 w-5"
          />
          Quick Templates
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {TEMPLATES.map((t, i) => {
            const isActive = activeTemplate === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => applyTemplate(t, i)}
                className={cn(
                  "group cursor-pointer space-y-3 rounded-xl border p-4 text-left transition-all duration-200",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "bg-card hover:border-primary/40 hover:shadow-sm",
                )}
              >
                {/* Icon + type badge */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10"
                        : "bg-muted group-hover:bg-primary/5",
                    )}
                  >
                    <HugeiconsIcon
                      icon={t.icon}
                      strokeWidth={2}
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                      TYPE_BADGE_STYLES[t.interviewType],
                    )}
                  >
                    {t.interviewType}
                  </span>
                </div>

                {/* Role */}
                <div>
                  <p
                    className={cn(
                      "leading-tight font-semibold",
                      isActive && "text-primary",
                    )}
                  >
                    {t.role}
                  </p>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-relaxed">
                    {t.desc}
                  </p>
                </div>

                {/* Meta chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                      DIFFICULTY_STYLES[t.difficulty].badge,
                    )}
                  >
                    {t.difficulty}
                  </span>
                  <span className="text-muted-foreground ml-auto text-xs font-medium">
                    {t.durationMinutes} min
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Custom Setup ──────────────────────────────────────────────── */}
    </div>
  );
}
