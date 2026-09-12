export type EmailTemplateInfo = {
  slug: string;
  name: string;
  subject: string;
  htmlContent: string;
};

export type BrevoConfigStatus = {
  configured: boolean;
  maskedKey: string | null;
  senderEmail: string | null;
  senderName: string | null;
  apiUrl: string;
};

export type EmailSendPayload = {
  to: string;
  templateSlug: string;
  /** Substitui {{nome}} e {{horario}} no template no momento do envio. */
  vars?: Record<string, string>;
};

export type EmailSendResult = {
  to: string;
  success: boolean;
  status: number;
  friendlyError?: string;
};

export type EmailSendResponse = {
  sent: number;
  failed: number;
  results: EmailSendResult[];
};
