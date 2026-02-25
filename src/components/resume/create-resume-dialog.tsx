"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "../ui/revola";
import { useForm } from "@tanstack/react-form";
import z from "zod";
import { FieldError, FieldLegend, FieldSet } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { toast } from "sonner";
import { Spinner } from "../ui/spinner";

interface CreateResumeDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const CreateResumeDialog = ({
  open,
  setOpen,
}: CreateResumeDialogProps) => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async ({
      jobTitle,
      jobDescription,
      fileName,
    }: {
      jobTitle: string;
      jobDescription: string;
      fileName: string;
    }) => {
      const res = await client.resume.create.post({
        jobTitle,
        jobDescription,
        fileName: fileName || undefined,
      });

      if (res.error) {
        throw new Error("Failed to create resume");
      }

      return res.data;
    },
    onSuccess: () => {
      toast.success("Resume created successfully!");
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    validators: {
      onSubmit: z.object({
        jobTitle: z.string().min(1, "Job title is required"),
        jobDescription: z.string().min(1, "Job description is required"),
        fileName: z.string(),
      }),
    },
    defaultValues: {
      jobTitle: "",
      jobDescription: "",
      fileName: "",
    },
    onSubmit: async ({ value }) => {
      createMutation.mutate(value);
    },
  });

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader className="mb-4 text-center!">
          <ResponsiveDialogTitle>Create Resume</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Generate a tailored resume from your profile for a specific job.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="fileName">
            {(field) => (
              <FieldSet>
                <FieldLegend variant="label" className="mb-1">
                  Resume Name (Optional)
                </FieldLegend>
                <Input
                  placeholder="e.g. Google SWE Resume"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={createMutation.isPending}
                />
              </FieldSet>
            )}
          </form.Field>

          <form.Field name="jobTitle">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <FieldSet>
                  <FieldLegend variant="label" className="mb-1">
                    Job Title
                  </FieldLegend>
                  <Input
                    placeholder="e.g. Backend Developer"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={createMutation.isPending}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </FieldSet>
              );
            }}
          </form.Field>

          <form.Field name="jobDescription">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <FieldSet>
                  <FieldLegend variant="label" className="mb-1">
                    Job Description
                  </FieldLegend>
                  <Textarea
                    className="max-h-[150px] overflow-y-scroll"
                    placeholder="Paste the job description here..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={createMutation.isPending}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </FieldSet>
              );
            }}
          </form.Field>

          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                form.reset();
                setOpen(false);
              }}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Spinner /> Creating...
                </>
              ) : (
                "Create Resume"
              )}
            </Button>
          </div>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
