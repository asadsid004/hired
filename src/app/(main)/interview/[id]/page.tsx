"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PhoneOffIcon,
  Mic01Icon,
  MicOff01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { client } from "@/lib/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type CallStatus = "idle" | "connecting" | "connected" | "ended";

type TranscriptEntry = {
  role: "user" | "assistant";
  text: string;
};

// ─── VAPI system prompt builder ───────────────────────────────────────────────

function buildSystemPrompt(
  jobRole: string,
  jobDescription: string,
  interviewType: string,
  difficulty: string,
) {
  const typeLine =
    interviewType === "behavioral"
      ? "Focus on behavioural questions (STAR method, situational, past experience)."
      : interviewType === "technical"
        ? "Focus on technical depth: architecture, code design, debugging, and domain knowledge."
        : "Mix behavioural and technical questions equally.";

  const difficultyLine =
    difficulty === "easy"
      ? "Keep questions accessible and beginner-friendly."
      : difficulty === "hard"
        ? "Push the candidate with advanced, nuanced follow-ups and edge cases."
        : "Use medium-difficulty questions with reasonable follow-ups.";

  return `You are an expert interviewer conducting a realistic voice mock interview.
Role being interviewed for: ${jobRole}.
Job description: ${jobDescription}.

${typeLine}
${difficultyLine}

Guidelines:
- Greet the candidate warmly and briefly explain the format.
- Ask one question at a time and wait for the answer before proceeding.
- Ask 5–7 questions in total, then wrap up with "That concludes our interview."
- Be professional but encouraging. Give brief verbal acknowledgements (e.g. "Got it", "Interesting").
- Do NOT give scores or detailed feedback during the call — just conduct the interview naturally.`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LiveInterviewPage() {
  const rawId = useParams().id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();

  // Use a ref so VAPI instance is always fresh inside callbacks
  const vapiRef = useRef<Vapi | null>(null);

  const [status, setStatus] = useState<CallStatus>("idle");
  const [micMuted, setMicMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<"user" | "assistant" | null>(
    null,
  );
  const [volume, setVolume] = useState(0); // 0–1 range from VAPI
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [sessionData, setSessionData] = useState<{
    jobRole: string;
    jobDescription: string;
    interviewType: string;
    difficulty: string;
  } | null>(null);

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll captions
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  // ── beforeunload guard ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (status === "connecting" || status === "connected") {
        e.preventDefault();
        e.returnValue =
          "Your interview is still active. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [status]);

  // ── Fetch session & start call ─────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    const init = async () => {
      setStatus("connecting");

      try {
        const res = await client.interview.sessions({ id }).get();
        if (!res.data || res.error) throw new Error("Session not found");

        const session = res.data as unknown as {
          jobRole: string;
          jobDescription: string;
          interviewType: string;
          difficulty: string;
        };

        setSessionData(session);

        const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
        if (!publicKey) throw new Error("VAPI public key is not configured.");

        const vapi = new Vapi(publicKey);
        vapiRef.current = vapi;

        vapi.on("call-start", () => {
          console.log("Call started");
          setStatus("connected");
        });
        vapi.on("call-end", () => {
          setStatus("ended");
          // Give the webhook a moment to process, then redirect
          setTimeout(() => router.push("/interview"), 3000);
        });
        vapi.on("speech-start", () => setIsSpeaking("assistant"));
        vapi.on("speech-end", () => setIsSpeaking(null));
        vapi.on("volume-level", (v: number) => setVolume(v));
        vapi.on("message", (msg) => {
          if (msg.type === "transcript" && msg.transcriptType === "final") {
            setTranscripts((prev) => [
              ...prev,
              { role: msg.role as "user" | "assistant", text: msg.transcript },
            ]);
            const callId =
              msg?.call?.id || msg?.callId || msg?.message?.call?.id;
            console.log("Call ID", callId);

            // Track user speaking separately
            if (msg.role === "user") setIsSpeaking("user");
          }
        });
        vapi.on("error", (err: Error) => {
          console.error("[VAPI error]", err);
          toast.error(`Connection error: ${err.message}`);
          setStatus("ended");
        });

        const call = await vapi.start({
          name: `Mock Interview – ${session.jobRole}`,
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: buildSystemPrompt(
                  session.jobRole,
                  session.jobDescription,
                  session.interviewType ?? "technical",
                  session.difficulty ?? "medium",
                ),
              },
            ],
          },
          voice: {
            provider: "11labs",
            voiceId: "bIHbv24MWmeRgasZH58o", // Will Cross – natural voice
          },
          // Pass our DB id so the end-of-call webhook can find the right row
          metadata: {
            interviewId: id,
          },
        });
        console.log("Call ID", call?.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to start interview: ${message}`);
        setStatus("idle");
      }
    };

    init();

    return () => {
      vapiRef.current?.stop();
      vapiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    const next = !micMuted;
    vapi.setMuted(next);
    setMicMuted(next);
  }, [micMuted]);

  const endCall = useCallback(() => {
    vapiRef.current?.stop();
    setStatus("ended");
  }, []);

  // ── Orb size driven by volume ──────────────────────────────────────────────
  const orbScale = 1 + volume * 1.8;
  const isAssistantSpeaking =
    isSpeaking === "assistant" || (status === "connected" && volume > 0.05);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-background relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-between overflow-hidden p-4">
      {/* ── Status bar ────────────────────────────────────────────────── */}
      <div className="z-10 flex w-full max-w-2xl items-center justify-between pt-4">
        <p className="text-muted-foreground text-sm font-medium">
          {sessionData?.jobRole ?? "Mock Interview"}
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            status === "connected"
              ? "bg-green-500/15 text-green-500"
              : status === "connecting"
                ? "bg-yellow-500/15 text-yellow-500"
                : status === "ended"
                  ? "bg-muted text-muted-foreground"
                  : "bg-muted text-muted-foreground"
          }`}
        >
          {status === "connected"
            ? "● Live"
            : status === "connecting"
              ? "Connecting…"
              : status === "ended"
                ? "Ended"
                : "Idle"}
        </span>
      </div>

      {/* ── Main visualisation area ───────────────────────────────────── */}
      <div className="z-0 flex w-full flex-1 flex-col items-center justify-center gap-6">
        {/* Interviewer Orb */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative flex items-center justify-center"
            style={{
              transition: "transform 0.15s ease-out",
              transform: `scale(${isAssistantSpeaking ? orbScale : 1})`,
            }}
          >
            {/* Outer glow ring */}
            <div
              className={`absolute h-48 w-48 rounded-full transition-opacity duration-300 ${
                isAssistantSpeaking ? "opacity-100" : "opacity-0"
              }`}
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary)/0.25) 0%, transparent 70%)",
              }}
            />
            {/* Main blob */}
            <div
              className="flex h-36 w-36 items-center justify-center rounded-full shadow-2xl"
              style={{
                background: isAssistantSpeaking
                  ? `radial-gradient(circle at 35% 35%, hsl(var(--primary)/0.9), hsl(var(--primary)/0.5))`
                  : `radial-gradient(circle at 35% 35%, hsl(var(--primary)/0.6), hsl(var(--primary)/0.3))`,
                boxShadow: isAssistantSpeaking
                  ? "0 0 60px hsl(var(--primary)/0.4)"
                  : "0 0 30px hsl(var(--primary)/0.15)",
                transition: "all 0.2s ease-out",
              }}
            >
              <span className="text-primary-foreground text-3xl font-bold select-none">
                AI
              </span>
            </div>
          </div>
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Interviewer
          </p>
        </div>

        {/* Divider */}
        <div className="text-muted-foreground/30 text-xs">· · ·</div>

        {/* User blob */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full border-2 shadow-lg"
            style={{
              background: micMuted
                ? "hsl(var(--muted)/0.5)"
                : "radial-gradient(circle at 35% 35%, hsl(var(--secondary)/0.8), hsl(var(--muted)/0.6))",
              borderColor: micMuted
                ? "hsl(var(--destructive)/0.4)"
                : "hsl(var(--border))",
              transition: "all 0.2s ease-out",
            }}
          >
            <HugeiconsIcon
              icon={UserCircleIcon}
              strokeWidth={1.5}
              className="text-muted-foreground h-10 w-10"
            />
          </div>
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {micMuted ? "Muted" : "You"}
          </p>
        </div>
      </div>

      {/* ── Live captions ─────────────────────────────────────────────── */}
      <div className="z-10 w-full max-w-2xl px-2 pb-32">
        {transcripts.length > 0 && (
          <Card className="border-primary/15 bg-background/80 shadow-xl backdrop-blur-md">
            <div className="max-h-36 space-y-2 overflow-y-auto p-4">
              {transcripts.slice(-6).map((t, i) => (
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
                  <span className="text-muted-foreground">{t.text}</span>
                </p>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </Card>
        )}

        {/* Connecting placeholder */}
        {status === "connecting" && transcripts.length === 0 && (
          <p className="text-muted-foreground animate-pulse text-center text-sm">
            Connecting to your interviewer…
          </p>
        )}

        {/* Ended message */}
        {status === "ended" && (
          <p className="text-muted-foreground text-center text-sm">
            Interview ended. Redirecting to your dashboard…
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
              disabled={status !== "connected"}
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
              onClick={endCall}
              disabled={status === "ended" || status === "idle"}
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
}
