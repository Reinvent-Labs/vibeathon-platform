import { z } from "zod";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { isSameOrigin, requireRole } from "@/lib/auth";
import {
  createSession,
  listSessions,
  updateSession,
} from "@/lib/repository";
import { requestIp, writeAuditLog } from "@/lib/audit";

const categorySchema = z.enum([
  "HACKATHON",
  "VISITEUR",
  "FORMATION_ADULTE",
  "FORMATION_KIDS",
]);
const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  location: z.string().trim().max(160).optional().nullable(),
  startsAt: z.string().trim().min(1).optional().nullable(),
  endsAt: z.string().trim().min(1).optional().nullable(),
  active: z.boolean().optional(),
  allowedCategories: z.array(categorySchema).min(1).max(4),
});

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  location: z.string().trim().max(160).optional().nullable(),
  active: z.boolean().optional(),
  allowedCategories: z.array(categorySchema).min(1).max(4).optional(),
  archived: z.boolean().optional(),
  startsAt: z.string().trim().min(1).optional().nullable(),
  endsAt: z.string().trim().min(1).optional().nullable(),
});

async function guard(request: Request) {
  if (!isSameOrigin(request)) return "Origine invalide.";
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  return user ?? "Non autorisé.";
}

export async function GET(request: Request) {
  const authorized = await guard(request);
  if (typeof authorized === "string") {
    return apiError(authorized, authorized === "Non autorisé." ? 401 : 403);
  }
  return apiSuccess(await listSessions({ includeArchived: true }));
}

export async function POST(request: Request) {
  const authorized = await guard(request);
  if (typeof authorized === "string") {
    return apiError(authorized, authorized === "Non autorisé." ? 401 : 403);
  }
  const parsed = createSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return apiError("Session invalide.");
  const session = await createSession(parsed.data);
  await writeAuditLog({
    actorId: authorized.userId,
    action: "SESSION_CREATED",
    entityType: "Session",
    entityId: session.id,
    ipAddress: requestIp(request),
    metadata: {
      name: session.name,
      allowedCategories: parsed.data.allowedCategories.join(","),
    },
  });
  return apiSuccess(await listSessions({ includeArchived: true }));
}

export async function PATCH(request: Request) {
  const authorized = await guard(request);
  if (typeof authorized === "string") {
    return apiError(authorized, authorized === "Non autorisé." ? 401 : 403);
  }
  const parsed = updateSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return apiError("Mise à jour invalide.");
  const { id, ...data } = parsed.data;
  const session = await updateSession(id, data);
  await writeAuditLog({
    actorId: authorized.userId,
    action: data.archived
      ? "SESSION_ARCHIVED"
      : data.archived === false
        ? "SESSION_RESTORED"
        : "SESSION_UPDATED",
    entityType: "Session",
    entityId: session.id,
    ipAddress: requestIp(request),
    metadata: { name: session.name },
  });
  return apiSuccess(await listSessions({ includeArchived: true }));
}
