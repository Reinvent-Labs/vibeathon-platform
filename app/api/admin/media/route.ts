import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { apiError, apiSuccess } from "@/lib/api";
import { requestIp, writeAuditLog } from "@/lib/audit";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FILE_TYPES = {
  "image/jpeg": {
    extension: "jpg",
    matches: (buffer: Buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    matches: (buffer: Buffer) =>
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
  },
  "image/webp": {
    extension: "webp",
    matches: (buffer: Buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
  "image/gif": {
    extension: "gif",
    matches: (buffer: Buffer) => {
      const signature = buffer.subarray(0, 6).toString("ascii");
      return signature === "GIF87a" || signature === "GIF89a";
    },
  },
} satisfies Record<
  string,
  { extension: string; matches: (buffer: Buffer) => boolean }
>;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) return apiError("Aucun fichier reçu.");
  const fileType = FILE_TYPES[file.type as keyof typeof FILE_TYPES];
  if (!fileType) {
    return apiError("Format non autorisé. Utilise JPG, PNG, WebP ou GIF.");
  }
  if (file.size === 0) return apiError("Le fichier est vide.");
  if (file.size > MAX_SIZE_BYTES) return apiError("Fichier trop lourd (max 5 Mo).");

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!fileType.matches(buffer)) {
    return apiError("Le contenu du fichier ne correspond pas au format annoncé.");
  }
  const filename = `${randomUUID()}.${fileType.extension}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, filename);
  await writeFile(filePath, buffer);

  const asset = await prisma.mediaAsset.create({
    data: { filename: file.name, path: `/uploads/${filename}`, size: file.size },
  });
  await writeAuditLog({
    actorId: user.userId,
    action: "MEDIA_ASSET_UPLOADED",
    entityType: "MediaAsset",
    entityId: asset.id,
    ipAddress: requestIp(request),
    metadata: { mimeType: file.type, size: file.size },
  });

  return apiSuccess({ id: asset.id, url: asset.path, filename: asset.filename });
}

export async function GET() {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return apiSuccess(assets);
}
