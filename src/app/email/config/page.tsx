"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  EmailTestRecipient,
  subscribeToEmailTestRecipients,
  addEmailTestRecipient,
  deleteEmailTestRecipient,
} from "@/lib/email-firestore";
import {
  BrevoConfigStatus,
  EmailTemplateInfo,
  EmailSendResponse,
} from "@/lib/email-types";
import { EmailShell } from "../_components/email-shell";
import { Toast, useToast } from "../_components/toast";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  MailPlus,
  Send,
  Server,
  Trash2,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";

const EVENT_SLUG = "inauguracao";

export default function EmailConfigPage() {
  const { user } = useAuth();
  const { toast, showToast, closeToast } = useToast();

  const [config, setConfig] = useState<BrevoConfigStatus | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const [recipients, setRecipients] = useState<EmailTestRecipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [templates, setTemplates] = useState<EmailTemplateInfo[]>([]);
  const [testTemplateSlug, setTestTemplateSlug] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/email/config")
      .then((res) => res.json())
      .then((data: BrevoConfigStatus) => setConfig(data))
      .catch((err) => {
        console.error("Erro ao carregar configuração:", err);
        showToast("Não foi possível verificar a configuração da Brevo.", "error");
      })
      .finally(() => setConfigLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Templates are hosted on the site — safe to preload on mount
  useEffect(() => {
    if (!user) return;
    fetch("/api/email/templates")
      .then((res) => res.json())
      .then((data) => {
        const list: EmailTemplateInfo[] = data.templates || [];
        setTemplates(list);
        if (list.length > 0) setTestTemplateSlug(list[0].slug);
      })
      .catch((err) => console.error("Erro ao carregar templates:", err));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setRecipientsLoading(true);
    const unsub = subscribeToEmailTestRecipients(
      EVENT_SLUG,
      (list) => {
        setRecipients(list);
        setRecipientsLoading(false);
      },
      (err) => {
        console.error("Erro ao escutar destinatários de teste:", err);
        setRecipientsLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await addEmailTestRecipient(EVENT_SLUG, { nome, email });
      if (res.success) {
        showToast("Destinatário de teste adicionado.");
        setNome("");
        setEmail("");
      } else {
        showToast(res.error || "Erro ao adicionar destinatário.", "error");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (recipient: EmailTestRecipient) => {
    setDeletingId(recipient.id);
    try {
      const res = await deleteEmailTestRecipient(EVENT_SLUG, recipient.id);
      if (res.success) {
        showToast(`${recipient.email} removido.`);
      } else {
        showToast(res.error || "Erro ao remover destinatário.", "error");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendTest = async (recipient: EmailTestRecipient) => {
    if (!testTemplateSlug) {
      showToast("Selecione um template para o envio de teste.", "error");
      return;
    }
    setTestingId(recipient.id);
    try {
      const payload = {
        to: recipient.email,
        templateSlug: testTemplateSlug,
        vars: { nome: recipient.nome },
      };

      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payloads: [payload] }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.friendlyError || "Erro ao enviar e-mail de teste.", "error");
        return;
      }

      const response = data as EmailSendResponse;
      const result = response.results[0];
      if (result?.success) {
        showToast(`E-mail de teste enviado para ${recipient.email}.`);
      } else {
        showToast(
          result?.friendlyError || `Falha ao enviar para ${recipient.email}.`,
          "error"
        );
      }
    } catch {
      showToast("Falha ao comunicar com o servidor.", "error");
    } finally {
      setTestingId(null);
    }
  };

  return (
    <EmailShell>
      <Toast toast={toast} onClose={closeToast} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brevo connection status */}
        <section className="bg-white rounded-2xl border border-[#ede1d8] shadow-2xs p-5">
          <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#8a7e78] mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-[#5e9e90]" />
            Conexão com a Brevo
          </h2>

          {configLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-[#5e9e90] animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium ${
                  config?.configured
                    ? "bg-[#eef5eb] border-[#b9d9af] text-[#3b662e]"
                    : "bg-[#fef2f2] border-[#fecaca] text-[#b0574e]"
                }`}
              >
                {config?.configured ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                {config?.configured
                  ? "API configurada e pronta para envio"
                  : "API não configurada"}
              </div>

              <dl className="rounded-xl border border-[#ede1d8] divide-y divide-[#f3e9e3] text-sm">
                <div className="flex items-center gap-3 px-4 py-3">
                  <KeyRound className="w-4 h-4 text-[#8a7e78] shrink-0" />
                  <dt className="text-[#8a7e78] w-32 shrink-0">Chave da API</dt>
                  <dd className="font-mono text-[#453127] truncate">
                    {config?.maskedKey || "—"}
                  </dd>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Mail className="w-4 h-4 text-[#8a7e78] shrink-0" />
                  <dt className="text-[#8a7e78] w-32 shrink-0">Remetente</dt>
                  <dd className="text-[#453127] truncate">
                    {config?.senderEmail || "—"}
                  </dd>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <User className="w-4 h-4 text-[#8a7e78] shrink-0" />
                  <dt className="text-[#8a7e78] w-32 shrink-0">Nome</dt>
                  <dd className="text-[#453127] truncate">
                    {config?.senderName || "—"}
                  </dd>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Server className="w-4 h-4 text-[#8a7e78] shrink-0" />
                  <dt className="text-[#8a7e78] w-32 shrink-0">Endpoint</dt>
                  <dd className="font-mono text-xs text-[#453127] truncate">
                    {config?.apiUrl || "—"}
                  </dd>
                </div>
              </dl>

              {!config?.configured && (
                <p className="text-xs text-[#8a7e78] flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#b0574e]" />
                  Configure BREVO_API_KEY e BREVO_SENDER_EMAIL no .env.local e
                  reinicie o servidor.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Test recipients */}
        <section className="bg-white rounded-2xl border border-[#ede1d8] shadow-2xs p-5 flex flex-col">
          <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#8a7e78] mb-4 flex items-center gap-2">
            <MailPlus className="w-4 h-4 text-[#5e9e90]" />
            Destinatários de teste
          </h2>

          <div className="mb-4">
            <label className="block text-xs font-medium text-[#8a7e78] mb-1.5">
              Template do teste
            </label>
            <select
              value={testTemplateSlug}
              onChange={(e) => setTestTemplateSlug(e.target.value)}
              disabled={templates.length === 0}
              className="w-full px-3 py-2.5 rounded-xl border border-[#e4d5cc] bg-[#fcf9f6] text-sm text-[#453127] focus:outline-none focus:ring-2 focus:ring-[#5e9e90]/30 focus:border-[#5e9e90] disabled:opacity-60"
            >
              {templates.length === 0 ? (
                <option value="">Nenhum template disponível</option>
              ) : (
                templates.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2.5 mb-4">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome"
              className="flex-1 px-3 py-2.5 rounded-xl border border-[#e4d5cc] bg-[#fcf9f6] text-sm text-[#453127] placeholder:text-[#c4b3a8] focus:outline-none focus:ring-2 focus:ring-[#5e9e90]/30 focus:border-[#5e9e90]"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="flex-1 px-3 py-2.5 rounded-xl border border-[#e4d5cc] bg-[#fcf9f6] text-sm text-[#453127] placeholder:text-[#c4b3a8] focus:outline-none focus:ring-2 focus:ring-[#5e9e90]/30 focus:border-[#5e9e90]"
            />
            <button
              type="submit"
              disabled={adding || !nome.trim() || !email.trim()}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-2xs ${
                adding || !nome.trim() || !email.trim()
                  ? "bg-[#f3e9e3] text-[#b8a99f] cursor-not-allowed"
                  : "bg-[#5e9e90] hover:bg-[#4f8a7d] text-white cursor-pointer"
              }`}
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Adicionar
            </button>
          </form>

          <div className="flex-1 min-h-0 overflow-y-auto max-h-[340px] rounded-xl border border-[#ede1d8] divide-y divide-[#f3e9e3]">
            {recipientsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-[#5e9e90] animate-spin" />
              </div>
            ) : recipients.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#8a7e78]">
                Nenhum destinatário de teste cadastrado.
              </p>
            ) : (
              recipients.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#453127] truncate">
                      {r.nome}
                    </p>
                    <p className="text-xs text-[#8a7e78] truncate">{r.email}</p>
                  </div>
                  <button
                    onClick={() => handleSendTest(r)}
                    disabled={testingId !== null || !config?.configured || !testTemplateSlug}
                    title={
                      !config?.configured
                        ? "Configure a Brevo para enviar testes"
                        : !testTemplateSlug
                          ? "Selecione um template acima"
                          : `Enviar "${templates.find((t) => t.slug === testTemplateSlug)?.name}" para ${r.email}`
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3f7a6c] bg-[#eaf4f1] hover:bg-[#dcede7] rounded-lg border border-[#cfe5de] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    {testingId === r.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Enviar teste</span>
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    disabled={deletingId !== null}
                    title="Remover destinatário"
                    className="p-1.5 text-[#b0574e] hover:bg-[#fef2f2] rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {deletingId === r.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>

          <p className="mt-3 text-xs text-[#8a7e78]">
            O teste dispara o template selecionado acima para o destinatário
            escolhido, exatamente como em um envio real.
          </p>
        </section>
      </div>
    </EmailShell>
  );
}
