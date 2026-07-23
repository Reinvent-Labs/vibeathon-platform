// TEMPORARY — diagnostic route to confirm which database/build the live
// deployment is actually reading from while wiring up the certificate
// feature. Remove once verified.
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!prisma) {
    return Response.json({ prisma: null }, { status: 500 });
  }
  try {
    const rows = await prisma.certificate.findMany();
    return Response.json({ ok: true, count: rows.length, rows });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
