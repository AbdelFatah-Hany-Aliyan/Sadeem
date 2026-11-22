import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getUserNotifications } from "@/lib/services/notificationService";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/admin/company/actions";
import {
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  CheckSquare,
  UserCheck,
  Building2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const notifications = await getUserNotifications({
    adminUserId: session.id,
    limit: 100,
  });

  async function handleMarkAll() {
    "use server";
    await markAllNotificationsReadAction();
  }

  async function handleMarkRead(formData: FormData) {
    "use server";
    await markNotificationReadAction(formData);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            مركز الإشعارات والتنبيهات / Notifications ({notifications.length})
          </h2>
          <p className="text-xs text-muted">
            إشعارات المهام، الدعوات، التوجيهات الإدارية، وتحديثات سير العمل
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <form action={handleMarkAll}>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl border border-border bg-surface hover:border-accent text-foreground text-xs font-mono transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 size={13} />
              <span>تحديد الكل كمقروء / Mark all as read</span>
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface border border-border space-y-3">
          <Bell size={32} className="text-muted mx-auto" />
          <h3 className="text-base font-bold text-foreground">لا توجد إشعارات حتى الآن</h3>
          <p className="text-xs text-muted">
            ستظهر هنا الإشعارات الخاصة بالمهام، التوجيهات، والدعوات
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !n.read
                  ? "bg-surface border-accent/40 shadow-sm"
                  : "bg-surface/50 border-border opacity-85"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">
                    {n.title}
                  </span>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-accent" />
                  )}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-muted">
                    {n.type}
                  </span>
                </div>

                <p className="text-xs text-muted leading-relaxed max-w-2xl">
                  {n.message}
                </p>

                <div className="flex items-center gap-1 text-[10px] font-mono text-muted pt-1">
                  <Clock size={11} />
                  <span>{new Date(n.createdAt).toLocaleString("ar-EG")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.link && (
                  <Link
                    href={n.link}
                    className="px-3 py-1.5 rounded-lg bg-accent/15 text-accent hover:bg-accent hover:text-accent-foreground font-mono text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>فتح / Open</span>
                    <ArrowRight size={12} />
                  </Link>
                )}

                {!n.read && (
                  <form action={handleMarkRead}>
                    <input type="hidden" name="notificationId" value={n.id} />
                    <button
                      type="submit"
                      title="تحديد كمقروء"
                      className="p-1.5 rounded-lg border border-border text-muted hover:text-foreground transition-colors"
                    >
                      <CheckCircle2 size={13} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
