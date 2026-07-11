import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { apiError, apiSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 30 * 1024 * 1024; // 30 MB

// PDF magic bytes: %PDF
function isPdf(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "%PDF";
}

export async function POST(request: Request) {
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const formData = await request.formData();
  const file = formData.get("file");
  const teamId = formData.get("teamId");

  if (!(file instanceof File)) return apiError("Aucun fichier reçu.");
  if (typeof teamId !== "string" || !teamId) return apiError("Équipe manquante.");
  if (file.size === 0) return apiError("Le fichier est vide.");
  if (file.size > MAX_SIZE) return apiError("Fichier trop lourd (max 30 Mo).");
  if (!["application/pdf", "application/x-pdf"].includes(file.type)) {
    return apiError("Format non autorisé. Utilise un fichier PDF.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isPdf(buffer)) return apiError("Le fichier n'est pas un PDF valide.");

  const team = await prisma.team.findFirst({
    where: { id: teamId, competition: { slug: "vibeathon-2026" } },
    select: { id: true, name: true, demoUrl: true, competition: { select: { phase: true } } },
  });
  if (!team) return apiError("Équipe introuvable.", 404);
  if (team.competition.phase !== "SUBMISSIONS_OPEN") {
    return apiError("Les soumissions sont fermées. La Phase 1 a déjà démarré.", 409);
  }
  if (team.demoUrl) {
    return apiError("Cette équipe a déjà soumis son projet. Une seule soumission par équipe est autorisée.", 409);
  }

  const filename = `${randomUUID()}.pdf`;
  const slidesDir = path.join(process.cwd(), "public", "uploads", "slides");
  await mkdir(slidesDir, { recursive: true });
  await writeFile(path.join(slidesDir, filename), buffer);

  const slidesUrl = `/uploads/slides/${filename}`;
  await prisma.team.update({
    where: { id: team.id },
    data: { slidesUrl },
  });

  return apiSuccess({ slidesUrl });
}
