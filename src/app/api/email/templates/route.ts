import { NextResponse } from "next/server";
import { getBrevoConfig } from "@/lib/brevo";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

/**
 * GET /api/email/templates — lists the e-mail templates hosted on this site.
 * The Brevo API is only used to send; templates are 100% static and local.
 */
export async function GET() {
  const config = getBrevoConfig();

  const templates = EMAIL_TEMPLATES.map((t) => ({
    slug: t.slug,
    name: t.name,
    subject: t.subject,
    htmlContent: t.htmlContent,
  }));

  return NextResponse.json({ configured: config.configured, templates });
}
