"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EmailTemplateInfo } from "@/lib/email-types";
import { EmailShell } from "../_components/email-shell";
import { Toast, useToast } from "../_components/toast";
import {
  Eye,
  LayoutTemplate,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";

const previewSample = (text: string) =>
  text
    .replace(/\{\{\s*nome\s*\}\}/gi, "Maria")
    .replace(/\{\{\s*horario\s*\}\}/gi, "15h30");

export default function EmailTemplatesPage() {
  const { user } = useAuth();
  const { toast, showToast, closeToast } = useToast();

  const [templates, setTemplates] = useState<EmailTemplateInfo[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const syncTemplates = async (silent = false) => {
    setSyncing(true);
    try {
      const res = await fetch("/api/email/templates");
      const data = await res.json();
      if (!res.ok) {
        showToast(data.friendlyError || "Erro ao carregar templates.", "error");
        return;
      }
      const list: EmailTemplateInfo[] = data.templates || [];
      setTemplates(list);
      setTemplatesLoaded(true);
      if (!list.some((t) => t.slug === selectedSlug)) {
        setSelectedSlug(list[0]?.slug ?? null);
      }
      if (!silent) {
        showToast(
          list.length === 0
            ? "Nenhum template disponível no site."
            : `${list.length} template(s) carregados.`,
          list.length === 0 ? "error" : "success"
        );
      }
    } catch {
      if (!silent) showToast("Falha ao comunicar com o servidor.", "error");
    } finally {
      setSyncing(false);
    }
  };

  // Templates are hosted on the site — safe to preload on mount
  useEffect(() => {
    if (!user) return;
    syncTemplates(true);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = useMemo(
    () => templates.find((t) => t.slug === selectedSlug) || null,
    [templates, selectedSlug]
  );

  return (
    <EmailShell>
      <Toast toast={toast} onClose={closeToast} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Templates list */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-[#ede1d8] shadow-2xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#8a7e78] flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-[#5e9e90]" />
              Templates do site
            </h2>
            <button
              onClick={() => syncTemplates()}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3f7a6c] bg-[#eaf4f1] hover:bg-[#dcede7] rounded-lg border border-[#cfe5de] transition-colors disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>Sincronizar</span>
            </button>
          </div>

          {!templatesLoaded ? (
            <div className="flex-1 flex items-center justify-center py-10">
              {syncing ? (
                <Loader2 className="w-6 h-6 text-[#5e9e90] animate-spin" />
              ) : (
                <p className="text-sm text-[#8a7e78]">
                  Clique em <strong>Sincronizar</strong> para carregar os templates.
                </p>
              )}
            </div>
          ) : templates.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 border border-dashed border-[#e4d5cc] rounded-xl">
              <LayoutTemplate className="w-8 h-8 text-[#d8c5bb] mb-2" />
              <p className="text-sm text-[#8a7e78]">
                Nenhum template cadastrado no site.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-[#ede1d8] divide-y divide-[#f3e9e3]">
              {templates.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => setSelectedSlug(t.slug)}
                  className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                    selectedSlug === t.slug
                      ? "bg-[#eaf4f1]"
                      : "hover:bg-[#fcf9f6]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`text-sm font-semibold truncate ${
                        selectedSlug === t.slug ? "text-[#3f7a6c]" : "text-[#453127]"
                      }`}
                    >
                      {t.name}
                    </p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f8f2ed] border border-[#ebdcd3] text-[#8a7e78] shrink-0">
                      {t.slug}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#8a7e78] truncate flex items-center gap-1.5">
                    <Mail className="w-3 h-3 shrink-0" />
                    {t.subject || "(sem assunto)"}
                  </p>
                </button>
              ))}
            </div>
          )}

          <p className="mt-3 text-xs text-[#8a7e78]">
            Os templates ficam no código do site
            (<code className="bg-[#f8f2ed] px-1 rounded">src/lib/email-templates.ts</code>).
            As variáveis <code className="bg-[#f8f2ed] px-1 rounded">{"{{nome}}"}</code> e{" "}
            <code className="bg-[#f8f2ed] px-1 rounded">{"{{horario}}"}</code> são
            substituídas pelo servidor no momento do envio.
          </p>
        </section>

        {/* Preview */}
        <section className="lg:col-span-3 bg-white rounded-2xl border border-[#ede1d8] shadow-2xs p-5 flex flex-col">
          <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#8a7e78] mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#5e9e90]" />
            Pré-visualização
          </h2>

          {selected ? (
            <>
              <div className="px-3 py-2 rounded-lg bg-[#eaf4f1] border border-[#cfe5de] text-sm text-[#3f7a6c] font-medium mb-3">
                {previewSample(selected.subject) || "(sem assunto)"}
              </div>
              <iframe
                title={`Pré-visualização: ${selected.name}`}
                sandbox=""
                srcDoc={previewSample(selected.htmlContent)}
                className="w-full flex-1 min-h-[480px] rounded-xl border border-[#ede1d8] bg-white"
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16 border border-dashed border-[#e4d5cc] rounded-xl">
              <Eye className="w-8 h-8 text-[#d8c5bb] mb-2" />
              <p className="text-sm text-[#8a7e78]">
                Selecione um template para visualizar.
              </p>
            </div>
          )}
        </section>
      </div>
    </EmailShell>
  );
}
