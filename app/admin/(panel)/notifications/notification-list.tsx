"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { markNotificationRead, markAllNotificationsRead } from "./actions";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();

  async function handleClick(notification: Notification) {
    if (!notification.readAt) {
      await markNotificationRead(notification.id);
      router.refresh();
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    router.refresh();
  }

  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        {hasUnread && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          </div>
        )}
        {notifications.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
        )}
        {notifications.map((notification) => {
          const row = (
            <div
              className={`flex items-start gap-3 rounded-md border border-border p-3 ${notification.readAt ? "" : "bg-accent/50"}`}
            >
              {!notification.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              <div className="flex-1">
                <p className="font-medium text-foreground">{notification.title}</p>
                {notification.body && <p className="text-sm text-muted-foreground">{notification.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{notification.createdAt.toLocaleString()}</p>
              </div>
            </div>
          );

          return notification.href ? (
            <Link key={notification.id} href={notification.href} onClick={() => handleClick(notification)}>
              {row}
            </Link>
          ) : (
            <button key={notification.id} type="button" className="text-left" onClick={() => handleClick(notification)}>
              {row}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
