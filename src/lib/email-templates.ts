const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://convite.florescasaudefeminina.com.br"
).replace(/\/+$/, "");

const STORE_URL = "https://store.florescasaudefeminina.com.br/";
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Rua+Cap.+Cassiano+Ricardo+de+Toledo,+191+-+Ch%C3%A1cara+Urbana,+Jundia%C3%AD+-+SP,+13201-840";

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

function emailHeader(title: string, kicker: string): string {
  return `
  <tr>
    <td align="center" style="background-color:#eaf4f1;padding:28px 32px;">
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;color:#3f7a6c;">
        ${title}
      </p>
      <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#5e9e90;">
        ${kicker}
      </p>
    </td>
  </tr>`;
}

function ctaButton(label: string, url: string): string {
  return `
      <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
        <tr>
          <td align="center" style="background-color:#b0574e;border-radius:12px;">
            <a href="${url}" target="_blank" style="display:inline-block;padding:14px 36px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">
              ${label}
            </a>
          </td>
        </tr>
      </table>`;
}

function infoBox(html: string): string {
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
        <tr>
          <td style="background-color:#fdf6e9;border:1px solid #eeddb4;border-radius:12px;padding:14px 16px;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#8a6d2f;">
              ${html}
            </p>
          </td>
        </tr>
      </table>`;
}

const P = (inner: string) =>
  `<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#453127;">${inner}</p>`;

const LEMBRETE_HTML = emailLayout(`
  ${emailHeader("Método Floresça", "É amanhã!")}
  <tr>
    <td style="padding:32px 32px 28px;">
      ${P("Olá, {{nome}}! 🌸")}
      ${P("Amanhã é o grande dia: a inauguração do <strong>Espaço Floresça</strong> e a sua visita exclusiva para conhecer o Método Floresça de pertinho.")}
      ${infoBox("🕰️ <strong>Sábado, 12 de setembro</strong> — seu horário: <strong>{{horario}}</strong><br />📍 Golden Office · Sala 1108<br />Rua Cap. Cassiano Ricardo de Toledo, 191 — Chácara Urbana, Jundiaí - SP")}
      ${P("Prepare-se para uma tarde de acolhimento, boas conversas e uma experiência pensada para você. Estamos contando os minutos para te receber!")}
      ${P("Precisa de ajuda para chegar? Toque no botão abaixo:")}
      ${ctaButton("Como chegar ↗", MAPS_URL)}
      <p style="margin:22px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#8a7e78;">
        Se algo mudar e você não puder comparecer, é só responder este e-mail.
      </p>
    </td>
  </tr>`);

const PROMO_INAUGURACAO_HTML = emailLayout(`
  ${emailHeader("Método Floresça", "Um presente especial para você")}
  <tr>
    <td style="padding:32px 32px 28px;">
      ${P("Boa tarde, {{nome}}! 🌸 Você conheceu o <strong>Método Floresça</strong> na inauguração, agora é hora de vivê-lo na prática.")}
      ${P("Preparamos um presente: <strong style=\"color:#b0574e;\">30% de desconto</strong> em nossos produtos e serviços! 🎁")}
      ${infoBox("⏳ <strong>Mas atenção:</strong> essa promoção é válida apenas <strong>HOJE</strong>!")}
      ${P("Clique no botão abaixo para aproveitar:")}
      ${ctaButton("Acessar loja ↗", STORE_URL)}
    </td>
  </tr>`);

const AGRADECIMENTO_HTML = emailLayout(`
  ${emailHeader("Método Floresça", "Obrigada por florir com a gente")}
  <tr>
    <td style="padding:32px 32px 28px;">
      ${P("Olá, {{nome}}! 🌷")}
      ${P("Que alegria foi receber você na inauguração do Espaço Floresça! Cada presença tornou aquele sábado ainda mais especial.")}
      ${P("Esperamos que a experiência com o <strong>Método Floresça</strong> tenha acendido em você a vontade de cuidar da sua saúde de forma integral — corpo, mente e essência.")}
      ${P("Nossa loja segue aberta com produtos e serviços pensados para o seu bem-estar. Sempre que quiser continuar essa jornada, estamos aqui:")}
      ${ctaButton("Conhecer a loja ↗", STORE_URL)}
      <p style="margin:22px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#8a7e78;">
        Com carinho,<br />Equipe Floresça
      </p>
    </td>
  </tr>`);

const RESGATE_HTML = emailLayout(`
  ${emailHeader("Método Floresça", "Ainda dá tempo")}
  <tr>
    <td style="padding:32px 32px 28px;">
      ${P("Olá, {{nome}}! 🌸")}
      ${P("Você esteve com a gente na inauguração e conheceu de perto o <strong>Método Floresça</strong>. Se ficou aquela vontade de começar, ainda dá tempo!")}
      ${P("Como forma de agradecimento pela sua presença, liberamos <strong style=\"color:#b0574e;\">30% de desconto</strong> em todos os produtos e serviços — por tempo limitado.")}
      ${infoBox("⏳ A condição especial de inauguração está quase terminando. Garanta a sua!")}
      ${P("Toque no botão e escolha o que faz sentido para você neste momento:")}
      ${ctaButton("Aproveitar desconto ↗", STORE_URL)}
      <p style="margin:22px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#8a7e78;">
        Ficou com alguma dúvida? Responda este e-mail que a nossa equipe te ajuda.
      </p>
    </td>
  </tr>`);

const TESTE_CONEXAO_HTML = emailLayout(`
  <tr>
    <td style="padding:32px 32px 28px;">
      <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#b07e76;">
        Teste de e-mail
      </h1>
      ${P("Olá, {{nome}}! Se você recebeu esta mensagem, a integração de envio está funcionando corretamente.")}
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#8a7e78;">
        Enviado pelo módulo de e-mails — Inauguração Método Floresça.
      </p>
    </td>
  </tr>`);

export const EMAIL_TEMPLATES: LocalEmailTemplate[] = [
  {
    slug: "lembrete-inauguracao",
    name: "Lembrete · É amanhã!",
    subject: "🌸 {{nome}}, amanhã é a inauguração do Espaço Floresça!",
    htmlContent: LEMBRETE_HTML,
  },
  {
    slug: "promocao-inauguracao",
    name: "Promoção · 30% OFF (só hoje)",
    subject: "🌸 Um presente para você: 30% OFF na loja Floresça — só hoje!",
    htmlContent: PROMO_INAUGURACAO_HTML,
  },
  {
    slug: "agradecimento-pos-evento",
    name: "Pós-evento · Agradecimento",
    subject: "🌷 Obrigada por florir com a gente, {{nome}}!",
    htmlContent: AGRADECIMENTO_HTML,
  },
  {
    slug: "resgate-pos-evento",
    name: "Pós-evento · Resgate (30% OFF)",
    subject: "🌸 {{nome}}, ainda dá tempo: 30% OFF na Floresça",
    htmlContent: RESGATE_HTML,
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

const TEMPLATE_VAR_FALLBACKS: Record<string, string> = {
  nome: "querida",
  horario: "seu horário",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

/**
 * Renders a template substituting {{nome}} and {{horario}} with the
 * recipient's data (HTML-escaped). Missing values get safe fallbacks.
 */
export function renderEmailTemplate(
  template: LocalEmailTemplate,
  vars?: Record<string, string>
): { subject: string; htmlContent: string } {
  const resolve = (key: string) => {
    const raw = vars?.[key]?.trim();
    return raw || TEMPLATE_VAR_FALLBACKS[key] || "";
  };

  let subject = template.subject;
  let htmlContent = template.htmlContent;

  for (const key of ["nome", "horario"]) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    htmlContent = htmlContent.replace(pattern, escapeHtml(resolve(key)));
    subject = subject.replace(
      pattern,
      resolve(key).replace(/[<>&"']/g, "")
    );
  }

  return { subject, htmlContent };
}
