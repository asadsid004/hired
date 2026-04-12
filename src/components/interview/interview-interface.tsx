"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DIFFICULTY_CONFIG } from "@/constants/interview";
import { Interview } from "@/db/schema";
import { useInterviewVapi } from "@/hooks/use-interview-vapi";
import { Orb } from "@/components/ui/orb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PhoneOffIcon,
  Mic01Icon,
  MicOff01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const InterviewInterface = (interview: Interview) => {
  const router = useRouter();
  const { jobRole, difficulty, interviewType } = interview;

  const { className: difficultyClassName } =
    DIFFICULTY_CONFIG[interview.difficulty as keyof typeof DIFFICULTY_CONFIG];

  const {
    status,
    error,
    liveMessages,
    currentAssistantPartial,
    currentUserPartial,
    durationSeconds,
    maxDurationSeconds,
    micMuted,
    start,
    stop,
    toggleMute,
  } = useInterviewVapi();

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll captions
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages, currentAssistantPartial, currentUserPartial]);

  // Start the call automatically when the component mounts
  useEffect(() => {
    if (status === "idle" && !error) {
      start({
        interviewId: interview.id,
        jobRole: interview.jobRole || "",
        jobDescription: interview.jobDescription || "",
        interviewType: interview.interviewType || "",
        difficulty: interview.difficulty || "",
        maxDurationSeconds: interview.durationMinutes
          ? interview.durationMinutes * 60
          : 15 * 60,
      });
    }
  }, [status, error, start, interview]);

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const mapAgentState = () => {
    if (status === "speaking") return "talking";
    if (status === "listening") return "listening";
    if (status === "thinking") return "thinking";
    return null;
  };

  const isCallActive =
    status === "starting" ||
    status === "listening" ||
    status === "thinking" ||
    status === "speaking";

  useEffect(() => {
    if (!isCallActive) return;
    const remaining = maxDurationSeconds - durationSeconds;
    if (remaining <= 0) {
      stop();
      router.push(`/interview`);
    }
  }, [durationSeconds, maxDurationSeconds, router, isCallActive, stop]);

  return (
    <div className="bg-background relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-between overflow-hidden p-4">
      {/* ── Status bar ────────────────────────────────────────────────── */}
      <div className="z-10 flex w-full max-w-2xl items-center justify-between pt-4">
        <div className="flex flex-col gap-2">
          <p className="text-xl font-medium">{jobRole ?? "Mock Interview"}</p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${difficultyClassName}`}
            >
              {difficulty}
            </span>
            <span className="border-foreground/50 inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize">
              {interviewType}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isCallActive
                ? "bg-green-500/15 text-green-500"
                : status === "connecting"
                  ? "bg-yellow-500/15 text-yellow-500"
                  : status === "processing"
                    ? "bg-blue-500/15 text-blue-500"
                    : "bg-muted text-muted-foreground"
            }`}
          >
            {isCallActive
              ? "● Live"
              : status === "connecting"
                ? "Connecting…"
                : status === "processing"
                  ? "Processing…"
                  : status === "ended"
                    ? "Ended"
                    : "Idle"}
          </span>
          {isCallActive && (
            <span className="text-muted-foreground text-xs font-medium tabular-nums">
              {formatTime(maxDurationSeconds - durationSeconds)} remaining
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive z-10 mt-4 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {/* ── Main visualisation area ───────────────────────────────────── */}
      <div className="z-0 flex w-full flex-1 flex-col items-center justify-center gap-10 sm:flex-row">
        {/* Interviewer Orb */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-32 w-32 items-center justify-center md:h-48 md:w-48">
            {mapAgentState() === "talking" && (
              <>
                <div
                  className="absolute inset-0 animate-ping rounded-full bg-teal-400/30"
                  style={{ animationDuration: "2.5s" }}
                />
                <div className="absolute -inset-4 animate-pulse rounded-full bg-teal-400/20 md:-inset-6" />
              </>
            )}
            <Orb
              agentState={mapAgentState()}
              className="absolute inset-0 z-10"
              colors={["#5EEAD4", "#0F766E"]} // Lighter teal colors for AI
            />
            <span className="text-primary-foreground pointer-events-none relative z-20 text-xl font-bold mix-blend-difference select-none md:text-3xl">
              AI
            </span>
          </div>
          <p className="text-muted-foreground font-medium tracking-wider uppercase">
            Interviewer
          </p>
        </div>

        {/* Divider */}
        <div className="text-muted-foreground/30 text-xs">· · ·</div>

        {/* User blob */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-24 w-24 items-center justify-center md:h-48 md:w-48">
            {currentUserPartial && !micMuted && (
              <>
                <div
                  className="absolute inset-0 animate-ping rounded-full bg-blue-400/30"
                  style={{ animationDuration: "2.5s" }}
                />
                <div className="absolute -inset-4 animate-pulse rounded-full bg-blue-400/20 md:-inset-6" />
              </>
            )}
            {!micMuted ? (
              <Orb
                agentState={currentUserPartial ? "talking" : "listening"}
                className="absolute inset-0 z-10"
                colors={["#93C5FD", "#2563EB"]} // Lighter blue colors for User
              />
            ) : (
              <div className="border-destructive/40 bg-muted/50 flex h-full w-full items-center justify-center rounded-full border-2 shadow-lg transition-all duration-200">
                <HugeiconsIcon
                  icon={UserCircleIcon}
                  strokeWidth={1.5}
                  className="text-muted-foreground h-10 w-10 md:h-12 md:w-12"
                />
              </div>
            )}
            {!micMuted && (
              <HugeiconsIcon
                icon={UserCircleIcon}
                strokeWidth={1.5}
                className="pointer-events-none relative z-10 h-8 w-8 text-white mix-blend-overlay md:h-10 md:w-10"
              />
            )}
          </div>
          <p className="text-muted-foreground font-medium tracking-wider uppercase">
            {micMuted ? "Muted" : "You"}
          </p>
        </div>
      </div>

      {/* ── Live captions ─────────────────────────────────────────────── */}
      <div className="z-10 w-full max-w-3xl px-2 pb-32">
        {(liveMessages.length > 0 ||
          currentAssistantPartial ||
          currentUserPartial) && (
          <Card className="border-primary/15 bg-background/80 shadow-xl backdrop-blur-md">
            <div className="max-h-48 space-y-3 overflow-y-auto p-4">
              {liveMessages.slice(-6).map((t, i) => (
                <p key={i} className="text-sm leading-relaxed">
                  <span
                    className={`mr-1.5 font-semibold ${
                      t.role === "assistant"
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {t.role === "assistant" ? "Interviewer:" : "You:"}
                  </span>
                  <span className="text-muted-foreground">{t.content}</span>
                </p>
              ))}

              {currentAssistantPartial && (
                <p className="text-muted-foreground animate-pulse text-sm leading-relaxed">
                  <span className="text-primary mr-1.5 font-semibold">
                    Interviewer:
                  </span>
                  {currentAssistantPartial}
                </p>
              )}

              {currentUserPartial && (
                <p className="text-muted-foreground animate-pulse text-sm leading-relaxed">
                  <span className="text-foreground mr-1.5 font-semibold">
                    You:
                  </span>
                  {currentUserPartial}
                </p>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </Card>
        )}

        {/* Connecting placeholder */}
        {status === "connecting" && liveMessages.length === 0 && (
          <p className="text-muted-foreground animate-pulse text-center text-sm">
            Connecting to your interviewer…
          </p>
        )}

        {/* Processing message */}
        {status === "processing" && (
          <p className="animate-pulse text-center text-sm font-medium text-blue-500">
            Interview ended. Processing your results...
          </p>
        )}
      </div>

      {/* ── Control bar ───────────────────────────────────────────────── */}
      <div className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2">
        <div className="bg-card/90 flex items-center gap-6 rounded-full border px-6 py-4 shadow-2xl backdrop-blur-md">
          {/* Mute */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleMute}
              disabled={!isCallActive}
            >
              <HugeiconsIcon
                icon={micMuted ? MicOff01Icon : Mic01Icon}
                strokeWidth={2}
                className={`h-5 w-5 ${micMuted ? "text-destructive" : ""}`}
              />
            </Button>
            <span className="text-muted-foreground text-xs font-medium">
              {micMuted ? "Unmute" : "Mute"}
            </span>
          </div>

          {/* End Call */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="destructive"
              size="icon"
              className="shadow-destructive/20 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105"
              onClick={() => {
                stop();
                router.push("/interview");
              }}
              disabled={!isCallActive}
            >
              <HugeiconsIcon
                icon={PhoneOffIcon}
                strokeWidth={2}
                className="h-6 w-6"
              />
            </Button>
            <span className="text-destructive text-xs font-semibold">End</span>
          </div>
        </div>
      </div>
    </div>
  );
};
