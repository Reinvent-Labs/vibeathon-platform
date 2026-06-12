import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { apiError, apiSuccess } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) return apiError("Aucun fichier reçu.");
  if (!ALLOWED_TYPES.includes(file.type)) return apiError("Format non autorisé. Utilise JPG, PNG, WebP ou SVG.");
  if (file.size > MAX_SIZE_BYTES) return apiError("Fichier trop lourd (max 5 Mo).");

  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const asset = await prisma.mediaAsset.create({
    data: { filename: file.name, path: `/uploads/${filename}`, size: file.size },
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
