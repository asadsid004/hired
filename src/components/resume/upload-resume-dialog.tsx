"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "../ui/revola";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { FileUpload } from "../file-upload";
import { Spinner } from "../ui/spinner";

interface UploadResumeDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const UploadResumeDialog = ({
  open,
  setOpen,
}: UploadResumeDialogProps) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const res = await client.resume.upload.post({ file });
      if (res.error) {
        throw new Error("Failed to upload resume");
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success("Resume uploaded and extracted successfully!");
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setFile(null);
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader className="mb-4 text-center!">
          <ResponsiveDialogTitle>Upload Resume</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Upload a PDF resume to extract and save your details.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4">
          <FileUpload
            accept=".pdf"
            maxSize={5 * 1024 * 1024}
            onFileSelect={setFile}
            value={file}
            label="Upload your resume"
            description="Drag and drop your resume here, or click to browse. Accepted format: PDF. Max size: 5MB."
            showPreview
            disabled={uploadMutation.isPending}
          />

          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setFile(null);
                setOpen(false);
              }}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              disabled={!file || uploadMutation.isPending}
              onClick={() => file && uploadMutation.mutate(file)}
            >
              {uploadMutation.isPending ? (
                <>
                  <Spinner /> Uploading...
                </>
              ) : (
                "Upload & Extract"
              )}
            </Button>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
