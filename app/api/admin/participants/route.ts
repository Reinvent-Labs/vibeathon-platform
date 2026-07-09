import { apiError, apiSuccess, readJson } from "@/lib/api";
import {
  deleteParticipants,
  listParticipants,
  updateParticipantStatus,
} from "@/lib/repository";
import type { DemoParticipantStatus } from "@/lib/demo-data";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { sendEmail, sendWhatsApp } from "@/lib/notifications";
import { renderCmsEmail } from "@/lib/cms-email";
import { requestIp, writeAuditLog } from "@/lib/audit";
import { appBaseUrl, statusUrlFor } from "@/lib/campaigns";
import { whatsAppMessages } from "@/lib/whatsapp-templates";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return apiError("Non autorisé.", 401);
  }
  return apiSuccess(await listParticipants());
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const staff = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!staff) {
    return apiError("Non autorisé.", 401);
  }
  const body = await readJson<{
    ids?: string[];
    status?: DemoParticipantStatus;
    notify?: boolean;
  }>(request);
  if (!body?.ids?.length || !body.status) return apiError("Sélection ou statut manquant.");
  const allowed: DemoParticipantStatus[] = [
    "PENDING",
    "WAITLIST",
    "SELECTED",
    "REJECTED",
    "PAID",
    "CONFIRMED",
    "CHECKED_IN",
  ];
  if (!allowed.includes(body.status)) return apiError("Statut invalide.");
  const nextStatus = body.status;
  const participants = await listParticipants();
  const targets = participants.filter((participant) =>
    body.ids!.includes(participant.id),
  );
  if (targets.length !== new Set(body.ids).size) {
    return apiError("Une ou plusieurs candidatures sont introuvables.", 404);
  }
  // Statuses that occupy one of the 100 competition slots.
  const ACTIVE: DemoParticipantStatus[] = [
    "SELECTED",
    "PAID",
    "CONFIRMED",
    "CHECKED_IN",
  ];
  const transitions: Record<DemoParticipantStatus, DemoParticipantStatus[]> = {
    PENDING: ["PENDING", "WAITLIST", "CONFIRMED", "REJECTED"],
    WAITLIST: ["WAITLIST", "CONFIRMED", "REJECTED", "PENDING"],
    SELECTED: ["SELECTED", "CONFIRMED", "WAITLIST", "PENDING", "REJECTED"],
    REJECTED: ["REJECTED", "WAITLIST", "PENDING", "CONFIRMED"],
    PAID: ["PAID", "CONFIRMED"],
    CONFIRMED: ["CONFIRMED", "CHECKED_IN", "PENDING", "WAITLIST", "REJECTED"],
    CHECKED_IN: ["CHECKED_IN"],
  };
  const invalidTransition = targets.find(
    (participant) => !transitions[participant.status].includes(nextStatus),
  );
  if (invalidTransition) {
    return apiError(
      `Le dossier ${invalidTransition.reference} ne peut pas passer de ${invalidTransition.status} à ${nextStatus}.`,
      409,
    );
  }
  // Enforce the 100-slot cap when accepting / promoting from the waitlist.
  if (["SELECTED", "CONFIRMED"].includes(nextStatus)) {
    const competition = prisma
      ? await prisma.competition.findUnique({
          where: { slug: "vibeathon-2026" },
          select: { competitorCapacity: true },
        })
      : null;
    const capacity = competition?.competitorCapacity ?? 100;
    const alreadyActive = participants.filter(
      (participant) =>
        participant.category === "HACKATHON" &&
        !participant.isTest &&
        ACTIVE.includes(participant.status),
    ).length;
    const newlyActive = targets.filter(
      (participant) =>
        participant.category === "HACKATHON" &&
        !participant.isTest &&
        !ACTIVE.includes(participant.status),
    ).length;
    if (alreadyActive + newlyActive > capacity) {
      return apiError(
        `La sélection est limitée à ${capacity} personnes. Il reste ${Math.max(0, capacity - alreadyActive)} place(s). Libère une place avant de promouvoir.`,
        409,
      );
    }
  }
  const results = await Promise.all(
    body.ids.map((id) => updateParticipantStatus(id, nextStatus)),
  );
  await Promise.all(
    targets.map((participant) =>
      writeAuditLog({
        actorId: staff.userId,
        action: "PARTICIPANT_STATUS_CHANGED",
        entityType: "Participant",
        entityId: participant.id,
        ipAddress: requestIp(request),
        metadata: {
          reference: participant.reference,
          from: participant.status,
          to: nextStatus,
        },
      }),
    ),
  );

  // Notify candidates when a competition decision is taken. The admin can
  // suppress this (e.g. when statuses are set ahead of a scheduled broadcast)
  // by passing notify=false.
  const decisionStatuses: DemoParticipantStatus[] = [
    "SELECTED",
    "CONFIRMED",
    "WAITLIST",
    "REJECTED",
  ];
  if (body.notify !== false && decisionStatuses.includes(nextStatus)) {
    const appUrl = appBaseUrl();
    await Promise.all(
      targets.map(async (participant) => {
        const statusUrl = statusUrlFor(participant);
        const name = participant.fullName;

        const email = await renderCmsEmail(
          ["SELECTED", "CONFIRMED"].includes(nextStatus)
            ? "competitionSelected"
            : nextStatus === "WAITLIST"
              ? "competitionWaitlist"
              : "competitionRejected",
          {
            name,
            statusUrl,
            appUrl,
            actionUrl: nextStatus === "REJECTED" ? appUrl : statusUrl,
          },
        );

        await sendEmail({
          participantId: participant.id,
          to: participant.email,
          subject: email.subject,
          text: `${email.text}\n\n${nextStatus === "REJECTED" ? appUrl : statusUrl}`,
          html: email.html,
          template: `competition-${nextStatus.toLowerCase()}`,
        });

        const wa =
          ["SELECTED", "CONFIRMED"].includes(nextStatus)
            ? whatsAppMessages.competitionSelected(name, statusUrl)
            : nextStatus === "WAITLIST"
              ? whatsAppMessages.competitionWaitlist(name, statusUrl)
              : whatsAppMessages.competitionRejected(name, statusUrl, appUrl);

        await sendWhatsApp({
          participantId: participant.id,
          phone: participant.phone,
          message: wa.message,
          template: `competition-${nextStatus.toLowerCase()}`,
          waTemplate: wa.waTemplate,
        });
      }),
    );
  }

  return apiSuccess({ updated: results.filter(Boolean).length });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const staff = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!staff) {
    return apiError("Non autorisé.", 401);
  }

  const body = await readJson<{ ids?: string[] }>(request);
  const ids = [...new Set(body?.ids ?? [])];
  if (!ids.length) return apiError("Sélection manquante.");

  const participants = await listParticipants();
  const targets = participants.filter((participant) =>
    ids.includes(participant.id),
  );
  if (targets.length !== ids.length) {
    return apiError("Un ou plusieurs participants sont introuvables.", 404);
  }

  const deleted = await deleteParticipants(ids);
  await Promise.all(
    targets.map((participant) =>
      writeAuditLog({
        actorId: staff.userId,
        action: "PARTICIPANT_DELETED",
        entityType: "Participant",
        entityId: participant.id,
        ipAddress: requestIp(request),
        metadata: {
          reference: participant.reference,
          fullName: participant.fullName,
          email: participant.email,
          category: participant.category ?? null,
          status: participant.status,
        },
      }),
    ),
  );

  return apiSuccess({ deleted });
}
