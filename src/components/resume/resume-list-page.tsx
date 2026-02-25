"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Upload04Icon,
  Delete01Icon,
  FileValidationIcon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Briefcase02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { UploadResumeDialog } from "./upload-resume-dialog";
import { CreateResumeDialog } from "./create-resume-dialog";

type ResumeListItem = {
  id: string;
  fileName: string;
  key: string;
  jobId?: number | null;
  jobTitle?: string | null;
  company?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const ResumeListPage = () => {
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const {
    data: resumes,
    isLoading,
    error,
  } = useQuery<ResumeListItem[]>({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await client.resume.get();
      if (res.error || !res.data) throw new Error("Failed to load resumes");
      return res.data as unknown as ResumeListItem[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.resume({ id }).delete();
      if (res.error) throw new Error("Failed to delete resume");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete resume");
    },
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const filteredResumes = useMemo(() => {
    if (!resumes) return [];
    const q = search.toLowerCase().trim();
    if (!q) return resumes;
    return resumes.filter(
      (r) =>
        r.fileName.toLowerCase().includes(q) ||
        (r.jobTitle && r.jobTitle.toLowerCase().includes(q)) ||
        (r.company && r.company.toLowerCase().includes(q)),
    );
  }, [resumes, search]);

  return (
    <div className="mx-auto max-w-360 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium tracking-tight uppercase">
              Resumes
            </h1>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="text-muted-foreground"
              strokeWidth={2.5}
            />
          </div>
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2"
              strokeWidth={2}
            />
            <Input
              placeholder="Search resumes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="default" onClick={() => setCreateOpen(true)}>
            <HugeiconsIcon
              icon={PlusSignIcon}
              className="h-4 w-4"
              strokeWidth={2}
            />
            Create
          </Button>
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <HugeiconsIcon
              icon={Upload04Icon}
              className="h-4 w-4"
              strokeWidth={2}
            />
            Upload
          </Button>
        </div>
      </div>

      {/* Resume List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground animate-pulse text-sm">
            Loading resumes...
          </p>
        </div>
      ) : error ? (
        <div className="text-destructive rounded-md border border-dashed py-12 text-center">
          Failed to load resumes.
        </div>
      ) : !resumes || resumes.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center rounded-md border-2 border-dashed py-16 text-center">
          <HugeiconsIcon
            icon={FileValidationIcon}
            className="text-muted-foreground/50 mb-4 h-12 w-12"
            strokeWidth={1.5}
          />
          <p className="text-lg font-medium">No resumes yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Create a new resume or upload an existing one to get started.
          </p>
        </div>
      ) : filteredResumes.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center rounded-md border-2 border-dashed py-16 text-center">
          <p className="text-lg font-medium">
            No resumes match &ldquo;{search}&rdquo;
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredResumes.map((r) => (
            <div
              key={r.id}
              className="bg-card flex items-center gap-4 rounded-md border p-4 transition-all hover:shadow-md"
            >
              {/* Icon */}
              <div className="bg-primary/10 shrink-0 rounded-lg p-3">
                <HugeiconsIcon
                  icon={FileValidationIcon}
                  className="text-primary h-6 w-6"
                  strokeWidth={1.5}
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/resume/${r.id}`}
                    className="text-base font-semibold hover:underline"
                  >
                    {r.fileName}
                  </Link>
                  {r.jobTitle && (
                    <Badge
                      variant="secondary"
                      className="h-auto max-w-full gap-1 py-1 text-xs break-all whitespace-normal"
                      asChild
                    >
                      <Link href={`/jobs/${r.jobId}`}>
                        <HugeiconsIcon
                          icon={Briefcase02Icon}
                          className="h-3 w-3"
                        />
                        {r.jobTitle}
                        {r.company ? ` · ${r.company}` : ""}
                      </Link>
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Created {formatDate(r.createdAt)}
                  {r.updatedAt !== r.createdAt && (
                    <> · Updated {formatDate(r.updatedAt)}</>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/resume/${r.id}`}>
                    View{" "}
                    <HugeiconsIcon
                      icon={ArrowUpRight01Icon}
                      className="h-4 w-4"
                      strokeWidth={2}
                    />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => deleteMutation.mutate(r.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Spinner />
                  ) : (
                    <HugeiconsIcon
                      icon={Delete01Icon}
                      className="h-4 w-4"
                      strokeWidth={2}
                    />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <UploadResumeDialog open={uploadOpen} setOpen={setUploadOpen} />
      <CreateResumeDialog open={createOpen} setOpen={setCreateOpen} />
    </div>
  );
};
