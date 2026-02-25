import { useForm } from "@tanstack/react-form";
import z from "zod";
import { FieldError, FieldLegend, FieldSet } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { toast } from "sonner";
import { ResumeProfile } from "@/lib/ai/schemas/resume.schema";
import { Spinner } from "../ui/spinner";

interface TailorResumeFormProps {
  setOpen: (open: boolean) => void;
  resumeId: string;
  setLocalData: (data: ResumeProfile) => void;
}

export const TailorResumeForm = ({
  setOpen,
  resumeId,
  setLocalData,
}: TailorResumeFormProps) => {
  const tailorMutation = useMutation({
    mutationFn: async ({
      jobTitle,
      jobDescription,
    }: {
      jobTitle: string;
      jobDescription: string;
    }) => {
      const res = await client.resume({ id: resumeId }).tailor.post({
        jobTitle,
        jobDescription,
      });

      if (res.error) {
        throw new Error(
          res.error.value?.toString() || "Failed to tailor resume",
        );
      }

      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Resume tailored successfully!");
      if (data?.data) {
        setLocalData(data.data as ResumeProfile);
      }
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
      }),
    },
    defaultValues: {
      jobTitle: "",
      jobDescription: "",
    },
    onSubmit: async ({ value }) => {
      tailorMutation.mutate(value);
    },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
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
                placeholder="e.g. Responsibilities, Technologies, etc."
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
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
        >
          Cancel
        </Button>
        <Button type="submit" disabled={tailorMutation.isPending}>
          {tailorMutation.isPending ? (
            <>
              <Spinner /> Tailoring...
            </>
          ) : (
            "Tailor Resume"
          )}
        </Button>
      </div>
    </form>
  );
};
