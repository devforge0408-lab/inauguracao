import { NextRequest, NextResponse } from "next/server";
import { getBrevoConfig, brevoFetch, friendlyBrevoError } from "@/lib/brevo";
import { getEmailTemplate } from "@/lib/email-templates";
import { isValidEmail, normalizeEmail } from "@/lib/email-utils";

export const dynamic = "force-dynamic";

const MAX_PAYLOADS = 500;

type SendPayload = {
  to?: string;
  templateSlug?: string;
  subject?: string;
  htmlContent?: string;
};

type SendResult = {
  to: string;
  success: boolean;
  status: number;
  friendlyError?: string;
};

/**
 * POST /api/email/send — sends transactional e-mails through Brevo.
 * Body: { payloads: [{ to, templateSlug }] }
 * Templates live on the site (src/lib/email-templates.ts); Brevo only delivers.
 * A payload may also carry inline { to, subject, htmlContent } for test sends.
 * Content is 100% static — no params/placeholders are sent.
 */
export async function POST(req: NextRequest) {
  const config = getBrevoConfig();
  if (!config.configured || !config.apiKey) {
    return NextResponse.json(
      { friendlyError: "Brevo não configurada. Defina BREVO_API_KEY e BREVO_SENDER_EMAIL no .env.local." },
      { status: 503 }
    );
  }

  let body: { payloads?: SendPayload[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { friendlyError: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const payloads = body.payloads;
  if (!Array.isArray(payloads) || payloads.length === 0) {
    return NextResponse.json(
      { friendlyError: "Informe ao menos um payload de envio." },
      { status: 400 }
    );
  }
  if (payloads.length > MAX_PAYLOADS) {
    return NextResponse.json(
      { friendlyError: `Máximo de ${MAX_PAYLOADS} envios por requisição.` },
      { status: 400 }
    );
  }

  const sender = {
    email: config.senderEmail,
    ...(config.senderName ? { name: config.senderName } : {}),
  };

  const results: SendResult[] = [];

  for (const payload of payloads) {
    const email = normalizeEmail(payload.to || "");

    if (!isValidEmail(email)) {
      results.push({
        to: payload.to || "(vazio)",
        success: false,
        status: 0,
        friendlyError: "E-mail do destinatário inválido.",
      });
      continue;
    }

    let subject: string | undefined;
    let htmlContent: string | undefined;

    if (payload.templateSlug) {
      const template = getEmailTemplate(payload.templateSlug);
      if (!template) {
        results.push({
          to: email,
          success: false,
          status: 0,
          friendlyError: `Template "${payload.templateSlug}" não existe no site.`,
        });
        continue;
      }
      subject = template.subject;
      htmlContent = template.htmlContent;
    } else {
      subject = payload.subject?.trim();
      htmlContent = payload.htmlContent?.trim();
    }

    if (!subject || !htmlContent) {
      results.push({
        to: email,
        success: false,
        status: 0,
        friendlyError: "Informe um templateSlug ou conteúdo estático (subject + htmlContent).",
      });
      continue;
    }

    try {
      const { status, data } = await brevoFetch(config, "/smtp/email", {
        method: "POST",
        body: JSON.stringify({
          to: [{ email }],
          sender,
          subject,
          htmlContent,
        }),
      });

      if (status >= 200 && status < 300) {
        results.push({ to: email, success: true, status });
      } else {
        results.push({
          to: email,
          success: false,
          status,
          friendlyError: friendlyBrevoError(status, data),
        });
      }
    } catch (error) {
      console.error("Brevo send error:", error);
      results.push({
        to: email,
        success: false,
        status: 0,
        friendlyError: friendlyBrevoError(0),
      });
    }
  }

  const sent = results.filter((r) => r.success).length;
  const failed = results.length - sent;

  return NextResponse.json({ sent, failed, results });
}
