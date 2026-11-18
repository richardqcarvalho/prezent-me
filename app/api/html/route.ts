import { NextResponse } from "next/server";

import { buildExportFilename, resolveExportDraft } from "@/lib/export-draft";
import { generatePortfolioHtml } from "@/lib/html";
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

    const html = generatePortfolioHtml(draft);
    const filename = buildExportFilename(draft, "html");

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to generate HTML:", error);
    return NextResponse.json(
      { error: "Failed to generate HTML. Please try again." },
      { status: 500 },
    );
  }
}
