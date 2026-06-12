import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  demoParticipants,
  type DemoParticipant,
  type DemoParticipantStatus,
} from "@/lib/demo-data";
import type { z } from "zod";
import type { registrationSchema } from "@/lib/validation";
import { CATEGORIES, type OpenCategory } from "@/lib/categories";
import type { ParticipantCategory } from "@/generated/prisma/enums";

type RegistrationInput = z.infer<typeof registrationSchema>;

const runtimeParticipants = new Map(
  demoParticipants.map((participant) => [participant.email, participant]),
);
const runtimeScans = new Set<string>();

function buildReference() {
  return `VBT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function createParticipant(
  input: RegistrationInput,
): Promise<DemoParticipant> {
  if (prisma) {
    const competition = await prisma.competition.findUnique({
      where: { slug: "vibeathon-2026" },
    });
    if (!competition) {
      throw new Error("La compétition n'est pas encore configurée.");
    }
    if (!competition.registrationOpen) {
      throw new Error("Les candidatures à la compétition sont closes.");
    }

    const reference = buildReference();
    const participant = await prisma.participant.create({
      data: {
        competitionId: competition.id,
        reference,
        qrCode: reference.replace("-2026-", "-2026-C-"),
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        city: input.city,
        profile: input.profile,
        motivation: input.motivation,
        source: input.source,
      },
    });
    return {
      ...participant,
      status: participant.status as DemoParticipantStatus,
      source: participant.source ?? "",
      createdAt: participant.createdAt.toISOString(),
    };
  }

  if (runtimeParticipants.has(input.email)) {
    throw new Error("Une candidature existe déjà pour cet email.");
  }

  const reference = buildReference();
  const participant: DemoParticipant = {
    id: randomUUID(),
    reference,
    qrCode: reference.replace("-2026-", "-2026-C-"),
    ...input,
    source: input.source ?? "",
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };
  runtimeParticipants.set(input.email, participant);
  return participant;
}

type TicketInput = {
  category: OpenCategory;
  fullName: string;
  email: string;
  phone: string;
};

/**
 * Register a visitor / formation participant (the categories open to the
 * public). Free passes (fee 0) are created CONFIRMED so the badge can be sent
 * immediately; paid passes are created SELECTED, becoming CONFIRMED after the
 * PaiementPro webhook fires. The QR code carries the category letter
 * (e.g. VBT-2026-V-1234) so the scanner can distinguish pass types.
 */
export async function createTicketParticipant(
  input: TicketInput,
): Promise<DemoParticipant> {
  const config = CATEGORIES[input.category];
  const status: DemoParticipantStatus = config.fee === 0 ? "CONFIRMED" : "SELECTED";

  if (prisma) {
    const competition = await prisma.competition.findUnique({
      where: { slug: "vibeathon-2026" },
    });
    if (!competition) {
      throw new Error("L'événement n'est pas encore configuré.");
    }

    const existing = await prisma.participant.findFirst({
      where: {
        competitionId: competition.id,
        email: { equals: input.email, mode: "insensitive" },
      },
    });
    if (existing) {
      throw new Error("Une inscription existe déjà pour cet email.");
    }

    const reference = buildReference();
    const participant = await prisma.participant.create({
      data: {
        competitionId: competition.id,
        reference,
        qrCode: reference.replace("-2026-", `-2026-${config.qrLetter}-`),
        category: input.category,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        profile: config.label,
        status,
        confirmedAt: status === "CONFIRMED" ? new Date() : null,
      },
    });
    return {
      ...participant,
      status: participant.status as DemoParticipantStatus,
      source: participant.source ?? "",
      createdAt: participant.createdAt.toISOString(),
    };
  }

  if (runtimeParticipants.has(input.email)) {
    throw new Error("Une inscription existe déjà pour cet email.");
  }
  const reference = buildReference();
  const participant: DemoParticipant = {
    id: randomUUID(),
    reference,
    qrCode: reference.replace("-2026-", `-2026-${config.qrLetter}-`),
    category: input.category,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    city: "",
    profile: config.label,
    motivation: "",
    source: "",
    status,
    createdAt: new Date().toISOString(),
  };
  runtimeParticipants.set(input.email, participant);
  return participant;
}

export async function findParticipantByEmail(email: string) {
  if (prisma) {
    const participant = await prisma.participant.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      include: { team: true },
    });
    if (!participant) return null;
    return {
      ...participant,
      status: participant.status as DemoParticipantStatus,
      source: participant.source ?? "",
      teamName: participant.team?.name,
      createdAt: participant.createdAt.toISOString(),
    };
  }
  return runtimeParticipants.get(email) ?? null;
}

export async function findParticipantById(id: string) {
  if (prisma) {
    const participant = await prisma.participant.findUnique({
      where: { id },
      include: { team: true },
    });
    if (!participant) return null;
    return {
      ...participant,
      status: participant.status as DemoParticipantStatus,
      source: participant.source ?? "",
      teamName: participant.team?.name,
      createdAt: participant.createdAt.toISOString(),
    };
  }
  return [...runtimeParticipants.values()].find((item) => item.id === id) ?? null;
}

export async function findParticipantByQrCode(qrCode: string) {
  if (prisma) {
    return prisma.participant.findFirst({
      where: {
        OR: [{ qrCode }, { reference: qrCode }],
      },
      include: { team: true },
    });
  }
  return (
    [...runtimeParticipants.values()].find((item) => item.qrCode === qrCode) ??
    null
  );
}

export async function listParticipants() {
  if (prisma) {
    return prisma.participant.findMany({
      orderBy: { createdAt: "desc" },
      include: { team: true },
    });
  }
  return [...runtimeParticipants.values()].toSorted((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function updateParticipantStatus(
  id: string,
  status: DemoParticipantStatus,
) {
  if (prisma) {
    return prisma.participant.update({
      where: { id },
      data: {
        status,
        paidAt: status === "PAID" || status === "CONFIRMED" ? new Date() : undefined,
        confirmedAt: status === "CONFIRMED" ? new Date() : undefined,
      },
    });
  }
  const participant = [...runtimeParticipants.values()].find(
    (item) => item.id === id,
  );
  if (!participant) return null;
  participant.status = status;
  runtimeParticipants.set(participant.email, participant);
  return participant;
}

export async function recordScan(
  rawQrCode: string,
  sessionId: string,
  scannedById: string,
) {
  const qrCode = rawQrCode.trim();
  if (prisma) {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        archivedAt: null,
        competition: { slug: "vibeathon-2026" },
      },
    });
    if (!session) throw new Error("Session de scan introuvable ou archivée.");

    const participant = await findParticipantByQrCode(qrCode);
    if (!participant) {
      await prisma.scanRecord.create({
        data: {
          qrCode,
          sessionId: session.id,
          scannedById,
          result: "REJECTED",
          note: "QR code inconnu",
        },
      });
      return {
        result: "REJECTED" as const,
        participant: null,
        reason: "QR code inconnu",
        sessionCount: await acceptedScanCount(session.id),
      };
    }
    if (!["PAID", "CONFIRMED", "CHECKED_IN"].includes(participant.status)) {
      await prisma.scanRecord.create({
        data: {
          qrCode,
          sessionId: session.id,
          scannedById,
          participantId: participant.id,
          result: "REJECTED",
          note: `Statut non admissible: ${participant.status}`,
        },
      });
      return {
        result: "REJECTED" as const,
        participant,
        reason: "Participation non confirmée",
        sessionCount: await acceptedScanCount(session.id),
      };
    }
    const participantCategory = participant.category ?? "HACKATHON";
    if (!session.allowedCategories.includes(participantCategory)) {
      const categoryLabel = CATEGORIES[participantCategory].label;
      await prisma.scanRecord.create({
        data: {
          qrCode: participant.qrCode,
          sessionId: session.id,
          scannedById,
          participantId: participant.id,
          result: "REJECTED",
          note: `Pass non admis pour cette session: ${participantCategory}`,
        },
      });
      return {
        result: "REJECTED" as const,
        participant,
        reason: `Pass ${categoryLabel} non admis pour cette session`,
        sessionCount: await acceptedScanCount(session.id),
      };
    }

    const acceptedKey = `${session.id}:${participant.id}`;
    try {
      await prisma.scanRecord.create({
        data: {
          qrCode: participant.qrCode,
          sessionId: session.id,
          scannedById,
          participantId: participant.id,
          acceptedKey,
          result: "ACCEPTED",
        },
      });
      return {
        result: "ACCEPTED" as const,
        participant,
        reason: null,
        sessionCount: await acceptedScanCount(session.id),
      };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        await prisma.scanRecord.create({
          data: {
            qrCode: participant.qrCode,
            sessionId: session.id,
            scannedById,
            participantId: participant.id,
            result: "DUPLICATE",
            note: "Présence déjà enregistrée pour cette session",
          },
        });
        return {
          result: "DUPLICATE" as const,
          participant,
          reason: "Présence déjà enregistrée",
          sessionCount: await acceptedScanCount(session.id),
        };
      }
      throw error;
    }
  } else {
    const participant = await findParticipantByQrCode(qrCode);
    if (!participant) {
      return {
        result: "REJECTED" as const,
        participant: null,
        reason: "QR code inconnu",
        sessionCount: 0,
      };
    }
    if (!["PAID", "CONFIRMED", "CHECKED_IN"].includes(participant.status)) {
      return {
        result: "REJECTED" as const,
        participant,
        reason: "Participation non confirmée",
        sessionCount: 0,
      };
    }
    const key = `${sessionId}:${qrCode}`;
    if (runtimeScans.has(key)) {
      return {
        result: "DUPLICATE" as const,
        participant,
        reason: "Présence déjà enregistrée",
        sessionCount: runtimeScans.size,
      };
    }
    runtimeScans.add(key);
    return {
      result: "ACCEPTED" as const,
      participant,
      reason: null,
      sessionCount: runtimeScans.size,
    };
  }
}

async function acceptedScanCount(sessionId: string) {
  if (!prisma) return 0;
  return prisma.scanRecord.count({
    where: { sessionId, result: "ACCEPTED" },
  });
}

// ---------------------------------------------------------------------------
// Sessions (event conferences / activities) — created in admin, read by scanner
// ---------------------------------------------------------------------------

export type SessionRecord = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  active: boolean;
  archivedAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  scanCount: number;
  allowedCategories: ParticipantCategory[];
};

async function activeCompetitionId() {
  if (!prisma) return null;
  const competition = await prisma.competition.findUnique({
    where: { slug: "vibeathon-2026" },
    select: { id: true },
  });
  return competition?.id ?? null;
}

export async function listSessions(options?: {
  includeArchived?: boolean;
}): Promise<SessionRecord[]> {
  if (!prisma) return [];
  const competitionId = await activeCompetitionId();
  if (!competitionId) return [];
  const sessions = await prisma.session.findMany({
    where: {
      competitionId,
      ...(options?.includeArchived ? {} : { archivedAt: null }),
    },
    orderBy: [{ startsAt: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: { scans: { where: { result: "ACCEPTED" } } },
      },
    },
  });
  return sessions.map((session) => ({
    id: session.id,
    name: session.name,
    description: session.description,
    location: session.location,
    active: session.active,
    archivedAt: session.archivedAt ? session.archivedAt.toISOString() : null,
    startsAt: session.startsAt ? session.startsAt.toISOString() : null,
    endsAt: session.endsAt ? session.endsAt.toISOString() : null,
    scanCount: session._count.scans,
    allowedCategories: session.allowedCategories,
  }));
}

export async function createSession(input: {
  name: string;
  description?: string | null;
  location?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
  allowedCategories: ParticipantCategory[];
}) {
  if (!prisma) throw new Error("Base de données indisponible.");
  const competitionId = await activeCompetitionId();
  if (!competitionId) throw new Error("La compétition n'est pas configurée.");
  return prisma.$transaction(async (transaction) => {
    if (input.active) {
      await transaction.session.updateMany({
        where: { competitionId, active: true },
        data: { active: false },
      });
    }
    return transaction.session.create({
      data: {
        competitionId,
        name: input.name,
        description: input.description,
        location: input.location,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        active: input.active ?? false,
        allowedCategories: input.allowedCategories,
      },
    });
  });
}

export async function updateSession(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    location?: string | null;
    active?: boolean;
    allowedCategories?: ParticipantCategory[];
    archived?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
  },
) {
  if (!prisma) throw new Error("Base de données indisponible.");
  const current = await prisma.session.findUnique({ where: { id } });
  if (!current) throw new Error("Session introuvable.");
  return prisma.$transaction(async (transaction) => {
    if (data.active) {
      await transaction.session.updateMany({
        where: {
          competitionId: current.competitionId,
          id: { not: id },
          active: true,
        },
        data: { active: false },
      });
    }
    return transaction.session.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.allowedCategories !== undefined
          ? { allowedCategories: data.allowedCategories }
          : {}),
        ...(data.archived !== undefined
          ? {
              archivedAt: data.archived ? new Date() : null,
              ...(data.archived ? { active: false } : {}),
            }
          : {}),
        ...(data.startsAt !== undefined
          ? { startsAt: data.startsAt ? new Date(data.startsAt) : null }
          : {}),
        ...(data.endsAt !== undefined
          ? { endsAt: data.endsAt ? new Date(data.endsAt) : null }
          : {}),
      },
    });
  });
}
