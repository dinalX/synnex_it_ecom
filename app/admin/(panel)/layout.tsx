import { AdminSidebar } from "@/components/sections/admin-sidebar";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="admin-shell bg-background text-foreground">
      <AdminSidebar />
      {children}
    </main>
  );
}
