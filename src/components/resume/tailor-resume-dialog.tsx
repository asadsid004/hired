"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "../ui/revola";
import { Button } from "../ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { MagicWand01Icon } from "@hugeicons/core-free-icons";
import { TailorResumeForm } from "./tailor-resume-form";
import { useState } from "react";

import { ResumeProfile } from "@/lib/ai/schemas/resume.schema";

interface TailorResumeDialogProps {
  resumeId: string;
  setLocalData: (data: ResumeProfile) => void;
}

export const TailorResumeDialog = ({
  resumeId,
  setLocalData,
}: TailorResumeDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <HugeiconsIcon
            icon={MagicWand01Icon}
            className="text-primary h-4 w-4"
            strokeWidth={2}
          />
          Tailor Resume
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader className="text-center!">
          <ResponsiveDialogTitle>Tailor Resume</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Tailor your resume to a specific job description.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <TailorResumeForm
          setOpen={setOpen}
          resumeId={resumeId}
          setLocalData={setLocalData}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
