import { ResumeListPage } from "@/components/resume/resume-list-page";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ResumePage() {
  const session = await auth.api.getSession({
    query: {
      disableCookieCache: true,
    },
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  if (!session.user.onboardingCompleted) {
    return redirect("/onboarding");
  }

  return (
    <div className="py-4">
      <ResumeListPage />
    </div>
  );
}
