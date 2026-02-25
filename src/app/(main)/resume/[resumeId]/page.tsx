"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { ResumeProfile } from "@/lib/ai/schemas/resume.schema";
import { ResumeEditor } from "../../../../components/resume/resume-editor";
import ResumePreview from "../../../../components/resume/resume-preview";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  FloppyDiskIcon,
  Delete01Icon,
} from "@hugeicons/core-free-icons";
import { Spinner } from "@/components/ui/spinner";
import { TailorResumeDialog } from "@/components/resume/tailor-resume-dialog";

export default function ResumeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const resumeId = params.resumeId as string;

  const [localData, setLocalData] = useState<ResumeProfile | null>(null);

  const {
    data: resumeRecord,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["resume", resumeId],
    queryFn: async () => {
      const res = await client.resume({ id: resumeId }).get();
      if (res.error || !res.data) throw new Error("Failed to load resume");
      return res.data;
    },
  });

  if (resumeRecord?.data && !localData) {
    setLocalData(resumeRecord.data as ResumeProfile);
  }

  const updateResume = useMutation({
    mutationFn: async (newData: ResumeProfile) => {
      const res = await client
        .resume({ id: resumeId })
        .data.patch({ data: newData });
      if (res.error) throw new Error("Failed to save resume");
      return res.data;
    },
    onSuccess: (updatedRecord) => {
      queryClient.setQueryData(["resume", resumeId], updatedRecord);
    },
  });

  const deleteResume = useMutation({
    mutationFn: async () => {
      const res = await client.resume({ id: resumeId }).delete();
      if (res.error) throw new Error("Failed to delete resume");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume"] });
      router.push("/resume");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-sm">
          Loading resume details...
        </p>
      </div>
    );
  }

  if (error || !resumeRecord || !localData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive mb-4">Failed to load resume.</p>
        <Button onClick={() => router.push("/resume")}>Back to Resumes</Button>
      </div>
    );
  }

  const isChanged =
    JSON.stringify(localData) !== JSON.stringify(resumeRecord.data);

  return (
    <div className="mx-auto max-w-360 space-y-6 pt-4 pb-12">
      {/* Back button */}
      <Button
        variant="ghost"
        className="text-muted-foreground hover:text-foreground gap-2"
        onClick={() => router.push("/resume")}
      >
        <HugeiconsIcon
          icon={ArrowLeft01Icon}
          strokeWidth={2}
          className="h-4 w-4"
        />
        Back to Resumes
      </Button>

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {resumeRecord.fileName || "Untitled Resume"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage and optimize your resume
          </p>
        </div>

        <div className="flex items-center gap-3">
          <TailorResumeDialog resumeId={resumeId} setLocalData={setLocalData} />
          <Button
            variant="default"
            disabled={!isChanged || updateResume.isPending}
            onClick={() => updateResume.mutate(localData)}
          >
            {updateResume.isPending ? (
              <>
                <Spinner />
                Saving...
              </>
            ) : (
              <>
                <HugeiconsIcon
                  icon={FloppyDiskIcon}
                  className="h-4 w-4"
                  strokeWidth={2}
                />
                Save Changes
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => deleteResume.mutate()}
          >
            {deleteResume.isPending ? (
              <>
                <Spinner />
                Deleting...
              </>
            ) : (
              <>
                <HugeiconsIcon
                  icon={Delete01Icon}
                  className="h-4 w-4"
                  strokeWidth={2}
                />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="edit">Edit Details</TabsTrigger>
          <TabsTrigger value="preview">Preview PDF</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-0">
          <ResumeEditor data={localData} onChange={setLocalData} />
        </TabsContent>

        <TabsContent value="preview" className="mt-0 space-y-4">
          <ResumePreview
            data={localData}
            fileName={resumeRecord.fileName ?? "resume"}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
