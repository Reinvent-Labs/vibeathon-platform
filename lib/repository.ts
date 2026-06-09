import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  demoParticipants,
  type DemoParticipant,
  type DemoParticipantStatus,
} from "@/lib/demo-data";
import type { z } from "zod";
import type { registrationSchema } from "@/lib/validation";

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
    return prisma.participant.findUnique({
      where: { qrCode },
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

export async function recordScan(qrCode: string, sessionId: string) {
  const participant = await findParticipantByQrCode(qrCode);
  if (!participant) {
    return { result: "REJECTED" as const, participant: null };
  }
  if (!["PAID", "CONFIRMED", "CHECKED_IN"].includes(participant.status)) {
    return { result: "REJECTED" as const, participant };
  }

  if (prisma) {
    const requestedSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    const session =
      requestedSession ??
      (await prisma.session.findFirst({
        where: { active: true },
        orderBy: { startsAt: "asc" },
      }));
    if (!session) {
      throw new Error("Aucune session de scan n'est configurée.");
    }
    const previous = await prisma.scanRecord.findFirst({
      where: { qrCode, sessionId: session.id, result: "ACCEPTED" },
    });
    if (previous) return { result: "DUPLICATE" as const, participant };
    await prisma.scanRecord.create({
      data: {
        qrCode,
        sessionId: session.id,
        participantId: participant.id,
        result: "ACCEPTED",
      },
    });
  } else {
    const key = `${sessionId}:${qrCode}`;
    if (runtimeScans.has(key)) {
      return { result: "DUPLICATE" as const, participant };
    }
    runtimeScans.add(key);
  }

  return { result: "ACCEPTED" as const, participant };
}

// ---------------------------------------------------------------------------
// Sessions (event conferences / activities) — created in admin, read by scanner
// ---------------------------------------------------------------------------

export type SessionRecord = {
  id: string;
  name: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  scanCount: number;
};

async function activeCompetitionId() {
  if (!prisma) return null;
  const competition = await prisma.competition.findUnique({
    where: { slug: "vibeathon-2026" },
    select: { id: true },
  });
  return competition?.id ?? null;
}

export async function listSessions(): Promise<SessionRecord[]> {
  if (!prisma) return [];
  const competitionId = await activeCompetitionId();
  if (!competitionId) return [];
  const sessions = await prisma.session.findMany({
    where: { competitionId },
    orderBy: [{ startsAt: "asc" }, { name: "asc" }],
    include: { _count: { select: { scans: true } } },
  });
  return sessions.map((session) => ({
    id: session.id,
    name: session.name,
    active: session.active,
    startsAt: session.startsAt ? session.startsAt.toISOString() : null,
    endsAt: session.endsAt ? session.endsAt.toISOString() : null,
    scanCount: session._count.scans,
  }));
}

export async function createSession(input: {
  name: string;
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
}) {
  if (!prisma) throw new Error("Base de données indisponible.");
  const competitionId = await activeCompetitionId();
  if (!competitionId) throw new Error("La compétition n'est pas configurée.");
  return prisma.session.create({
    data: {
      competitionId,
      name: input.name,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      active: input.active ?? false,
    },
  });
}

export async function updateSession(
  id: string,
  data: { name?: string; active?: boolean; startsAt?: string | null; endsAt?: string | null },
) {
  if (!prisma) throw new Error("Base de données indisponible.");
  return prisma.session.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.startsAt !== undefined
        ? { startsAt: data.startsAt ? new Date(data.startsAt) : null }
        : {}),
      ...(data.endsAt !== undefined
        ? { endsAt: data.endsAt ? new Date(data.endsAt) : null }
        : {}),
    },
  });
}

export async function deleteSession(id: string) {
  if (!prisma) throw new Error("Base de données indisponible.");
  await prisma.session.delete({ where: { id } });
}
