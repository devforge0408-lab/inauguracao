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
