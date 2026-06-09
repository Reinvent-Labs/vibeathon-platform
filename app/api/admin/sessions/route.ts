import { z } from "zod";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { isSameOrigin, requireRole } from "@/lib/auth";
import {
  createSession,
  deleteSession,
  listSessions,
  updateSession,
} from "@/lib/repository";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  startsAt: z.string().trim().min(1).optional().nullable(),
  endsAt: z.string().trim().min(1).optional().nullable(),
  active: z.boolean().optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(120).optional(),
  active: z.boolean().optional(),
  startsAt: z.string().trim().min(1).optional().nullable(),
  endsAt: z.string().trim().min(1).optional().nullable(),
});

const deleteSchema = z.object({ id: z.string().min(1) });

async function guard(request: Request) {
  if (!isSameOrigin(request)) return "Origine invalide.";
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) return "Non autorisé.";
  return null;
}

export async function GET(request: Request) {
  const denied = await guard(request);
  if (denied) return apiError(denied, denied === "Non autorisé." ? 401 : 403);
  return apiSuccess(await listSessions());
}

export async function POST(request: Request) {
  const denied = await guard(request);
  if (denied) return apiError(denied, denied === "Non autorisé." ? 401 : 403);
  const parsed = createSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return apiError("Session invalide.");
  await createSession(parsed.data);
  return apiSuccess(await listSessions());
}

export async function PATCH(request: Request) {
  const denied = await guard(request);
  if (denied) return apiError(denied, denied === "Non autorisé." ? 401 : 403);
  const parsed = updateSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return apiError("Mise à jour invalide.");
  const { id, ...data } = parsed.data;
  await updateSession(id, data);
  return apiSuccess(await listSessions());
}

export async function DELETE(request: Request) {
  const denied = await guard(request);
  if (denied) return apiError(denied, denied === "Non autorisé." ? 401 : 403);
  const parsed = deleteSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return apiError("Identifiant requis.");
  await deleteSession(parsed.data.id);
  return apiSuccess(await listSessions());
}
