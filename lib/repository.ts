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
