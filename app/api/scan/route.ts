import { apiError, apiSuccess, readJson } from "@/lib/api";
import { recordScan } from "@/lib/repository";
import { scanSchema } from "@/lib/validation";
import { isSameOrigin, requireRole } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const staff = await requireRole(["SUPER_ADMIN", "ADMIN", "SCANNER"]);
  if (!staff) {
    return apiError("Non autorisé.", 401);
  }
  const body = await readJson<unknown>(request);
  const parsed = scanSchema.safeParse(body);
  if (!parsed.success) return apiError("QR code ou session invalide.");

  try {
    const scan = await recordScan(
      parsed.data.qrCode,
      parsed.data.sessionId,
      staff.userId,
    );
    return apiSuccess({
      result: scan.result,
      reason: scan.reason,
      sessionCount: scan.sessionCount,
      participant: scan.participant
        ? {
            reference: scan.participant.reference,
            fullName: scan.participant.fullName,
            profile: scan.participant.profile,
            city: scan.participant.city,
            status: scan.participant.status,
            teamName:
              "team" in scan.participant
                ? scan.participant.team?.name ?? null
                : null,
          }
        : null,
    });
  } catch (error) {
    console.error("Scan failed", {
      sessionId: parsed.data.sessionId,
      staffId: staff.userId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiError(
      error instanceof Error ? error.message : "Scan impossible.",
      409,
    );
  }
}
