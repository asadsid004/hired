"use client";
import { useEffect, useState } from "react";
import { client } from "@/lib/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen01Icon,
  Target01Icon,
  Clock01Icon,
  Calendar02Icon,
  ArrowRight01Icon,
  DashboardSquare01Icon,
  Tick01Icon,
  Cancel01Icon,
  CheckListIcon,
  Analytics03Icon,
} from "@hugeicons/core-free-icons";
import { use } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Spinner } from "@/components/ui/spinner";

export interface Session {
  status: "evaluating" | "completed" | "in_progress";
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  topics: string[];
  difficulty: string;
  durationMinutes: number;
  overallFeedback: string | null;
  completedAt: Date | null;
  questions: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    feedback: string | null;
    sessionId: string;
    questionText: string;
    userAnswer: string | null;
    isCorrect: boolean | null;
  }[];
}

function getGrade(score: number) {
  if (score >= 90)
    return { letter: "A+", label: "Exceptional", color: "emerald" };
  if (score >= 80) return { letter: "A", label: "Excellent", color: "emerald" };
  if (score >= 70) return { letter: "B", label: "Good", color: "sky" };
  if (score >= 60) return { letter: "C", label: "Average", color: "amber" };
  if (score >= 50)
    return { letter: "D", label: "Below Average", color: "orange" };
  if (score >= 40) return { letter: "E", label: "Poor", color: "orange" };
  return { letter: "F", label: "Needs Work", color: "red" };
}

const colorMap: Record<
  string,
  { ring: string; text: string; bg: string; bar: string; badge: string }
> = {
  emerald: {
    ring: "stroke-emerald-500",
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-500",
    badge:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  sky: {
    ring: "stroke-sky-500",
    text: "text-sky-500",
    bg: "bg-sky-500/10",
    bar: "bg-sky-500",
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  },
  amber: {
    ring: "stroke-amber-500",
    text: "text-amber-500",
    bg: "bg-amber-500/10",
    bar: "bg-amber-500",
    badge:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  orange: {
    ring: "stroke-orange-500",
    text: "text-orange-500",
    bg: "bg-orange-500/10",
    bar: "bg-orange-500",
    badge:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  red: {
    ring: "stroke-red-500",
    text: "text-red-500",
    bg: "bg-red-500/10",
    bar: "bg-red-500",
    badge: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

function DonutRing({ score, color }: { score: number; color: string }) {
  const size = 150;
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const c = colorMap[color];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-muted"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={c.ring}
        style={{
          transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </svg>
  );
}

export default function InterviewResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = use(params);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchSession = async () => {
      const res = await client.practice.sessions({ id: sessionId }).get();
      if (res.data) {
        setSession(res.data);
        if (res.data.status === "evaluating") {
          interval = setTimeout(fetchSession, 3000);
        }
      }
    };
    fetchSession();
    return () => clearTimeout(interval);
  }, [sessionId]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8" />
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (session.status === "evaluating") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Spinner className="h-8 w-8" />
        <h2 className="text-lg font-semibold tracking-tight">
          Evaluating your answers...
        </h2>
        <p className="text-muted-foreground">This may take a moment.</p>
      </div>
    );
  }

  const total = session.questions.length;
  const correct = session.questions.filter((q) => q.isCorrect).length;
  const incorrect = session.questions.filter(
    (q) => q.isCorrect === false && q.userAnswer,
  ).length;
  const attempted = session.questions.filter((q) => q.userAnswer).length;
  const skipped = total - attempted;
  const score = Math.round((correct / total) * 100);
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const grade = getGrade(score);
  const c = colorMap[grade.color];

  const correctPct = (correct / total) * 100;
  const incorrectPct = (incorrect / total) * 100;
  const skippedPct = (skipped / total) * 100;

  return (
    <div className="space-y-8 py-10">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-bold tracking-[0.18em] uppercase">
            Session Complete
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Practice Results
          </h1>
        </div>
        <Button asChild size="sm" className="shrink-0 gap-1.5">
          <Link href="/practice">
            New Practice
            <HugeiconsIcon strokeWidth={2} icon={ArrowRight01Icon} size={14} />
          </Link>
        </Button>
      </div>

      {/* ── Overview Panel ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr_auto]">
        {/* Left — Score + Donut */}
        <div className="bg-card flex flex-col items-center justify-center gap-4 rounded-lg border px-8 py-7">
          <div className="relative flex items-center justify-center">
            <DonutRing score={score} color={grade.color} />
            <div className="absolute flex flex-col items-center leading-none">
              <span
                className={`text-[2.6rem] font-black tabular-nums ${c.text}`}
              >
                {score}%
              </span>
            </div>
          </div>
          <div className="mt-auto space-y-0.5 text-center">
            <div
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-lg font-bold ${c.badge}`}
            >
              <span className="font-black">{grade.letter}</span>
              <span className="opacity-80">·</span>
              <span>{grade.label}</span>
            </div>
            <p className="text-muted-foreground pt-1 text-sm">
              {correct} of {total} correct
            </p>
          </div>
        </div>

        {/* Center — Breakdown */}
        <div className="bg-card flex flex-col justify-evenly gap-5 rounded-lg border px-7 py-6">
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-bold tracking-[0.15em] uppercase">
              Question Breakdown
            </p>
            {/* Segmented bar */}
            <div className="bg-muted border-muted-foreground flex h-2.5 w-full overflow-hidden rounded-full border">
              {correctPct > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${correctPct}%` }}
                />
              )}
              {incorrectPct > 0 && (
                <div
                  className="h-full bg-red-500 transition-all duration-1000"
                  style={{ width: `${incorrectPct}%` }}
                />
              )}
              {skippedPct > 0 && (
                <div
                  className="bg-muted-foreground/20 h-full transition-all duration-1000"
                  style={{ width: `${skippedPct}%` }}
                />
              )}
            </div>
            {/* Legend */}
            <div className="space-y-1.5 pt-1">
              {[
                {
                  label: "Correct",
                  count: correct,
                  pct: correctPct,
                  dot: "bg-emerald-500",
                  val: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  label: "Incorrect",
                  count: incorrect,
                  pct: incorrectPct,
                  dot: "bg-red-500",
                  val: "text-red-500",
                },
                {
                  label: "Unanswered",
                  count: skipped,
                  pct: skippedPct,
                  dot: "bg-muted-foreground/30",
                  val: "text-muted-foreground",
                },
              ].map(({ label, count, pct, dot, val }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                  <span className="text-muted-foreground flex-1 text-sm">
                    {label}
                  </span>
                  <span className={`text-sm font-bold tabular-nums ${val}`}>
                    {count}
                  </span>
                  <span className="text-muted-foreground w-8 text-right text-sm tabular-nums">
                    ({Math.round(pct)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Meta strip */}
          <div className="flex h-full flex-col items-start gap-x-4 gap-y-2 border-t pt-4">
            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <HugeiconsIcon strokeWidth={2} icon={BookOpen01Icon} size={16} />
              <div className="flex flex-wrap gap-1">
                {session.topics.map((t) => (
                  <Badge
                    key={t}
                    className="px-2 py-0 text-xs font-bold tracking-wider uppercase"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="mt-auto flex w-full items-center justify-between">
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <HugeiconsIcon strokeWidth={2} icon={Target01Icon} size={16} />
                <span className="font-medium capitalize">
                  {session.difficulty}
                </span>
              </div>
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <HugeiconsIcon strokeWidth={2} icon={Clock01Icon} size={16} />
                <span className="font-medium">
                  {session.durationMinutes} min
                </span>
              </div>
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <HugeiconsIcon
                  strokeWidth={2}
                  icon={Calendar02Icon}
                  size={16}
                />
                <span>
                  {new Date(session.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Attempted + Accuracy */}
        <div className="flex flex-col gap-4">
          <div className="bg-card flex min-w-[140px] flex-1 flex-col justify-center gap-1.5 rounded-lg border p-5">
            <HugeiconsIcon
              icon={CheckListIcon}
              strokeWidth={2}
              size={16}
              className="text-sky-500"
            />
            <p className="text-muted-foreground mt-1 text-xs font-bold tracking-[0.15em] uppercase">
              Attempted
            </p>
            <p className="text-3xl font-black tabular-nums">{attempted}</p>
            <p className="text-muted-foreground text-sm">
              of {total} questions
            </p>
          </div>
          <div className="bg-card flex flex-1 flex-col justify-center gap-1.5 rounded-lg border p-5">
            <HugeiconsIcon
              icon={Analytics03Icon}
              strokeWidth={2}
              size={16}
              className={accuracy >= 70 ? "text-emerald-500" : "text-amber-500"}
            />
            <p className="text-muted-foreground mt-1 text-xs font-bold tracking-[0.15em] uppercase">
              Accuracy
            </p>
            <p className="text-3xl font-black tabular-nums">{accuracy}%</p>
            <p className="text-muted-foreground text-sm">of attempted</p>
          </div>
        </div>
      </div>

      {/* ── Overall Feedback ── */}
      {session.overallFeedback && (
        <div className="bg-card overflow-hidden rounded-lg border">
          <div className="flex items-center gap-2.5 border-b px-7 py-4">
            <HugeiconsIcon
              icon={DashboardSquare01Icon}
              size={16}
              strokeWidth={2}
              className="text-muted-foreground"
            />
            <h2 className="text-muted-foreground text-xs font-bold tracking-[0.15em] uppercase">
              Overall Performance Feedback
            </h2>
          </div>
          <div className="px-7 py-6">
            <p className="text-foreground/80 text-sm leading-7 whitespace-pre-wrap">
              {session.overallFeedback}
            </p>
          </div>
        </div>
      )}

      {/* ── Detailed Analysis ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight">
            Detailed Analysis
          </h2>
          <div className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-sm font-medium">
            {total} questions
          </span>
        </div>

        <Accordion type="multiple" className="space-y-3">
          {session.questions.map((q, i) => {
            const passed = q.isCorrect === true;
            const unanswered = !q.userAnswer;

            return (
              <AccordionItem
                key={q.id}
                value={q.id}
                className="bg-card overflow-hidden rounded-lg border px-0 data-[state=open]:shadow-sm"
              >
                <AccordionTrigger className="hover:bg-muted/30 flex items-center gap-4 px-5 py-4 transition-colors hover:no-underline [&>svg]:shrink-0">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {/* Number badge */}
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                        passed
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : unanswered
                            ? "bg-muted-foreground/15 text-muted-foreground"
                            : "bg-red-500/15 text-red-500"
                      }`}
                    >
                      {i + 1}
                    </div>

                    {/* Question text */}
                    <p className="text-left text-sm leading-snug font-medium text-wrap">
                      {q.questionText}
                    </p>

                    {/* Status pill */}
                    <div
                      className={`mr-2 ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${
                        passed
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : unanswered
                            ? "bg-muted text-muted-foreground"
                            : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      <HugeiconsIcon
                        strokeWidth={2}
                        icon={passed ? Tick01Icon : Cancel01Icon}
                        size={16}
                      />
                      {passed ? "Passed" : unanswered ? "Skipped" : "Improve"}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-0 pb-0">
                  <div className="grid divide-y border-t sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    {/* Your Answer */}
                    <div className="space-y-2 p-5">
                      <p className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">
                        Your Answer
                      </p>
                      <p
                        className={`text-sm leading-relaxed whitespace-pre-wrap ${q.userAnswer ? "text-foreground/80" : "text-muted-foreground/40 italic"}`}
                      >
                        {q.userAnswer ?? "No answer provided"}
                      </p>
                    </div>

                    {/* AI Feedback */}
                    <div className="space-y-2 p-5">
                      <p
                        className={`text-[10px] font-bold tracking-[0.15em] uppercase ${
                          passed
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        AI Evaluation & Model Answer
                      </p>
                      <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
                        {q.feedback}
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* ── Footer CTA ── */}
      <div className="bg-card flex items-center justify-between rounded-lg border px-7 py-5">
        <div>
          <p className="text-sm font-semibold">Ready to improve?</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Start another session to keep leveling up.
          </p>
        </div>
        <Button asChild size="sm" className="shrink-0 gap-1.5">
          <Link href="/practice">
            Practice Again
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
