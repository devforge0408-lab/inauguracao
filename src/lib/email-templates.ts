const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://convite.florescasaudefeminina.com.br"
).replace(/\/+$/, "");

const STORE_URL = "https://store.florescasaudefeminina.com.br/";

export type LocalEmailTemplate = {
  slug: string;
  name: string;
  subject: string;
  htmlContent: string;
};

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:#fbf7f3;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fbf7f3;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #ede1d8;border-radius:16px;overflow:hidden;">
          ${content}
          <tr>
            <td align="center" style="padding:20px 32px 28px;border-top:1px solid #f3e9e3;">
              <img src="${SITE_URL}/brand/logo-floresca.png" alt="Floresça" width="36" style="display:block;width:36px;height:auto;margin:0 auto 8px;" />
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:12px;color:#8a7e78;">
                Floresça · Saúde Integral Feminina
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const PROMO_INAUGURACAO_HTML = emailLayout(`
  <tr>
    <td align="center" style="background-color:#eaf4f1;padding:28px 32px;">
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;color:#3f7a6c;">
        Método Floresça
      </p>
      <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#5e9e90;">
        Um presente especial para você
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 32px 28px;">
      <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#453127;">
        Boa tarde! 🌸 Você conheceu o <strong>Método Floresça</strong> na inauguração,
        agora é hora de vivê-lo na prática.
      </p>
      <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#453127;">
        Preparamos um presente: <strong style="color:#b0574e;">30% de desconto</strong>
        em nossos produtos e serviços! 🎁
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
        <tr>
          <td style="background-color:#fdf6e9;border:1px solid #eeddb4;border-radius:12px;padding:14px 16px;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#8a6d2f;">
              ⏳ <strong>Mas atenção:</strong> essa promoção é válida apenas <strong>HOJE</strong>!
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#453127;">
        Clique no botão abaixo para aproveitar:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
        <tr>
          <td align="center" style="background-color:#b0574e;border-radius:12px;">
            <a href="${STORE_URL}" target="_blank" style="display:inline-block;padding:14px 36px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">
              Acessar loja ↗
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`);

const TESTE_CONEXAO_HTML = emailLayout(`
  <tr>
    <td style="padding:32px 32px 28px;">
      <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#b07e76;">
        Teste de e-mail
      </h1>
      <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#453127;">
        Se você recebeu esta mensagem, a integração com a Brevo está funcionando
        corretamente.
      </p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#8a7e78;">
        Enviado pelo módulo de e-mails — Inauguração Método Floresça.
      </p>
    </td>
  </tr>`);

export const EMAIL_TEMPLATES: LocalEmailTemplate[] = [
  {
    slug: "promocao-inauguracao",
    name: "Promoção pós-inauguração · 30% OFF",
    subject: "🌸 Um presente para você: 30% OFF na loja Floresça — só hoje!",
    htmlContent: PROMO_INAUGURACAO_HTML,
  },
  {
    slug: "teste-conexao",
    name: "Teste de conexão",
    subject: "Teste de configuração — Floresça",
    htmlContent: TESTE_CONEXAO_HTML,
  },
];

export function getEmailTemplate(slug: string): LocalEmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.slug === slug);
}
