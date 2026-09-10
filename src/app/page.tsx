"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Clock, Loader2, Lock, Users } from "lucide-react";
import {
  Slot,
  Rsvp,
  getEventSlots,
  submitRsvp,
  getEventRsvps,
} from "@/lib/firestore-service";

const EVENT_SLUG = "inauguracao";

function formatWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function InauguracaoPage() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsError, setSlotsError] = useState(false);

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [horario, setHorario] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState<{ nome: string; horario: string } | null>(null);

  const carregarVagas = useCallback(async () => {
    try {
      const lista = await getEventSlots(EVENT_SLUG);
      setSlots(lista);
      setSlotsError(false);
      return lista;
    } catch {
      setSlotsError(true);
      return null;
    }
  }, []);

  useEffect(() => {
    void carregarVagas();
  }, [carregarVagas]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const nomeLimpo = nome.trim();
    const digits = whatsapp.replace(/\D/g, "");

    if (nomeLimpo.length < 2) {
      setErro("Por favor, escreva seu nome completo.");
      return;
    }
    if (digits.length < 10) {
      setErro("Confira o número do WhatsApp — faltam dígitos.");
      return;
    }
    if (!horario) {
      setErro("Escolha um dos horários disponíveis.");
      return;
    }

    setSubmitting(true);

    const res = await submitRsvp({
      eventSlug: EVENT_SLUG,
      nome: nomeLimpo,
      whatsapp,
      horario,
    });

    if (!res.success) {
      setErro(res.error || "Não conseguimos enviar agora. Tente de novo em alguns segundos.");
      await carregarVagas();
      setSubmitting(false);
      return;
    }

    setConfirmado({ nome: nomeLimpo, horario });
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-[#FBF7F3] px-5 py-12 sm:py-16">
      {/* Fundo suave */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, #F9F1F1 0%, #FBF7F3 45%, #F2F4EF 100%)",
        }}
      />

      <main className="mx-auto w-full max-w-lg">
        <header className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/80 p-2 shadow-sm">
            <span className="font-display text-2xl font-semibold text-[#6D5040]">Floresça</span>
          </div>
          <h1 className="mt-5 font-display text-3xl font-normal tracking-tight text-[#6D5040] sm:text-4xl">
            Boas-vindas ao nosso espaço
          </h1>
          <p className="mt-2 text-sm tracking-[0.22em] text-[#6E7360] uppercase">
            Método Floresça
          </p>
          <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-[#EDDACB] bg-white/70 px-4 py-1.5 text-[13px] text-[#B8904F]">
            <Clock className="h-3.5 w-3.5" />
            Sábado, 12 de setembro
          </p>
        </header>

        <section className="mt-8 rounded-[26px] border border-[#EDDACB]/70 bg-white p-7 shadow-[0_14px_44px_-18px_rgba(109,80,64,0.28)] sm:p-9">
          {confirmado ? (
            <ConfirmacaoView {...confirmado} />
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <Campo label="Nome completo" htmlFor="nome">
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                  className="w-full rounded-xl border border-[#EDDACB] bg-[#FDFAF8] px-4 py-3 text-[15px] text-[#453127] outline-none transition placeholder:text-[#B7AAA1] focus:border-[#CB9392] focus:ring-2 focus:ring-[#CB9392]/20"
                />
              </Campo>

              <Campo label="WhatsApp" htmlFor="whatsapp">
                <input
                  id="whatsapp"
                  type="tel"
                  inputMode="numeric"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
                  placeholder="(00) 00000-0000"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-[#EDDACB] bg-[#FDFAF8] px-4 py-3 text-[15px] text-[#453127] outline-none transition placeholder:text-[#B7AAA1] focus:border-[#CB9392] focus:ring-2 focus:ring-[#CB9392]/20"
                />
              </Campo>

              <fieldset className="mt-6">
                <legend className="mb-2 text-[13px] text-[#453127]">
                  Escolha o horário{" "}
                  <span className="text-[#B7AAA1]">(20 vagas por horário)</span>
                </legend>
                <SeletorDeHorario
                  slots={slots}
                  erro={slotsError}
                  selecionado={horario}
                  onSelecionar={setHorario}
                />
              </fieldset>

              {erro && (
                <p className="mt-4 text-center text-[13px] text-[#B0574E]" role="alert">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6E7360] px-4 py-3.5 text-[15px] tracking-wide text-white transition hover:bg-[#5E6352] disabled:cursor-not-allowed disabled:bg-[#C9C1BA]"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Enviando…" : "Confirmar presença"}
              </button>
            </form>
          )}
        </section>

        <PainelEquipe onDadosMudarem={carregarVagas} />

        <p className="mx-auto mt-6 max-w-sm text-center text-[11px] leading-relaxed text-[#BBADA5]">
          Suas informações (nome, WhatsApp e horário) ficam visíveis apenas para a equipe
          Floresça responsável pela organização do evento.
        </p>
      </main>
    </div>
  );
}

function Campo({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 first:mt-0">
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] text-[#453127]">
        {label}
      </label>
      {children}
    </div>
  );
}

function SeletorDeHorario({
  slots,
  erro,
  selecionado,
  onSelecionar,
}: {
  slots: Slot[] | null;
  erro: boolean;
  selecionado: string | null;
  onSelecionar: (h: string) => void;
}) {
  if (erro) {
    return (
      <p className="rounded-xl border border-[#EDDACB] bg-[#FBF7F3] px-4 py-3 text-center text-[13px] text-[#8A7A70]">
        Não foi possível carregar as vagas. Recarregue a página.
      </p>
    );
  }

  if (!slots) {
    return (
      <div className="flex gap-2.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[62px] flex-1 animate-pulse rounded-xl border border-[#EDDACB] bg-[#FDFAF8]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {slots.map((slot) => {
        const restantes = slot.capacity - slot.taken;
        const esgotado = restantes <= 0;
        const ativo = selecionado === slot.horario;

        return (
          <button
            key={slot.horario}
            type="button"
            disabled={esgotado}
            aria-pressed={ativo}
            onClick={() => onSelecionar(slot.horario)}
            className={[
              "min-w-[100px] flex-1 rounded-xl border px-2 py-3 text-center transition",
              esgotado
                ? "cursor-not-allowed border-[#EEE2DC] bg-[#F7F1EE] text-[#C9BBB2]"
                : ativo
                  ? "border-[#6E7360] bg-[#F2F4EF] font-medium text-[#6E7360]"
                  : "border-[#EDDACB] bg-[#FDFAF8] text-[#453127] hover:border-[#CB9392]",
            ].join(" ")}
          >
            <span className={esgotado ? "text-[14px] line-through" : "text-[14px]"}>
              {slot.horario}
            </span>
            <small
              className={[
                "mt-0.5 block text-[10.5px]",
                esgotado ? "text-[#C77]" : "italic text-[#B7AAA1]",
              ].join(" ")}
            >
              {esgotado ? "Esgotado" : `${restantes} vaga${restantes === 1 ? "" : "s"}`}
            </small>
          </button>
        );
      })}
    </div>
  );
}

function ConfirmacaoView({ nome, horario }: { nome: string; horario: string }) {
  return (
    <div className="py-2 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F2F4EF] text-[#6E7360]">
        <Check className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-normal text-[#6D5040]">
        Presença confirmada!
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-[#453127]">
        {nome}, sua vaga para as <strong className="font-medium">{horario}</strong> está
        garantida. Até sábado! 🌷
      </p>
    </div>
  );
}

/**
 * Lista de confirmações para a equipe organizadora.
 */
function PainelEquipe({ onDadosMudarem }: { onDadosMudarem: () => Promise<Slot[] | null> }) {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [lista, setLista] = useState<Rsvp[] | null>(null);
  const [semAcesso, setSemAcesso] = useState(false);

  async function alternar() {
    const abrindo = !aberto;
    setAberto(abrindo);
    if (!abrindo) return;

    setCarregando(true);
    setSemAcesso(false);

    try {
      const data = await getEventRsvps(EVENT_SLUG);
      setLista(data);
      await onDadosMudarem();
    } catch {
      setSemAcesso(true);
      setLista(null);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={alternar}
        className="mx-auto block text-[11px] text-[#C9BBB2] underline underline-offset-2 transition hover:text-[#8A7A70]"
      >
        {aberto ? "ocultar confirmações" : "ver confirmações (equipe)"}
      </button>

      {aberto && (
        <div className="mt-4 rounded-2xl border border-dashed border-[#EDDACB] bg-white/60 p-5">
          <h3 className="flex items-center gap-2 text-sm font-normal text-[#6E7360]">
            <Users className="h-4 w-4" />
            Confirmações recebidas
          </h3>

          {carregando && (
            <p className="mt-3 text-[13px] text-[#B7AAA1]">Carregando…</p>
          )}

          {!carregando && semAcesso && (
            <div className="mt-3 flex items-start gap-2.5 text-[13px] text-[#8A7A70]">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#C9BBB2]" />
              <p>
                Esta lista contém dados pessoais e só aparece para a equipe.
              </p>
            </div>
          )}

          {!carregando && lista && lista.length === 0 && (
            <p className="mt-3 text-[13px] text-[#B7AAA1]">Nenhuma confirmação ainda.</p>
          )}

          {!carregando && lista && lista.length > 0 && (
            <>
              <ul className="mt-3 max-h-60 overflow-y-auto divide-y divide-[#F3E9E3]">
                {lista.map((r) => (
                  <li
                    key={r.id}
                    className="flex justify-between items-center gap-3 py-2 text-[13px] text-[#453127]"
                  >
                    <span className="truncate">
                      {r.nome} <span className="text-[#B7AAA1]">· {r.whatsapp}</span>
                    </span>
                    <span className="shrink-0 font-medium text-[#6E7360]">{r.horario}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-right text-[13px] font-medium text-[#B8904F]">
                Total: {lista.length}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
