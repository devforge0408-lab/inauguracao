"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Rsvp,
  Slot,
  subscribeToEventSlots,
  subscribeToEventRsvps,
} from "@/lib/firestore-service";
import { isValidEmail, normalizeEmail } from "@/lib/email-utils";
import {
  EmailTemplateInfo,
  EmailSendResponse,
  EmailSendResult,
} from "@/lib/email-types";
import { EmailShell } from "./_components/email-shell";
import { Toast, useToast } from "./_components/toast";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FlaskConical,
  Loader2,
  Mail,
  MailWarning,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";

const EVENT_SLUG = "inauguracao";

type PreparedPayload = { to: string; templateSlug: string };

export default function EmailSendPage() {
  const { user } = useAuth();
  const { toast, showToast, closeToast } = useToast();

  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [templates, setTemplates] = useState<EmailTemplateInfo[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState<string | null>(null);

  const [selectedHorario, setSelectedHorario] = useState<string>("todos");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionReady, setSelectionReady] = useState(false);

  const [mode, setMode] = useState<"simulacao" | "real">("simulacao");
  const [prepared, setPrepared] = useState<PreparedPayload[] | null>(null);
  const [sendResults, setSendResults] = useState<EmailSendResult[] | null>(null);
  const [sending, setSending] = useState(false);

  // Firestore real-time data (RSVPs + horários)
  useEffect(() => {
    if (!user) return;
    setDataLoading(true);

    const unsubSlots = subscribeToEventSlots(
      EVENT_SLUG,
      (list) => setSlots(list),
      (err) => console.error("Erro ao escutar slots:", err)
    );
    const unsubRsvps = subscribeToEventRsvps(
      EVENT_SLUG,
      (list) => {
        setRsvps(list);
        setDataLoading(false);
      },
      (err) => {
        console.error("Erro ao escutar RSVPs:", err);
        setDataLoading(false);
      }
    );

    return () => {
      unsubSlots();
      unsubRsvps();
    };
  }, [user]);

  // Default selection: everyone with a valid e-mail (first load only)
  useEffect(() => {
    if (selectionReady || dataLoading) return;
    const initial = new Set(
      rsvps.filter((r) => isValidEmail(r.email)).map((r) => r.id)
    );
    setSelected(initial);
    setSelectionReady(true);
  }, [rsvps, dataLoading, selectionReady]);

  const filteredRsvps = useMemo(() => {
    if (selectedHorario === "todos") return rsvps;
    return rsvps.filter((r) => r.horario === selectedHorario);
  }, [rsvps, selectedHorario]);

  const validFiltered = useMemo(
    () => filteredRsvps.filter((r) => isValidEmail(r.email)),
    [filteredRsvps]
  );

  const selectedValid = useMemo(
    () => validFiltered.filter((r) => selected.has(r.id)),
    [validFiltered, selected]
  );

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.slug === selectedTemplateSlug) || null,
    [templates, selectedTemplateSlug]
  );

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
      if (list.length === 0) {
        if (!silent) showToast("Nenhum template disponível no site.", "error");
      } else {
        if (!silent) showToast(`${list.length} template(s) carregados.`);
        if (!list.some((t) => t.slug === selectedTemplateSlug)) {
          setSelectedTemplateSlug(list[0].slug);
        }
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

  const toggleRecipient = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    const allValidSelected =
      validFiltered.length > 0 && validFiltered.every((r) => selected.has(r.id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allValidSelected) {
        validFiltered.forEach((r) => next.delete(r.id));
      } else {
        validFiltered.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const buildPayloads = (): PreparedPayload[] =>
    selectedValid.map((r) => ({
      to: normalizeEmail(r.email || ""),
      templateSlug: selectedTemplate!.slug,
    }));

  const handleAction = async () => {
    if (!selectedTemplate || selectedValid.length === 0) return;
    const payloads = buildPayloads();

    if (mode === "simulacao") {
      setPrepared(payloads);
      setSendResults(null);
      showToast(`Simulação preparada: ${payloads.length} payload(s) prontos.`);
      return;
    }

    setSending(true);
    setSendResults(null);
    setPrepared(null);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payloads }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.friendlyError || "Erro ao enviar e-mails.", "error");
        return;
      }

      const response = data as EmailSendResponse;
      setSendResults(response.results);

      if (response.failed > 0) {
        const firstError = response.results.find((r) => !r.success)?.friendlyError;
        showToast(
          firstError || `${response.failed} envio(s) falharam.`,
          "error"
        );
      } else {
        showToast(`${response.sent} e-mail(s) enviados com sucesso!`);
      }
    } catch {
      showToast("Falha ao comunicar com o servidor.", "error");
    } finally {
      setSending(false);
    }
  };

  const actionDisabled =
    !selectedTemplate || selectedValid.length === 0 || sending;

  const allFilteredSelected =
    validFiltered.length > 0 && validFiltered.every((r) => selected.has(r.id));

  return (
    <EmailShell>
      <Toast toast={toast} onClose={closeToast} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Template selection + preview */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-[#ede1d8] shadow-2xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#8a7e78] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#5e9e90]" />
              Template de e-mail
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

          {!templatesLoaded && !syncing && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 border border-dashed border-[#e4d5cc] rounded-xl">
              <Mail className="w-8 h-8 text-[#d8c5bb] mb-2" />
              <p className="text-sm text-[#8a7e78]">
                Clique em <strong>Sincronizar</strong> para carregar os templates
                do site.
              </p>
            </div>
          )}

          {syncing && !templatesLoaded && (
            <div className="flex-1 flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-[#5e9e90] animate-spin" />
            </div>
          )}

          {templatesLoaded && (
            <>
              <select
                value={selectedTemplateSlug ?? ""}
                onChange={(e) =>
                  setSelectedTemplateSlug(e.target.value || null)
                }
                className="w-full px-3 py-2.5 rounded-xl border border-[#e4d5cc] bg-[#fcf9f6] text-sm text-[#453127] focus:outline-none focus:ring-2 focus:ring-[#5e9e90]/30 focus:border-[#5e9e90]"
              >
                <option value="">Selecione um template...</option>
                {templates.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>

              {selectedTemplate ? (
                <div className="mt-4 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 mb-2 text-xs text-[#8a7e78]">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="font-medium uppercase tracking-wider">
                      Pré-visualização
                    </span>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-[#eaf4f1] border border-[#cfe5de] text-sm text-[#3f7a6c] font-medium mb-3 truncate">
                    {selectedTemplate.subject || "(sem assunto)"}
                  </div>
                  {selectedTemplate.htmlContent ? (
                    <iframe
                      title="Pré-visualização do template"
                      sandbox=""
                      srcDoc={selectedTemplate.htmlContent}
                      className="w-full flex-1 min-h-[280px] rounded-xl border border-[#ede1d8] bg-white"
                    />
                  ) : (
                    <p className="text-xs text-[#8a7e78] italic">
                      Este template não possui conteúdo HTML disponível para
                      pré-visualização.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-xs text-[#8a7e78] italic">
                  Selecione um template para visualizar o conteúdo.
                </p>
              )}
            </>
          )}
        </section>

        {/* Recipients */}
        <section className="lg:col-span-3 bg-white rounded-2xl border border-[#ede1d8] shadow-2xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#8a7e78] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#5e9e90]" />
              Destinatários por horário
            </h2>
            <label className="inline-flex items-center gap-2 text-xs text-[#8a7e78] cursor-pointer">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleAllFiltered}
                className="w-4 h-4 rounded accent-[#5e9e90]"
              />
              Todos com e-mail válido
            </label>
          </div>

          {/* Horário filter chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedHorario("todos")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                selectedHorario === "todos"
                  ? "bg-[#eaf4f1] text-[#3f7a6c] border-[#cfe5de]"
                  : "bg-[#f8f2ed] text-[#8a7e78] border-[#ebdcd3] hover:bg-[#f0e6de]"
              }`}
            >
              Todos ({rsvps.length})
            </button>
            {slots.map((slot) => {
              const count = rsvps.filter((r) => r.horario === slot.horario).length;
              return (
                <button
                  key={slot.horario}
                  onClick={() => setSelectedHorario(slot.horario)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    selectedHorario === slot.horario
                      ? "bg-[#eaf4f1] text-[#3f7a6c] border-[#cfe5de]"
                      : "bg-[#f8f2ed] text-[#8a7e78] border-[#ebdcd3] hover:bg-[#f0e6de]"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {slot.horario} ({count})
                </button>
              );
            })}
          </div>

          {/* Recipients list */}
          <div className="flex-1 min-h-0 overflow-y-auto max-h-[380px] rounded-xl border border-[#ede1d8] divide-y divide-[#f3e9e3]">
            {dataLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#5e9e90] animate-spin" />
              </div>
            ) : filteredRsvps.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#8a7e78]">
                Nenhuma confirmação encontrada para este filtro.
              </p>
            ) : (
              filteredRsvps.map((r) => {
                const valid = isValidEmail(r.email);
                return (
                  <label
                    key={r.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      valid ? "cursor-pointer hover:bg-[#fcf9f6]" : "opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={!valid}
                      checked={selected.has(r.id)}
                      onChange={() => toggleRecipient(r.id)}
                      className="w-4 h-4 rounded accent-[#5e9e90] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#453127] truncate">
                        {r.nome}
                      </p>
                      <p className="text-xs text-[#8a7e78] truncate">
                        {r.email || "—"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#f8f2ed] border border-[#ebdcd3] text-[#8a7e78] shrink-0">
                      <Clock className="w-3 h-3" />
                      {r.horario}
                    </span>
                    {valid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#eef5eb] border border-[#b9d9af] text-[#3b662e] shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        válido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#fef2f2] border border-[#fecaca] text-[#b0574e] shrink-0">
                        <MailWarning className="w-3 h-3" />
                        inválido
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>

          <p className="mt-3 text-xs text-[#8a7e78]">
            {selectedValid.length} destinatário(s) selecionado(s) com e-mail válido
            {selectedHorario !== "todos" && ` no horário ${selectedHorario}`}.
          </p>
        </section>
      </div>

      {/* Action bar */}
      <section className="mt-6 bg-white rounded-2xl border border-[#ede1d8] shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="inline-flex rounded-xl border border-[#e4d5cc] bg-[#f8f2ed] p-1 w-fit">
            <button
              onClick={() => setMode("simulacao")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                mode === "simulacao"
                  ? "bg-white text-[#3f7a6c] shadow-2xs border border-[#cfe5de]"
                  : "text-[#8a7e78] border border-transparent"
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              Simulação
            </button>
            <button
              onClick={() => setMode("real")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                mode === "real"
                  ? "bg-white text-[#b0574e] shadow-2xs border border-[#f3d3cd]"
                  : "text-[#8a7e78] border border-transparent"
              }`}
            >
              <Send className="w-4 h-4" />
              Envio real
            </button>
          </div>

          <button
            onClick={handleAction}
            disabled={actionDisabled}
            className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-2xs ${
              actionDisabled
                ? "bg-[#f3e9e3] text-[#b8a99f] cursor-not-allowed"
                : mode === "real"
                  ? "bg-[#b0574e] hover:bg-[#9c4a42] text-white cursor-pointer"
                  : "bg-[#5e9e90] hover:bg-[#4f8a7d] text-white cursor-pointer"
            }`}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "real" ? (
              <Send className="w-4 h-4" />
            ) : (
              <FlaskConical className="w-4 h-4" />
            )}
            {mode === "real"
              ? `Enviar para ${selectedValid.length} destinatário(s)`
              : "Preparar payloads"}
          </button>
        </div>

        {!selectedTemplate && templatesLoaded && (
          <p className="mt-3 text-xs text-[#b0574e] flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Selecione um template para habilitar o envio.
          </p>
        )}

        {/* Simulation output */}
        {prepared && (
          <div className="mt-5">
            <h3 className="font-serif text-xs font-semibold uppercase tracking-wider text-[#8a7e78] mb-2">
              Payloads preparados ({prepared.length})
            </h3>
            <div className="max-h-56 overflow-y-auto rounded-xl border border-[#ede1d8] divide-y divide-[#f3e9e3]">
              {prepared.map((p, i) => (
                <div
                  key={`${p.to}-${i}`}
                  className="flex items-center justify-between px-4 py-2 text-xs"
                >
                  <span className="font-mono text-[#453127]">{p.to}</span>
                  <span className="text-[#8a7e78]">template: {p.templateSlug}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send results */}
        {sendResults && (
          <div className="mt-5">
            <h3 className="font-serif text-xs font-semibold uppercase tracking-wider text-[#8a7e78] mb-2">
              Resultado do envio ({sendResults.filter((r) => r.success).length}/
              {sendResults.length} entregues)
            </h3>
            <div className="max-h-56 overflow-y-auto rounded-xl border border-[#ede1d8] divide-y divide-[#f3e9e3]">
              {sendResults.map((r, i) => (
                <div
                  key={`${r.to}-${i}`}
                  className="flex items-center justify-between gap-3 px-4 py-2 text-xs"
                >
                  <span className="font-mono text-[#453127] truncate">{r.to}</span>
                  {r.success ? (
                    <span className="inline-flex items-center gap-1 text-[#3b662e] shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      enviado ({r.status})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[#b0574e] shrink-0">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {r.friendlyError || `falha (${r.status})`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </EmailShell>
  );
}
