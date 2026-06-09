import { prisma } from "@/lib/prisma";

type AuditInput = {
  actorId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

/**
 * Record a security or administrative action without blocking the operation
 * if audit storage is temporarily unavailable.
 */
export async function writeAuditLog(input: AuditInput) {
  if (!prisma) return;
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        ipAddress: input.ipAddress,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    console.error("Audit log write failed", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

/** Return the best available client address without trusting it for identity. */
export function requestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
