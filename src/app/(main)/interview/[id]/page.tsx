"use client";

import { InterviewInterface } from "@/components/interview/interview-interface";
import { Spinner } from "@/components/ui/spinner";
import { client } from "@/lib/client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight01Icon, Message01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ScrollArea } from "@/components/ui/scroll-area";

const SpecificInterviewPage = () => {
  const params = useParams();
  const id = String(params.id);

  const {
    data: interview,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["interview", id],
    queryFn: async () => {
      const res = await client.interview.sessions({ id }).get();
      if (res.error) throw res.error;
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8" />
          <p>Loading practice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          Error: {error.message}
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          Interview not found
        </div>
      </div>
    );
  }

  if (interview.status === "processing") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8" />
          <p>Processing interview...</p>
          <span className="text-muted-foreground">
            This may take a few minutes depending on the length of the
            interview.
          </span>
        </div>
      </div>
    );
  }

  if (interview.status === "completed") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report = interview.report as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = interview.messages as any[];
    const scores = [
      {
        label: "Overall",
        value: report?.overallScore ?? 0,
        colorClass: "text-emerald-500",
        bgClass: "bg-emerald-500",
        trackClass: "bg-emerald-500/15",
        borderClass: "border-emerald-500/50",
        glowClass: "bg-emerald-500/10",
      },
      {
        label: "Communication",
        value: report?.communicationScore ?? 0,
        colorClass: "text-sky-500",
        bgClass: "bg-sky-500",
        trackClass: "bg-sky-500/15",
        borderClass: "border-sky-500/50",
        glowClass: "bg-sky-500/10",
      },
      {
        label: "Technical",
        value: report?.technicalScore ?? 0,
        colorClass: "text-violet-500",
        bgClass: "bg-violet-500",
        trackClass: "bg-violet-500/15",
        borderClass: "border-violet-500/50",
        glowClass: "bg-violet-500/10",
      },
    ];

    const getGrade = (v: number) =>
      v >= 85
        ? "Excellent"
        : v >= 70
          ? "Good"
          : v >= 55
            ? "Needs Work"
            : "Needs Improvement";

    return (
      <div className="mx-auto space-y-8 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-bold tracking-[0.18em] uppercase">
              Interview Complete
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Interview Results
            </h1>
          </div>
          <Button asChild size="sm" className="shrink-0 gap-1.5">
            <Link href="/interview/new">
              New Interview
              <HugeiconsIcon
                strokeWidth={2}
                icon={ArrowRight01Icon}
                size={14}
              />
            </Link>
          </Button>
        </div>

        {report && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {scores.map((s) => (
                <div
                  key={s.label}
                  className={`bg-card relative overflow-hidden rounded-lg border ${s.borderClass} flex flex-col gap-4 p-6`}
                >
                  {/* Ambient glow */}
                  {/* <div
                    className={`pointer-events-none absolute -top-6 -right-6 h-28 w-28 rounded-full ${s.glowClass} blur-2xl`}
                  /> */}

                  <p
                    className={`text-xs font-bold tracking-[0.2em] uppercase ${s.colorClass}`}
                  >
                    {s.label}
                  </p>

                  <div className="flex items-end gap-1">
                    <span
                      className={`text-6xl leading-none font-black tabular-nums ${s.colorClass}`}
                    >
                      {s.value}
                    </span>
                    <span
                      className={`mb-1.5 text-2xl font-bold ${s.colorClass} opacity-80`}
                    >
                      %
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className={`h-2 w-full rounded-full ${s.trackClass}`}>
                    <div
                      className={`h-full rounded-full ${s.bgClass}`}
                      style={{ width: `${s.value}%` }}
                    />
                  </div>

                  <p className="text-muted-foreground text-sm">
                    {getGrade(s.value)}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="bg-card col-span-1 rounded-lg border p-6 md:col-span-2">
                <h3 className="mb-4 text-xl font-bold tracking-tight">
                  Summary
                </h3>
                <p className="text-foreground/90 mx-auto text-sm leading-relaxed">
                  {report.summary}
                </p>
              </div>
              <div className="bg-card flex flex-col gap-4 rounded-lg border p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Strengths
                </h3>
                <ul className="space-y-3">
                  {report.strengths?.map((s: string, i: number) => (
                    <li
                      key={i}
                      className="text-foreground/80 rounded-md border border-emerald-500/10 bg-emerald-500/5 p-3 text-sm leading-relaxed"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card flex flex-col gap-4 rounded-lg border p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  Areas to Improve
                </h3>
                <ul className="space-y-3">
                  {report.areasToImprove?.map((s: string, i: number) => (
                    <li
                      key={i}
                      className="text-foreground/80 rounded-md border border-amber-500/10 bg-amber-500/5 p-3 text-sm leading-relaxed"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}

        <div className="bg-card overflow-hidden rounded-lg border">
          <div className="flex items-center gap-2.5 border-b px-7 py-4">
            <HugeiconsIcon icon={Message01Icon} size={18} strokeWidth={2} />
            <h2 className="text-sm font-bold tracking-[0.15em] uppercase">
              Interview Transcript
            </h2>
          </div>
          <ScrollArea className="bg-muted/20 h-[600px] p-6">
            <div className="mx-auto space-y-6">
              {messages
                ?.filter((m) => m.role === "bot" || m.role === "user")
                .map((m, i: number) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted-foreground/20 text-foreground rounded-bl-none border"
                      }`}
                    >
                      <div className="mb-1 text-xs font-bold tracking-wider uppercase">
                        {m.role === "user" ? "You" : "Interviewer"}
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {m.message}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  return <InterviewInterface {...interview} />;
};

export default SpecificInterviewPage;
