import { NextResponse } from "next/server";

import { buildExportFilename, resolveExportDraft } from "@/lib/export-draft";
import { generatePortfolioPdf } from "@/lib/pdf";
import { getSessionUser } from "@/lib/session";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const draft = await resolveExportDraft(request, sessionUser.id);
    if (!draft) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pdfBytes = await generatePortfolioPdf(draft);
    const filename = buildExportFilename(draft, "pdf");

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF. Please try again." },
      { status: 500 },
    );
  }
}
