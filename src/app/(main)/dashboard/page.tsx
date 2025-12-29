import { Logout } from "@/components/auth/logout-button";

const DashboardPage = () => {
  return (
    <div className="flex items-center justify-between p-4">
      Dashboard
      <Logout />
    </div>
  );
};

export default DashboardPage;
