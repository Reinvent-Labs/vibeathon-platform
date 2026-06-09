import { apiError, apiSuccess, readJson } from "@/lib/api";
import { recordScan } from "@/lib/repository";
import { scanSchema } from "@/lib/validation";
import { isSameOrigin, requireRole } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "SCANNER"]))) {
    return apiError("Non autorisé.", 401);
  }
  const body = await readJson<unknown>(request);
  const parsed = scanSchema.safeParse(body);
  if (!parsed.success) return apiError("QR code ou session invalide.");

  const scan = await recordScan(parsed.data.qrCode, parsed.data.sessionId);
  return apiSuccess({
    result: scan.result,
    participant: scan.participant
      ? {
          fullName: scan.participant.fullName,
          profile: scan.participant.profile,
          city: scan.participant.city,
        }
      : null,
  });
}
