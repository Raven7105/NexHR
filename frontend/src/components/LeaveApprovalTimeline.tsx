import React from "react";
import { CheckCircle2, Clock, XCircle, AlertCircle, FileText } from "lucide-react";
import type { LeaveRequest } from "@/types";

interface TimelineProps {
    request: LeaveRequest;
}

export default function LeaveApprovalTimeline({ request }: TimelineProps) {
    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return null;
        try {
            return new Date(dateStr).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    };

    // Statuts globaux
    const isRejected = request.statut === "REJECTED" || request.statut === "rejete";
    const isApproved = request.statut === "APPROVED" || request.statut === "approuve";

    // 1. Étape Manager
    const managerDone = Boolean(request.manager_approved_at || (request.validateur && (isApproved || request.statut === "PENDING_HR" || request.statut === "PENDING_CEO")));
    const managerRejected = isRejected && request.manager_status === "REJECTED";
    const managerPending = request.statut === "PENDING_MANAGER" || request.statut === "en_attente";

    // 2. Étape RH
    const hrDone = Boolean(request.hr_approved_at || (isApproved || request.statut === "PENDING_CEO"));
    const hrRejected = isRejected && request.hr_status === "REJECTED";
    const hrPending = request.statut === "PENDING_HR";

    // 3. Étape PDG
    const ceoDone = Boolean(request.ceo_approved_at || isApproved);
    const ceoRejected = isRejected && request.ceo_status === "REJECTED";
    const ceoPending = request.statut === "PENDING_CEO";

    // Détermination dynamique des étapes selon le rôle du demandeur
    const applicantRole = request.employee_detail?.role || "employe";

    const steps = [
        {
            title: "Soumission de la demande",
            subtitle: request.employee_detail?.nom_complet || "Demandeur",
            date: formatDate(request.date_creation),
            status: "completed",
            comment: request.motif || "Demande soumise",
        },
    ];

    if (applicantRole === "employe") {
        steps.push({
            title: "Validation Niveau 1 : Manager",
            subtitle: request.employee_detail?.manager_nom || "Manager hiérarchique",
            date: formatDate(request.manager_approved_at),
            status: managerDone ? "completed" : managerRejected ? "rejected" : managerPending ? "pending" : "waiting",
            comment: request.manager_comment,
        });
    }

    if (applicantRole === "employe" || applicantRole === "manager") {
        const levelText = applicantRole === "employe" ? "Niveau 2" : "Niveau 1";
        steps.push({
            title: `Validation ${levelText} : Responsable RH`,
            subtitle: "Service Ressources Humaines",
            date: formatDate(request.hr_approved_at),
            status: hrDone ? "completed" : hrRejected ? "rejected" : hrPending ? "pending" : "waiting",
            comment: request.hr_comment,
        });
    }

    const ceoLevelText = applicantRole === "employe" ? "Niveau 3" : applicantRole === "manager" ? "Niveau 2" : "Niveau 1";
    steps.push({
        title: `Validation ${ceoLevelText} : PDG / Direction`,
        subtitle: "Direction Générale",
        date: formatDate(request.ceo_approved_at),
        status: ceoDone ? "completed" : ceoRejected ? "rejected" : ceoPending ? "pending" : "waiting",
        comment: request.ceo_comment,
    });

    return (
        <div className="py-4 space-y-6">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <FileText size={16} className="text-primary" />
                Workflow d'approbation hiérarchique adapté ({applicantRole.toUpperCase()})
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {steps.map((step, index) => {
                    let IconComponent = Clock;
                    let iconBg = "bg-muted text-muted-foreground border-border";

                    if (step.status === "completed") {
                        IconComponent = CheckCircle2;
                        iconBg = "bg-emerald-500 text-white border-emerald-600";
                    } else if (step.status === "rejected") {
                        IconComponent = XCircle;
                        iconBg = "bg-rose-500 text-white border-rose-600";
                    } else if (step.status === "pending") {
                        IconComponent = AlertCircle;
                        iconBg = "bg-amber-500 text-white border-amber-600 animate-pulse";
                    }

                    return (
                        <div key={index} className="relative flex items-start gap-4">
                            <div
                                className={`absolute -left-6 top-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs shadow-sm z-10 ${iconBg}`}
                            >
                                <IconComponent size={14} />
                            </div>

                            <div className="flex-1 bg-card border border-border/80 rounded-xl p-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                                    {step.date && (
                                        <span className="text-xs text-muted-foreground font-medium">{step.date}</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{step.subtitle}</p>
                                {step.comment && (
                                    <div className="mt-2 text-xs bg-muted/60 rounded-lg p-2 text-foreground border border-border/40 italic">
                                        "{step.comment}"
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isApproved && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-xs">
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                    <div>
                        <p className="font-semibold">Autorisation officielle accordée</p>
                        <p className="mt-0.5">
                            Numéro : <span className="font-mono font-bold">{request.authorization_number}</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
