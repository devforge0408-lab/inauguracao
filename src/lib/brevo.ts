const DEFAULT_BREVO_API_URL = "https://api.brevo.com/v3";

export type BrevoConfig = {
  configured: boolean;
  apiKey: string | null;
  apiUrl: string;
  senderEmail: string | null;
  senderName: string | null;
};

/**
 * Reads Brevo credentials from environment variables (server-side only).
 */
export function getBrevoConfig(): BrevoConfig {
  const apiKey = process.env.BREVO_API_KEY?.trim() || null;
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || null;
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || null;
  const apiUrl = (process.env.BREVO_API_URL?.trim() || DEFAULT_BREVO_API_URL).replace(/\/+$/, "");

  return {
    configured: Boolean(apiKey && senderEmail),
    apiKey,
    apiUrl,
    senderEmail,
    senderName,
  };
}

/**
 * Masks an API key for safe display (e.g. "xkey…SGF").
 */
export function maskApiKey(key: string | null): string | null {
  if (!key) return null;
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

export type BrevoFetchResult = {
  status: number;
  data: unknown;
};

/**
 * Performs an authenticated request against the Brevo REST API.
 */
export async function brevoFetch(
  config: BrevoConfig,
  path: string,
  init?: RequestInit
): Promise<BrevoFetchResult> {
  const res = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "api-key": config.apiKey || "",
      accept: "application/json",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  return { status: res.status, data };
}

function extractBrevoMessage(data: unknown): string | null {
  if (data && typeof data === "object" && "message" in data) {
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return null;
}

/**
 * Maps Brevo HTTP errors to friendly pt-BR messages.
 */
export function friendlyBrevoError(status: number, data?: unknown): string {
  const detail = extractBrevoMessage(data);
  const lower = (detail || "").toLowerCase();

  switch (status) {
    case 0:
      return "Não foi possível conectar à API da Brevo. Verifique a rede.";
    case 400:
      if (lower.includes("template")) {
        return "O template selecionado está inativo ou não existe na Brevo.";
      }
      if (lower.includes("email") || lower.includes("to")) {
        return "E-mail do destinatário inválido para a Brevo.";
      }
      return detail
        ? `Dados inválidos enviados à Brevo: ${detail}`
        : "Dados inválidos enviados à Brevo.";
    case 401:
    case 403:
      return "Chave de API da Brevo inválida ou sem permissão de envio.";
    case 402:
      return "Créditos insuficientes na conta Brevo.";
    case 404:
      return "Template não encontrado na Brevo.";
    case 429:
      return "Limite de envios da Brevo atingido. Aguarde alguns instantes e tente novamente.";
    default:
      if (status >= 500) {
        return "Serviço da Brevo indisponível no momento. Tente novamente mais tarde.";
      }
      return detail
        ? `Erro da Brevo (${status}): ${detail}`
        : `Erro inesperado da Brevo (${status}).`;
  }
}
