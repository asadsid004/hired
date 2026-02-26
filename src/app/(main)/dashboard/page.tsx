import { Logout } from "@/components/auth/logout-button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
    <div className="flex items-center justify-between p-4">
      Dashboard
      <Logout />
    </div>
  );
};

export default DashboardPage;
