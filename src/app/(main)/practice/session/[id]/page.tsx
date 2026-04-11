"use client";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useEffectEvent,
} from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Session } from "../../results/[id]/page";
import { use } from "react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Flag01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Spinner } from "@/components/ui/spinner";

export default function InterviewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: sessionId } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitTriggered = useRef(false);

  useEffect(() => {
    const init = async () => {
      const res = await client.interview.sessions({ id: sessionId }).get();
      if (res.data) {
        if (res.data.status !== "in_progress") {
          router.replace(`/practice/results/${sessionId}`);
          return;
        }
        setSession(res.data);
        const savedAnswers = localStorage.getItem(
          `interview_${sessionId}_answers`,
        );
        if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
        const savedStart = localStorage.getItem(`interview_${sessionId}_start`);
        const durationMinutes = res.data.durationMinutes;
        if (savedStart) {
          const startTime = new Date(savedStart).getTime();
          const targetTime = startTime + durationMinutes * 60 * 1000;
          const left = targetTime - Date.now();
          setTimeLeftMs(left > 0 ? left : 0);
        } else {
          setTimeLeftMs(durationMinutes * 60 * 1000);
          localStorage.setItem(
            `interview_${sessionId}_start`,
            new Date().toISOString(),
          );
        }
      }
    };
    init();
  }, [sessionId, router]);

  const handleSubmit = useCallback(async () => {
    if (!session || submitting) return;
    setSubmitting(true);
    try {
      const answersPayload = session.questions.map((q) => ({
        questionId: q.id,
        userAnswer: answers[q.id] || "",
      }));
      const res = await client.interview
        .sessions({ id: sessionId })
        .submit.post({ answers: answersPayload });
      if (res.data?.success) {
        localStorage.removeItem(`interview_${sessionId}_answers`);
        localStorage.removeItem(`interview_${sessionId}_start`);
        localStorage.removeItem(`interview_${sessionId}_duration`);
        router.push(`/practice/results/${sessionId}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to submit.");
      setSubmitting(false);
      submitTriggered.current = false;
    }
  }, [session, submitting, answers, sessionId, router]);

  const handleSubmitEvent = useEffectEvent(() => {
    handleSubmit();
  });

  useEffect(() => {
    if (timeLeftMs === null || submitting) return;
    if (timeLeftMs <= 0 && !submitTriggered.current) {
      submitTriggered.current = true;
      handleSubmitEvent();
      return;
    }
    const interval = setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev === null) return null;
        if (prev <= 1000) {
          if (!submitTriggered.current) {
            submitTriggered.current = true;
            handleSubmit();
          }
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeftMs, submitting, handleSubmit]);

  const handleAnswerChange = (text: string) => {
    if (!session) return;
    const questionId = session.questions[currentQuestionIndex].id;
    const newAnswers = { ...answers, [questionId]: text };
    setAnswers(newAnswers);
    localStorage.setItem(
      `interview_${sessionId}_answers`,
      JSON.stringify(newAnswers),
    );
  };

  if (!session || timeLeftMs === null) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8" />
          <p>Loading practice...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const isLastQuestion = currentQuestionIndex === session.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isUrgent = timeLeftMs < 60000;
  const isWarning = timeLeftMs < 5 * 60000;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const confirmFinish = () => {
    if (confirm("Are you sure you want to finish the practice early?")) {
      submitTriggered.current = true;
      handleSubmit();
    }
  };

  return (
    <div className="bg-background flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* ── Top Bar ── */}
      <header className="bg-card border-border flex shrink-0 items-center justify-between rounded-b-xl border-b px-5 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold tracking-tight sm:text-lg">
            Practice Session
          </h1>
          <div className="bg-border hidden h-6 w-[2px] sm:block" />
          <span className="hidden text-sm sm:block">
            {answeredCount} of {session.questions.length} answered
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-sm font-bold tabular-nums transition-colors ${
              isUrgent
                ? "border-red-500/30 bg-red-500/10 text-red-500"
                : isWarning
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                  : "border-border bg-muted/50 text-foreground"
            }`}
          >
            <HugeiconsIcon
              icon={Clock01Icon}
              strokeWidth={2}
              size={16}
              className={
                isUrgent
                  ? "text-red-500"
                  : isWarning
                    ? "text-amber-500"
                    : "text-muted-foreground"
              }
            />
            {formatTime(timeLeftMs)}
          </div>

          <Button
            onClick={confirmFinish}
            variant="destructive"
            disabled={submitting}
            className="gap-1.5 text-xs sm:text-sm"
          >
            <HugeiconsIcon strokeWidth={2} icon={Flag01Icon} size={16} />
            <span className="hidden sm:inline">
              {submitting ? "Submitting…" : "Submit"}
            </span>
            <span className="sm:hidden">{submitting ? "..." : "Submit"}</span>
          </Button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel ── */}
        <aside className="bg-muted/10 max-sm:bg-card flex w-[280px] shrink-0 flex-col border-r max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-10 max-sm:h-auto max-sm:w-full max-sm:border-t max-sm:border-r-0 lg:w-[320px]">
          {/* Question nav dots — mobile: horizontal strip, desktop: grid */}
          <div className="border-b p-4 sm:p-5">
            <p className="text-muted-foreground mb-3 hidden text-xs font-bold tracking-[0.15em] uppercase sm:block">
              Questions
            </p>
            <div className="flex flex-wrap gap-2">
              {session.questions.map((q, i) => {
                const isActive = i === currentQuestionIndex;
                const isAnswered = !!answers[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-xl font-bold transition-all ${
                      isActive
                        ? "bg-foreground text-background scale-105 shadow-sm"
                        : isAnswered
                          ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground border"
                    }`}
                  >
                    {i + 1}
                    {isAnswered && !isActive && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                        <HugeiconsIcon
                          icon={Tick01Icon}
                          strokeWidth={2}
                          size={15}
                          className="text-white"
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question text — hidden on mobile (shown in main area instead) */}
          <div className="hidden flex-1 flex-col gap-4 overflow-y-auto p-6 sm:flex">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-bold tracking-[0.15em] uppercase">
                Question {currentQuestionIndex + 1}
              </p>
              <div className="bg-foreground/20 h-px w-8 rounded-full" />
            </div>
            <p className="text-foreground/90 text-base leading-relaxed">
              {currentQuestion.questionText}
            </p>

            {/* Progress */}
            <div className="mt-auto space-y-2 border-t pt-4">
              <div className="text-muted-foreground flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-semibold">
                  {answeredCount}/{session.questions.length}
                </span>
              </div>
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${(answeredCount / session.questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Prev / Next — desktop */}
          <div className="hidden items-center justify-between gap-3 border-t p-5 sm:flex">
            <Button
              variant="outline"
              size="sm"
              disabled={isFirstQuestion}
              onClick={() => setCurrentQuestionIndex((p) => p - 1)}
              className="flex-1 cursor-pointer gap-1.5"
            >
              <HugeiconsIcon strokeWidth={2} icon={ArrowLeft01Icon} size={14} />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isLastQuestion}
              onClick={() => setCurrentQuestionIndex((p) => p + 1)}
              className="flex-1 cursor-pointer gap-1.5"
            >
              Next
              <HugeiconsIcon
                strokeWidth={2}
                icon={ArrowRight01Icon}
                size={14}
              />
            </Button>
          </div>
        </aside>

        {/* ── Right Panel ── */}
        <main className="flex flex-1 flex-col overflow-hidden max-sm:pb-[100px]">
          {/* Question text — mobile only */}
          <div className="bg-muted/10 border-b px-5 py-5 sm:hidden">
            <p className="text-muted-foreground mb-1.5 text-[10px] font-bold tracking-[0.15em] uppercase">
              Question {currentQuestionIndex + 1}
            </p>
            <p className="text-foreground/90 text-sm leading-relaxed">
              {currentQuestion.questionText}
            </p>
          </div>

          {/* Answer area */}
          <div className="flex flex-1 flex-col gap-4 overflow-hidden p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-xs font-bold tracking-[0.15em] uppercase">
                  Your Answer
                </p>
                <div className="bg-foreground/20 h-px w-8 rounded-full" />
              </div>
              {answers[currentQuestion.id] && (
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    strokeWidth={2}
                    size={16}
                    className="text-emerald-500"
                  />
                  Answered
                </div>
              )}
            </div>

            <Textarea
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your answer here…"
              className="border-border/60 bg-muted/20 focus:bg-background placeholder:text-muted-foreground/40 flex-1 resize-none rounded-xl p-4 text-sm leading-relaxed transition-colors"
              disabled={submitting}
            />

            {/* Mobile nav */}
            <div className="flex items-center gap-3 sm:hidden">
              <Button
                variant="outline"
                size="sm"
                disabled={isFirstQuestion}
                onClick={() => setCurrentQuestionIndex((p) => p - 1)}
                className="flex-1 gap-1.5"
              >
                <HugeiconsIcon
                  strokeWidth={2}
                  icon={ArrowLeft01Icon}
                  size={14}
                />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isLastQuestion}
                onClick={() => setCurrentQuestionIndex((p) => p + 1)}
                className="flex-1 gap-1.5"
              >
                Next
                <HugeiconsIcon
                  strokeWidth={2}
                  icon={ArrowRight01Icon}
                  size={14}
                />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
