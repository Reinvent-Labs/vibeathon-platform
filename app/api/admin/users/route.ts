import { randomBytes, randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { requestIp, writeAuditLog } from "@/lib/audit";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "JURY", "SCANNER"]);
const createUserSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  role: roleSchema,
});
const updateUserSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set-active"),
    userId: z.string().min(1),
    active: z.boolean(),
  }),
  z.object({
    action: z.literal("set-role"),
    userId: z.string().min(1),
    role: roleSchema,
  }),
  z.object({
    action: z.literal("reset-password"),
    userId: z.string().min(1),
  }),
]);

function temporaryPassword() {
  return `Vbt!${randomBytes(12).toString("base64url")}9a`;
}

async function authorize(request: Request) {
  if (!isSameOrigin(request)) {
    return { error: apiError("Origine invalide.", 403) };
  }
  const user = await requireRole(["SUPER_ADMIN"]);
  return user ? { user } : { error: apiError("Non autorisé.", 403) };
}

async function listUsers() {
  if (!prisma) return [];
  return prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      active: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: [{ active: "desc" }, { fullName: "asc" }],
  });
}

export async function GET(request: Request) {
  const authorization = await authorize(request);
  if ("error" in authorization) return authorization.error;
  return apiSuccess(await listUsers());
}

export async function POST(request: Request) {
  const authorization = await authorize(request);
  if ("error" in authorization) return authorization.error;
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const parsed = createUserSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return apiError("Nom, email ou rôle invalide.");

  const existing = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return apiError("Un compte existe déjà pour cet email.", 409);

  const password = temporaryPassword();
  const created = await prisma.adminUser.create({
    data: {
      authUserId: `local-${randomUUID()}`,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await hash(password, 12),
      mustChangePassword: true,
      active: true,
    },
  });
  await writeAuditLog({
    actorId: authorization.user.userId,
    action: "STAFF_USER_CREATED",
    entityType: "AdminUser",
    entityId: created.id,
    ipAddress: requestIp(request),
    metadata: { role: created.role, email: created.email },
  });
  return apiSuccess(
    {
      users: await listUsers(),
      credentials: {
        email: created.email,
        temporaryPassword: password,
      },
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const authorization = await authorize(request);
  if ("error" in authorization) return authorization.error;
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const parsed = updateUserSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return apiError("Action utilisateur invalide.");
  const target = await prisma.adminUser.findUnique({
    where: { id: parsed.data.userId },
  });
  if (!target) return apiError("Utilisateur introuvable.", 404);

  const changingOwnAccess =
    target.id === authorization.user.userId &&
    (parsed.data.action === "set-active" ||
      parsed.data.action === "set-role");
  if (changingOwnAccess) {
    return apiError(
      "Tu ne peux pas modifier ton propre rôle ou désactiver ton compte.",
      409,
    );
  }

  if (
    target.role === "SUPER_ADMIN" &&
    ((parsed.data.action === "set-active" && !parsed.data.active) ||
      (parsed.data.action === "set-role" &&
        parsed.data.role !== "SUPER_ADMIN"))
  ) {
    const activeSuperAdmins = await prisma.adminUser.count({
      where: { role: "SUPER_ADMIN", active: true },
    });
    if (activeSuperAdmins <= 1) {
      return apiError(
        "Le dernier super-administrateur actif ne peut pas être retiré.",
        409,
      );
    }
  }

  let credentials:
    | { email: string; temporaryPassword: string }
    | undefined;
  if (parsed.data.action === "set-active") {
    await prisma.adminUser.update({
      where: { id: target.id },
      data: { active: parsed.data.active },
    });
  } else if (parsed.data.action === "set-role") {
    await prisma.adminUser.update({
      where: { id: target.id },
      data: { role: parsed.data.role },
    });
  } else {
    const password = temporaryPassword();
    await prisma.adminUser.update({
      where: { id: target.id },
      data: {
        passwordHash: await hash(password, 12),
        mustChangePassword: true,
      },
    });
    credentials = {
      email: target.email,
      temporaryPassword: password,
    };
  }

  await writeAuditLog({
    actorId: authorization.user.userId,
    action:
      parsed.data.action === "set-active"
        ? parsed.data.active
          ? "STAFF_USER_ACTIVATED"
          : "STAFF_USER_DEACTIVATED"
        : parsed.data.action === "set-role"
          ? "STAFF_USER_ROLE_CHANGED"
          : "STAFF_USER_PASSWORD_RESET",
    entityType: "AdminUser",
    entityId: target.id,
    ipAddress: requestIp(request),
    metadata:
      parsed.data.action === "set-role"
        ? { role: parsed.data.role }
        : parsed.data.action === "set-active"
          ? { active: parsed.data.active }
          : undefined,
  });
  return apiSuccess({ users: await listUsers(), credentials });
}
