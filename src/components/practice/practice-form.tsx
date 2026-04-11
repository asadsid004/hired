"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { client } from "@/lib/client";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const practiceSchema = z.object({
  topics: z.string().min(1, "Topics are required"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionCount: z.number().min(1).max(20),
  durationMinutes: z.number().min(5).max(120),
});

export const PracticeForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      topics: "",
      difficulty: "medium",
      questionCount: 5,
      durationMinutes: 30,
    },
    validators: {
      onChange: practiceSchema,
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      try {
        const parsedTopics = value.topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        const res = await client.interview.sessions.post({
          topics: parsedTopics,
          difficulty: value.difficulty,
          durationMinutes: value.durationMinutes,
          questionCount: value.questionCount,
        });

        if (res.data) {
          localStorage.setItem(
            `interview_${res.data.sessionId}_duration`,
            value.durationMinutes.toString(),
          );
          localStorage.setItem(
            `interview_${res.data.sessionId}_start`,
            new Date().toISOString(),
          );

          toast.success("Practice session created!");
          queryClient.invalidateQueries({ queryKey: ["practice-sessions"] });
          onSuccess?.();
          router.push(`/practice/session/${res.data.sessionId}`);
        } else {
          toast.error("Failed to start session.");
        }
      } catch (err) {
        console.error((err as Error).message);
        toast.error("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="w-full space-y-6"
    >
      {/* Topics */}
      <form.Field name="topics">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="topics">Topics (comma separated)</Label>

            <Textarea
              id="topics"
              placeholder="Operating Systems, Computer Networks, Logical Reasoning, ..."
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="min-h-[80px]"
            />

            {field.state.meta.errors?.length > 0 && (
              <p className="text-destructive text-sm">
                {field.state.meta.errors[0]?.message}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Other Inputs */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Difficulty */}
        <form.Field name="difficulty">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>

              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
              >
                <SelectTrigger id="difficulty" className="w-full">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        {/* Question Count */}
        <form.Field name="questionCount">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="questionCount">Number of Questions</Label>

              <Input
                id="questionCount"
                type="number"
                min={1}
                max={20}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(Number(e.target.value) || 1)
                }
              />
            </div>
          )}
        </form.Field>

        {/* Duration */}
        <form.Field name="durationMinutes">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (Minutes)</Label>

              <Input
                id="durationMinutes"
                type="number"
                min={5}
                max={120}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(Number(e.target.value) || 5)
                }
              />
            </div>
          )}
        </form.Field>

        {/* Submit Button */}
        <div className="flex items-end justify-end pb-2">
          <Button
            type="submit"
            size="lg"
            className="w-full md:w-auto"
            disabled={loading || !form.state.canSubmit}
          >
            {loading ? "Generating..." : "Start Session"}
          </Button>
        </div>
      </div>
    </form>
  );
};
