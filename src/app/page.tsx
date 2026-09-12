"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import {
  Slot,
  subscribeToEventSlots,
  submitRsvp,
} from "@/lib/firestore-service";

const EVENT_SLUG = "inauguracao";
const DEFAULT_SLOTS: Slot[] = [
  { horario: "15h30", capacity: 20, taken: 0, ordem: 1 },
  { horario: "16h30", capacity: 20, taken: 0, ordem: 2 },
  { horario: "17h30", capacity: 20, taken: 0, ordem: 3 },
];

const CONFETTI_COLORS = ["#b07e76", "#74896a", "#d8b35a", "#d8919a", "#9e7bb5"];
const CONFETTI_PIECES = Array.from({ length: 36 }, (_, index) => index);

const EVENT_DETAILS = {
  title: "Inauguração · Espaço Floresça",
  description:
    "Visita exclusiva e inauguração do novo Espaço Floresça — Saúde Integral Feminina.",
  location: "Espaço Floresça",
  building: "Golden Office",
  room: "Sala 1108",
  street: "Rua Cap. Cassiano Ricardo de Toledo, 191",
  neighborhood: "Chácara Urbana",
  city: "Jundiaí - SP",
  cep: "13201-840",
  fullAddress:
    "Rua Cap. Cassiano Ricardo de Toledo, 191 - Sala 1108 (Golden Office) - Chácara Urbana, Jundiaí - SP, 13201-840",
  shortAddress:
    "Golden Office · Sala 1108 — Chácara Urbana, Jundiaí - SP",
  dateString: "Sábado, 12 de Setembro",
  mapsEmbedSrc:
    "https://maps.google.com/maps?q=Rua%20Cap.%20Cassiano%20Ricardo%20de%20Toledo%2C%20191%20Jundia%C3%AD&t=&z=16&ie=UTF8&iwloc=&output=embed",
  googleMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Rua+Cap.+Cassiano+Ricardo+de+Toledo,+191+-+Ch%C3%A1cara+Urbana,+Jundia%C3%AD+-+SP,+13201-840",
  wazeUrl:
    "https://waze.com/ul?q=Rua%20Cap.%20Cassiano%20Ricardo%20de%20Toledo%2C%20191%20Jundia%C3%AD&navigate=yes",
};

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

function getEventDates(horario: string) {
  const match = horario.match(/(\d{1,2})[h:]?(\d{2})?/i);
  const hour = match ? parseInt(match[1], 10) : 15;
  const minute = match && match[2] ? parseInt(match[2], 10) : 0;

  const year = 2026;
  const month = "09";
  const day = "12";

  // Converter para UTC (Brasília UTC-3 -> UTC = hour + 3)
  const startHourUtc = hour + 3;
  const endHourUtc = startHourUtc + 1;

  const startUtc = `${year}${month}${day}T${String(startHourUtc).padStart(2, "0")}${String(minute).padStart(2, "0")}00Z`;
  const endUtc = `${year}${month}${day}T${String(endHourUtc).padStart(2, "0")}${String(minute).padStart(2, "0")}00Z`;

  return { startUtc, endUtc };
}

function getGoogleCalendarUrl(horario: string, guestName: string) {
  const { startUtc, endUtc } = getEventDates(horario);
  const title = encodeURIComponent(EVENT_DETAILS.title);
  const details = encodeURIComponent(
    `Olá, ${guestName}! Sua visita exclusiva ao Espaço Floresça está confirmada para as ${horario}.\n\n${EVENT_DETAILS.description}\n\nLocal: ${EVENT_DETAILS.building} · ${EVENT_DETAILS.room}\nEndereço: ${EVENT_DETAILS.fullAddress}`
  );
  const location = encodeURIComponent(
    `${EVENT_DETAILS.building} · ${EVENT_DETAILS.room} - ${EVENT_DETAILS.fullAddress}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtc}/${endUtc}&details=${details}&location=${location}`;
}

function downloadIcs(horario: string, guestName: string) {
  const { startUtc, endUtc } = getEventDates(horario);
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Espaco Floresca//Inauguracao//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `SUMMARY:${EVENT_DETAILS.title}`,
    `DESCRIPTION:Olá ${guestName}! Sua visita ao Espaço Floresça está confirmada para as ${horario}. ${EVENT_DETAILS.building} · ${EVENT_DETAILS.room}. ${EVENT_DETAILS.fullAddress}`,
    `LOCATION:${EVENT_DETAILS.building} · ${EVENT_DETAILS.room} - ${EVENT_DETAILS.fullAddress}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "visita-espaco-floresca.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  async function handleCopyAddress() {
    try {
      await navigator.clipboard.writeText(EVENT_DETAILS.fullAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2500);
    } catch (err) {
      console.error("Erro ao copiar endereço:", err);
    }
  }

  function handleNewBooking() {
    setConfirmado(null);
    setShowConfetti(false);
    setNome("");
    setWhatsapp("");
    setEmail("");
    setDataNascimento("");
    setHorario(null);
    setErro(null);
    setShowMap(false);
  }

  useEffect(() => {
    const unsubscribe = subscribeToEventSlots(
      EVENT_SLUG,
      (lista) => {
        setSlots(lista);
        setSlotsError(false);
      },
      (err) => {
        console.error("Erro ao assinar slots:", err);
        setSlotsError(true);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!confirmado) return;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [confirmado]);

  useEffect(() => {
    if (!showConfetti) return;

    const timeout = window.setTimeout(() => setShowConfetti(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [showConfetti]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const nomeLimpo = nome.trim();
    const whatsappLimpo = whatsapp.trim();
    const emailLimpo = email.trim();
    const dataNascimentoLimpa = dataNascimento.trim();

    if (!nomeLimpo) {
      setErro("Por favor, informe seu nome completo.");
      return;
    }
    if (!whatsappLimpo || whatsappLimpo.replace(/\D/g, "").length < 10) {
      setErro("Por favor, informe um WhatsApp válido com DDD.");
      return;
    }
    if (!emailLimpo || !emailLimpo.includes("@") || !emailLimpo.includes(".")) {
      setErro("Por favor, informe um e-mail válido.");
      return;
    }
    if (!dataNascimentoLimpa || dataNascimentoLimpa.length < 10) {
      setErro("Por favor, informe sua data de nascimento (DD/MM/AAAA).");
      return;
    }
    if (!horario) {
      setErro("Por favor, escolha um horário para a sua visita.");
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
      setSubmitting(false);
      return;
    }

    setConfirmado({ nome: nomeLimpo, horario });
    setShowConfetti(true);
    setSubmitting(false);
  }

  const displaySlots = slots && slots.length > 0 ? slots : DEFAULT_SLOTS;

  return (
    <div className={styles.page}>
      {showConfetti && (
        <div className={styles.confetti} aria-hidden="true">
          {CONFETTI_PIECES.map((piece) => (
            <span
              key={piece}
              className={styles.confettiPiece}
              style={
                {
                  "--confetti-left": `${(piece * 37) % 101}%`,
                  "--confetti-delay": `${(piece % 9) * 75}ms`,
                  "--confetti-duration": `${2.6 + (piece % 5) * 0.18}s`,
                  "--confetti-color": CONFETTI_COLORS[piece % CONFETTI_COLORS.length],
                  "--confetti-drift": `${((piece * 29) % 141) - 70}px`,
                  "--confetti-rotation": `${360 + (piece % 4) * 180}deg`,
                  "--confetti-size": `${6 + (piece % 4)}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
      <div className={styles.card}>
        {!confirmado ? (
          <>
            <div className={styles.formIntro}>
              <div className={styles.headerSection}>
              <Image
                className={`${styles.logo} ${styles.fadeStagger1}`}
                src="/brand/logo-floresca.png"
                alt="Floresça - Saúde Integral Feminina"
                width={88}
                height={88}
                priority
              />
              <div className={`${styles.tagline} ${styles.fadeStagger2}`}>
                Espaço Floresça · Inauguração
              </div>
              <h1 className={styles.fadeStagger3}>
                Você é nossa <em>convidada especial</em>
              </h1>
              <p className={`${styles.subtitle} ${styles.fadeStagger4}`}>
                Um espaço acolhedor e integrativo, criado para cuidar da sua saúde,
                beleza e bem-estar em todas as fases da vida.
              </p>
              <div className={`${styles.metaPillsRow} ${styles.fadeStagger5}`}>
                <div className={styles.datePill}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>Sábado, 12 de Setembro</span>
                </div>

                <div className={styles.locationPill}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span><strong>Golden Office</strong> · Sala 1108</span>
                </div>
              </div>

              <div className={`${styles.highlightsGrid} ${styles.fadeStagger6}`}>
                <div className={styles.highlightItem}>
                  <div className={styles.highlightIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22C12 22 4 17 4 10C4 5.58 7.58 2 12 2C16.42 2 20 5.58 20 10C20 17 12 22 12 22Z" />
                      <path d="M12 22V8" />
                      <path d="M12 13C9.5 11.5 7.5 12 7.5 12" />
                      <path d="M12 17C14.5 15.5 16.5 16 16.5 16" />
                    </svg>
                  </div>
                  <div className={styles.highlightText}>
                    <strong>Visita Exclusiva</strong>
                    <span>Novas instalações & acolhimento</span>
                  </div>
                </div>

                <div className={styles.highlightItem}>
                  <div className={styles.highlightIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <div className={styles.highlightText}>
                    <strong>Cuidado Integral</strong>
                    <span>Apresentação da metodologia</span>
                  </div>
                </div>

                <div className={styles.highlightItem}>
                  <div className={styles.highlightIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 2v3M10 2v3M14 2v3" />
                    </svg>
                  </div>
                  <div className={styles.highlightText}>
                    <strong>Recepção Especial</strong>
                    <span>Degustação & bate-papo</span>
                  </div>
                </div>

                <div className={styles.highlightItem}>
                  <div className={styles.highlightIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                  </div>
                  <div className={styles.highlightText}>
                    <strong>Vagas Limitadas</strong>
                    <span>Experiência intimista por horário</span>
                  </div>
                </div>
              </div>
              <div className={`${styles.formDivider} ${styles.fadeStagger7}`}>
                Reserve seu Horário
              </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className={styles.fadeStagger7}>
              <label htmlFor="nome">
                Nome completo <span className={styles.requiredAsterisk}>*</span>
              </label>
              <input
                type="text"
                id="nome"
                required
                placeholder="Como prefere ser chamada?"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />

              <label htmlFor="whatsapp">
                WhatsApp <span className={styles.requiredAsterisk}>*</span>
              </label>
              <input
                type="tel"
                id="whatsapp"
                required
                placeholder="(00) 00000-0000"
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
              />

              <label htmlFor="email">
                E-mail <span className={styles.requiredAsterisk}>*</span>
              </label>
              <input
                type="email"
                id="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label htmlFor="dataNascimento">
                Data de nascimento <span className={styles.requiredAsterisk}>*</span>
              </label>
              <input
                type="text"
                id="dataNascimento"
                required
                placeholder="DD/MM/AAAA"
                maxLength={10}
                value={dataNascimento}
                onChange={(e) => setDataNascimento(formatDate(e.target.value))}
              />

              <div className={styles.slotsHeader}>
                <label>
                  Escolha o melhor horário <span className={styles.requiredAsterisk}>*</span>
                </label>
                <span className={styles.slotsHelp}>Vagas limitadas</span>
              </div>

              {slotsError ? (
                <div className={styles.loadingNote}>
                  Não foi possível carregar os horários — tente recarregar a página.
                </div>
              ) : slots === null ? (
                <div className={styles.loadingNote}>Carregando horários disponíveis...</div>
              ) : null}

              <div className={styles.slots}>
                {displaySlots.map((s) => {
                  const capacity = s.capacity !== undefined ? s.capacity : 20;
                  const taken = s.taken ?? 0;
                  const remaining = capacity - taken;
                  const cheio = slots !== null && remaining <= 0;
                  const progress =
                    capacity > 0 ? Math.min(100, Math.max(0, (taken / capacity) * 100)) : 100;

                  return (
                    <div
                      key={s.horario}
                      className={`${styles.slot} ${cheio ? styles.full : styles.available}`}
                    >
                      <input
                        type="radio"
                        name="horario"
                        id={`h-${s.horario}`}
                        value={s.horario}
                        checked={horario === s.horario}
                        disabled={cheio}
                        onChange={() => setHorario(s.horario)}
                      />
                      <label htmlFor={`h-${s.horario}`}>
                        <span>{s.horario}</span>
                        <small className={styles.slotStatus}>
                          {cheio ? "Esgotado" : "Disponível"}
                        </small>
                        <span
                          className={styles.slotProgress}
                          role="progressbar"
                          aria-label={`Ocupação do horário ${s.horario}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={progress}
                        >
                          <span
                            className={styles.slotProgressBar}
                            style={{ width: `${progress}%` }}
                          />
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>

              <button type="submit" disabled={submitting}>
                {submitting ? "Confirmando sua vaga..." : "Confirmar Minha Presença"}
              </button>

              {erro && <div className={`${styles.msg} ${styles.msgError}`}>{erro}</div>}
            </form>
          </>
        ) : (
          <div className={styles.successView}>
            <div className={styles.successIcon}>✓</div>
            <h2>Presença Confirmada!</h2>
            <div className={styles.successCard}>
              <div className={styles.successGuest}>{confirmado.nome}</div>
              <div className={styles.successTimeBadge}>
                Horário reservado: {confirmado.horario}
              </div>
              <p>
                Sua visita exclusiva no Espaço Floresça está confirmada para{" "}
                <strong>{EVENT_DETAILS.dateString}</strong>.
              </p>

              {/* Endereço com botão de copiar */}
              <div className={styles.confirmedAddressBox}>
                <div className={styles.confirmedAddressInfo}>
                  <div className={styles.buildingTag}>
                    <span>📍</span>
                    <strong>{EVENT_DETAILS.building} · {EVENT_DETAILS.room}</strong>
                  </div>
                  <div className={styles.fullStreetText}>
                    {EVENT_DETAILS.street} — {EVENT_DETAILS.neighborhood}, {EVENT_DETAILS.city}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className={`${styles.copyButton} ${copiedAddress ? styles.copyButtonActive : ""}`}
                  title="Copiar endereço completo"
                >
                  {copiedAddress ? (
                    <>
                      <span>✓</span>
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <p style={{ marginBottom: "20px" }}>
              Estamos preparando cada detalhe com muito carinho para receber você. Até breve! 🌷
            </p>

            {/* Opções de Adicionar à Agenda */}
            <div className={styles.actionSection}>
              <div className={styles.actionTitle}>
                <span>📅</span> Salvar na sua agenda
              </div>
              <div className={styles.calendarButtons}>
                <a
                  href={getGoogleCalendarUrl(confirmado.horario, confirmado.nome)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.calendarButton} ${styles.googleButton}`}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                  </svg>
                  Google Agenda
                </a>
                <button
                  type="button"
                  onClick={() => downloadIcs(confirmado.horario, confirmado.nome)}
                  className={`${styles.calendarButton} ${styles.appleButton}`}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.93.04-2.02.63-2.66 1.38-.57.65-1.06 1.71-.99 2.76 1.05.08 2.06-.54 2.64-1.27z" />
                  </svg>
                  Apple / Celular
                </button>
              </div>
            </div>

            {/* Mini Mapa Expansível */}
            <div className={styles.mapSection}>
              <button
                type="button"
                className={styles.mapToggleButton}
                onClick={() => setShowMap(!showMap)}
                aria-expanded={showMap}
              >
                <div className={styles.mapToggleLeft}>
                  <span>📍</span>
                  <span className={styles.mapToggleText}>Ver localização no mapa</span>
                </div>
                <span className={`${styles.chevron} ${showMap ? styles.chevronUp : ""}`}>
                  ▾
                </span>
              </button>

              {showMap && (
                <div className={styles.mapContent}>
                  <div className={styles.addressBox}>
                    <div className={styles.addressBoxHeader}>
                      <div>
                        <strong>{EVENT_DETAILS.building} · {EVENT_DETAILS.room}</strong>
                        <p>{EVENT_DETAILS.street} — {EVENT_DETAILS.neighborhood}</p>
                        <p style={{ fontSize: "11.5px", color: "#8c786e" }}>{EVENT_DETAILS.city} · CEP {EVENT_DETAILS.cep}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyAddress}
                        className={`${styles.copyButtonMini} ${copiedAddress ? styles.copyButtonActive : ""}`}
                        title="Copiar endereço completo"
                      >
                        {copiedAddress ? "Copiado! ✓" : "Copiar"}
                      </button>
                    </div>
                  </div>

                  <div className={styles.mapFrameWrapper}>
                    <iframe
                      title="Localização do Espaço Floresça no Golden Office"
                      src={EVENT_DETAILS.mapsEmbedSrc}
                      width="100%"
                      height="190"
                      style={{ border: 0, borderRadius: "12px" }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <div className={styles.mapActionLinks}>
                    <a
                      href={EVENT_DETAILS.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.mapLink}
                    >
                      Abrir no Google Maps ↗
                    </a>
                    <a
                      href={EVENT_DETAILS.wazeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.mapLink}
                    >
                      Abrir no Waze ↗
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Ação para inscrever outra pessoa */}
            <div className={styles.newBookingSection}>
              <button
                type="button"
                onClick={handleNewBooking}
                className={styles.newBookingButton}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <span>Inscrever outra convidada</span>
              </button>
              <p className={styles.newBookingHelp}>
                Deseja reservar a vaga de uma amiga ou acompanhante? Toque acima para cadastrá-la.
              </p>
            </div>
          </div>
        )}

        <div className={styles.disclaimer}>
          Seus dados estão protegidos e serão utilizados apenas para organização e recepção no evento.
        </div>

        <div style={{ textAlign: "center", marginTop: "18px" }}>
          <Link
            href="/login"
            style={{
              fontSize: "11px",
              color: "#b7aaa1",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>🔒</span>
            <span>Acesso da equipe</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

