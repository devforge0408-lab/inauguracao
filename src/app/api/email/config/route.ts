import { NextResponse } from "next/server";
import { getBrevoConfig, maskApiKey } from "@/lib/brevo";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getBrevoConfig();

  return NextResponse.json({
    configured: config.configured,
    maskedKey: maskApiKey(config.apiKey),
    senderEmail: config.senderEmail,
    senderName: config.senderName,
    apiUrl: config.apiUrl,
  });
}
