"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import {
  Slot,
  Rsvp,
  getEventSlots,
  submitRsvp,
  getEventRsvps,
} from "@/lib/firestore-service";

const EVENT_SLUG = "inauguracao";
const HORARIOS = ["15h30", "16h30", "17h30"];
const CAPACITY = 20;

function formatWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function InauguracaoPage() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsError, setSlotsError] = useState(false);

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [horario, setHorario] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState<{ nome: string; horario: string } | null>(null);

  const [adminAberto, setAdminAberto] = useState(false);
  const [adminCarregando, setAdminCarregando] = useState(false);
  const [adminLista, setAdminLista] = useState<Rsvp[] | null>(null);
  const [adminErro, setAdminErro] = useState(false);

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
    const whatsappLimpo = whatsapp.trim();
    const emailLimpo = email.trim();
    const dataNascimentoLimpa = dataNascimento.trim();

    if (!nomeLimpo || !whatsappLimpo) {
      setErro("Por favor, preencha nome e WhatsApp.");
      return;
    }
    if (!horario) {
      setErro("Por favor, escolha um horário.");
      return;
    }

    setSubmitting(true);

    const res = await submitRsvp({
      eventSlug: EVENT_SLUG,
      nome: nomeLimpo,
      whatsapp: whatsappLimpo,
      email: emailLimpo,
      dataNascimento: dataNascimentoLimpa,
      horario,
    });

    if (!res.success) {
      setErro(res.error || "Não foi possível enviar. Tente novamente em alguns segundos.");
      await carregarVagas();
      setSubmitting(false);
      return;
    }

    setConfirmado({ nome: nomeLimpo, horario });
    setSubmitting(false);
  }

  async function alternarAdmin() {
    const abrindo = !adminAberto;
    setAdminAberto(abrindo);
    if (!abrindo) return;

    setAdminCarregando(true);
    setAdminErro(false);

    try {
      const rows = await getEventRsvps(EVENT_SLUG);
      setAdminLista(rows);
      await carregarVagas();
    } catch {
      setAdminErro(true);
      setAdminLista(null);
    } finally {
      setAdminCarregando(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Image
          className={styles.logo}
          src="/brand/logo-floresca.png"
          alt="Floresça"
          width={84}
          height={84}
          priority
        />

        <h1>Boas-vindas ao nosso espaço</h1>
        <div className={styles.subtitle}>Método Floresça</div>
        <span className={styles.datePill}>Sábado, 12 de setembro</span>

        {!confirmado ? (
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="nome">Nome completo</label>
            <input
              type="text"
              id="nome"
              required
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <label htmlFor="whatsapp">WhatsApp</label>
            <input
              type="tel"
              id="whatsapp"
              required
              placeholder="(00) 00000-0000"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
            />

            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="dataNascimento">Data de nascimento</label>
            <input
              type="text"
              id="dataNascimento"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              value={dataNascimento}
              onChange={(e) => setDataNascimento(formatDate(e.target.value))}
            />

            <label>
              Escolha o horário{" "}
              <span style={{ fontWeight: "normal", color: "#B7AAA1" }}>
                (20 vagas por horário)
              </span>
            </label>
            {slotsError ? (
              <div className={styles.loadingNote}>
                não foi possível carregar vagas — tente recarregar a página
              </div>
            ) : slots === null ? (
              <div className={styles.loadingNote}>carregando vagas disponíveis...</div>
            ) : null}
            <div className={styles.slots}>
              {HORARIOS.map((h) => {
                const slotData = slots?.find((s) => s.horario === h);
                const remaining = slotData ? slotData.capacity - slotData.taken : CAPACITY;
                const cheio = slots !== null && !slotsError && remaining <= 0;
                return (
                  <div
                    key={h}
                    className={`${styles.slot} ${cheio ? styles.full : ""}`}
                  >
                    <input
                      type="radio"
                      name="horario"
                      id={`h-${h}`}
                      value={h}
                      checked={horario === h}
                      disabled={cheio}
                      onChange={() => setHorario(h)}
                    />
                    <label htmlFor={`h-${h}`}>
                      {h}
                      <small>
                        {slots !== null && !slotsError
                          ? cheio
                            ? "Esgotado"
                            : `${remaining} vaga${remaining === 1 ? "" : "s"}`
                          : ""}
                      </small>
                    </label>
                  </div>
                );
              })}
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? "Enviando..." : "Confirmar presença"}
            </button>
            <div className={`${styles.msg} ${erro ? styles.msgError : ""}`}>{erro}</div>
          </form>
        ) : (
          <div className={styles.successView}>
            <Image
              className={styles.logo}
              src="/brand/logo-floresca.png"
              alt="Floresça"
              width={90}
              height={90}
            />
            <h2>Presença confirmada!</h2>
            <p>
              {confirmado.nome}, sua vaga para as {confirmado.horario} está garantida. Até
              sábado! 🌷
            </p>
          </div>
        )}

        <button type="button" className={styles.adminToggle} onClick={alternarAdmin}>
          {adminAberto ? "ocultar confirmações" : "ver confirmações (equipe)"}
        </button>

        {adminAberto && (
          <div className={styles.adminPanel}>
            <h3>Confirmações recebidas</h3>
            {adminCarregando ? (
              <div>Carregando...</div>
            ) : adminErro || adminLista === null ? (
              <div>Ainda não há confirmações.</div>
            ) : adminLista.length === 0 ? (
              <div>Nenhuma confirmação ainda.</div>
            ) : (
              <>
                {adminLista.map((r) => (
                  <div key={r.id} className={styles.adminRow}>
                    <div>
                      <div><strong>{r.nome}</strong></div>
                      <div style={{ fontSize: "11px", color: "#8a7e78", marginTop: "2px" }}>
                        {r.whatsapp}
                        {r.email ? ` · ${r.email}` : ""}
                        {r.data_nascimento ? ` · Nasc: ${r.data_nascimento}` : ""}
                      </div>
                    </div>
                    <span style={{ fontWeight: "bold", color: "#74896a" }}>{r.horario}</span>
                  </div>
                ))}
                <div className={styles.adminTotal}>
                  {`Total: ${adminLista.length}  ·  ${HORARIOS.map(
                    (h) =>
                      `${h}: ${adminLista.filter((r) => r.horario === h).length}/${CAPACITY}`
                  ).join("  ·  ")}`}
                </div>
              </>
            )}
          </div>
        )}

        <div className={styles.disclaimer}>
          Suas informações (nome, WhatsApp, e-mail, data de nascimento e horário) ficam visíveis para a equipe Floresça
          responsável pela organização do evento.
        </div>
      </div>
    </div>
  );
}
