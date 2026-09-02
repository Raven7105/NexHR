import { useState } from "react";
import { Bell, CheckCheck, ExternalLink, Inbox } from "lucide-react";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { Link } from "react-router-dom";

export default function NotificationsPopover() {
    const [isOpen, setIsOpen] = useState(false);
    const { data } = useNotifications();
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();

    const notifications = data?.results ?? [];
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return (
        <div className="relative inline-block text-left">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all border border-border/40 shadow-xs focus:outline-none cursor-pointer"
                title="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card shadow-sm animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border/80 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[480px]">
                        <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-muted/40 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded-lg bg-primary/10 text-primary">
                                    <Bell size={15} />
                                </div>
                                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Center de Notifications</h4>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllRead.mutate()}
                                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                                >
                                    <CheckCheck size={14} /> Tout marquer lu
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
                                    <Inbox size={36} className="mb-2 text-muted-foreground/40" />
                                    <p className="text-xs font-medium">Aucune notification pour le moment.</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => {
                                            if (!n.is_read) markRead.mutate(n.id);
                                        }}
                                        className={`p-3.5 transition-all hover:bg-muted/50 cursor-pointer ${!n.is_read ? "bg-primary/5 border-l-2 border-l-primary" : ""
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-xs ${!n.is_read ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                                                {n.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                                                {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                            {n.message}
                                        </p>
                                        {n.link && (
                                            <Link
                                                to={n.link}
                                                onClick={() => setIsOpen(false)}
                                                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold mt-2"
                                            >
                                                Consulter <ExternalLink size={10} />
                                            </Link>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
