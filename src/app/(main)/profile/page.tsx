"use client";

import React, { useMemo, useState } from "react";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { ResumeProfile } from "@/lib/ai/schemas/resume.schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, FloppyDiskIcon } from "@hugeicons/core-free-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/client";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [localProfile, setLocalProfile] = useState<ResumeProfile | null>(null);

  const emptyProfile = useMemo<ResumeProfile>(
    () => ({
      personalInfo: {
        name: "",
        email: "",
        phone: null,
        location: null,
      },
    }),
    [],
  );

  const {
    data: serverProfile,
    isLoading,
    error,
  } = useQuery<ResumeProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await client.profile.get();
      if (res.error) throw new Error("Failed to load profile");
      return (res.data ?? null) as ResumeProfile | null;
    },
  });

  if (!localProfile && !isLoading && !error) {
    setLocalProfile(serverProfile ?? emptyProfile);
  }

  const isChanged = useMemo(() => {
    if (!localProfile) return false;
    return (
      JSON.stringify(localProfile) !==
      JSON.stringify(serverProfile ?? emptyProfile)
    );
  }, [emptyProfile, localProfile, serverProfile]);

  const saveProfile = useMutation({
    mutationFn: async (profile: ResumeProfile) => {
      const res = await client.profile.post(profile);
      if (res.error) throw new Error("Failed to save profile");
      return res.data as ResumeProfile;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(["profile"], saved);
      setLocalProfile(saved);
      toast.success("Profile saved successfully!");
    },
    onError: () => {
      toast.error("Failed to save profile");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-sm">
          Loading profile...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Failed to load profile</h1>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["profile"] })
            }
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!localProfile) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Profile not found</h1>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["profile"] })
            }
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-360 space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium">Profile</h1>
          <p className="text-muted-foreground">
            Manage your professional profile and job preferences
          </p>
        </div>

        {isChanged && (
          <Button
            onClick={() => {
              if (!localProfile || !isChanged) return;
              saveProfile.mutate(localProfile);
            }}
            disabled={saveProfile.isPending}
            className="flex items-center gap-2"
          >
            {saveProfile.isPending ? (
              <HugeiconsIcon
                icon={Loading03Icon}
                className="h-4 w-4 animate-spin"
              />
            ) : (
              <HugeiconsIcon icon={FloppyDiskIcon} className="h-4 w-4" />
            )}
            {saveProfile.isPending ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      {isChanged && (
        <div className="rounded-md border border-yellow-200 bg-yellow-100 px-3 py-2">
          <p className="text-sm text-yellow-800">
            You have unsaved changes. Click &quot;Save Changes&quot; to update
            your profile and recalculate embeddings.
          </p>
        </div>
      )}

      <div>
        <ProfileEditor data={localProfile} onChange={setLocalProfile} />
      </div>
    </div>
  );
}
