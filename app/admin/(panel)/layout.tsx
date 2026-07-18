import { AdminSidebar } from "@/components/sections/admin-sidebar";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="admin-shell">
      <AdminSidebar />
      {children}
    </main>
  );
}
