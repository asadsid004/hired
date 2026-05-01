import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardView } from "@/components/dashboard/dashboard-view";

const DashboardPage = async () => {
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
    <div className="py-6">
      <DashboardView />
    </div>
  );
};

export default DashboardPage;
