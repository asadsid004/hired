"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";
import { client } from "@/lib/client";

type Role = "user" | "assistant";
export type InterviewLiveMessage = { role: Role; content: string };

export type CallStatus =
  | "idle"
  | "creating"
  | "connecting"
  | "starting"
  | "listening"
  | "thinking"
  | "speaking"
  | "ended"
  | "processing";

const TIMER_INTERVAL_MS = 1000;

export function useInterviewVapi() {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [liveMessages, setLiveMessages] = useState<InterviewLiveMessage[]>([]);
  const [currentAssistantPartial, setCurrentAssistantPartial] = useState("");
  const [currentUserPartial, setCurrentUserPartial] = useState("");
  const [micMuted, setMicMuted] = useState(false);
  const [volume, setVolume] = useState(0);

  const [durationSeconds, setDurationSeconds] = useState(0);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState<number>(15 * 60);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const vapiRef = useRef<InstanceType<typeof Vapi> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    startTimeRef.current = null;
  }, []);

  const setProcessingStatus = useCallback(async () => {
    setStatus("processing");
    clearTimer();
    if (interviewId) {
      try {
        await client.interview.sessions({ id: interviewId }).status.patch({ status: "processing" });
      } catch (err) {
        console.error("Failed to update status to processing", err);
      }
    }
  }, [interviewId, clearTimer]);

  const getVapi = useCallback(() => {
    if (!vapiRef.current) {
      const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
      if (!publicKey) throw new Error("NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set");
      vapiRef.current = new Vapi(publicKey);
    }
    return vapiRef.current;
  }, []);

  useEffect(() => {
    let vapi: InstanceType<typeof Vapi>;
    try {
      vapi = getVapi();
    } catch (err) {
      console.error((err as Error).message);
      return;
    }

    const onCallStart = () => {
      setError(null);
      setStatus("starting");
      startTimeRef.current = Date.now();
      setDurationSeconds(0);
    };

    const onCallEnd = () => {
      setProcessingStatus();
      setCurrentAssistantPartial("");
      setCurrentUserPartial("");
      setVolume(0);
    };

    const onSpeechStart = () => setStatus("speaking");
    const onSpeechEnd = () => setStatus("listening");
    const onVolumeLevel = (v: number) => setVolume(v);

    const onMessage = (message: { type: string; role: string; transcriptType: string; transcript: string; }) => {
      if (message?.type !== "transcript") return;

      const role = message.role as Role;
      const transcriptType = message.transcriptType as "partial" | "final";
      const transcript = message.transcript as string;

      if (role === "user" && transcriptType === "partial") {
        setCurrentUserPartial(transcript);
        return;
      }
      if (role === "assistant" && transcriptType === "partial") {
        setCurrentAssistantPartial(transcript);
        return;
      }

      if (transcriptType === "final") {
        if (role === "user") {
          setCurrentUserPartial("");
          setStatus("thinking");
        } else {
          setCurrentAssistantPartial("");
        }

        setLiveMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === role && last?.content === transcript) return prev;
          return [...prev, { role, content: transcript }];
        });
      }
    };

    const onError = (e: Error) => {
      console.error("Vapi error:", e);
      setStatus("idle");
      clearTimer();
      setError(e?.message || "Call ended unexpectedly. Please try again.");
    };

    const onNetworkQuality = (e: Error) => {
      if (e.message === "poor") {
        toast.warning("Poor network connectivity detected");
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("volume-level", onVolumeLevel);
    vapi.on("message", onMessage);
    vapi.on("error", onError);
    vapi.on("network-quality-change", onNetworkQuality);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("volume-level", onVolumeLevel);
      vapi.off("message", onMessage);
      vapi.off("error", onError);
      vapi.off("network-quality-change", onNetworkQuality);
    };
  }, [clearTimer, getVapi, setProcessingStatus]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "starting" || status === "listening" || status === "thinking" || status === "speaking") {
      if (!startTimeRef.current) startTimeRef.current = Date.now();
      
      interval = setInterval(() => {
        if (!startTimeRef.current) return;
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDurationSeconds(secs);

        if (secs >= maxDurationSeconds) {
          getVapi().stop();
          setProcessingStatus();
        }
      }, TIMER_INTERVAL_MS);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, maxDurationSeconds, getVapi, setProcessingStatus]);

  const start = useCallback(
    async (
      input: {
        interviewId: string;
        jobRole?: string;
        jobDescription?: string;
        interviewType?: string;
        difficulty?: string;
        maxDurationSeconds?: number;
      }
    ) => {
      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
      if (!assistantId) {
        setError("VAPI Assistant ID not configured");
        return;
      }

      setError(null);
      setStatus("connecting");
      setLiveMessages([]);
      setCurrentAssistantPartial("");
      setCurrentUserPartial("");
      setDurationSeconds(0);
      setInterviewId(input.interviewId);
      setMaxDurationSeconds(input.maxDurationSeconds ?? 15 * 60);

      console.log("Starting interview with assistant ID:", assistantId);
      console.log(input);

      try {
        await getVapi().start(assistantId, {
          variableValues: {
            jobRole: input.jobRole || "",
            jobDescription: input.jobDescription || "",
            interviewType: input.interviewType || "technical",
            difficulty: input.difficulty || "medium",
          },
          metadata: {
            interviewId: input.interviewId,
          },
        });
      } catch (err) {
        setStatus("idle");
        setError((err as Error).message || "Failed to start interview");
      }
    },
    [getVapi]
  );

  const stop = useCallback(() => {
    getVapi().stop();
    setProcessingStatus();
  }, [getVapi, setProcessingStatus]);

  const toggleMute = useCallback(() => {
    const vapi = getVapi();
    const next = !vapi.isMuted();
    vapi.setMuted(next);
    setMicMuted(next);
  }, [getVapi]);

  return {
    status,
    error,
    interviewId,
    liveMessages,
    currentAssistantPartial,
    currentUserPartial,
    durationSeconds,
    maxDurationSeconds,
    micMuted,
    volume,
    start,
    stop,
    toggleMute,
  };
}
