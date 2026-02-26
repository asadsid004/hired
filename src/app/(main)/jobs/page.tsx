import { JobListingWithFilers } from "@/components/jobs/job-listings-wtih-filters";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const JobsPage = async () => {
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
      <JobListingWithFilers />
    </div>
  );
};

export default JobsPage;
