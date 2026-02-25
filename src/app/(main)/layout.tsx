import { MainNavbar } from "@/components/main-navbar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <MainNavbar />
      <div className="mx-auto max-w-7xl px-4">{children}</div>
    </div>
  );
};

export default MainLayout;
