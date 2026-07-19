import { requireAdminPage } from "@/lib/admin-access";
import { getNotifications } from "@/lib/notification-service";
import { NotificationList } from "./notification-list";

export default async function AdminNotificationsPage() {
  const admin = await requireAdminPage("/admin/notifications");
  const notifications = await getNotifications(admin.id!);

  return (
    <section className="admin-content-page">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / notifications</p>
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
      </div>
      <NotificationList notifications={notifications} />
    </section>
  );
}
