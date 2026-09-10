"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import {
  Slot,
  subscribeToEventSlots,
  submitRsvp,
} from "@/lib/firestore-service";
import {
  Calendar,
  Sparkles,
  Heart,
  Coffee,
  CheckCircle2,
  Users,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Check,
  X as XIcon,
  Lock,
} from "lucide-react";

const EVENT_SLUG = "inauguracao";
const DEFAULT_SLOTS: Slot[] = [
  { horario: "15h30", capacity: 20, taken: 0, ordem: 1 },
  { horario: "16h30", capacity: 20, taken: 0, ordem: 2 },
  { horario: "17h30", capacity: 20, taken: 0, ordem: 3 },
];

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
  const [confirmado, setConfirmado] = useState<{
    nome: string;
    horario: string;
    whatsapp: string;
  } | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

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

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const nomeLimpo = nome.trim();
    const whatsappLimpo = whatsapp.trim();
    const emailLimpo = email.trim();
    const dataNascimentoLimpa = dataNascimento.trim();

    if (!nomeLimpo || !whatsappLimpo) {
      setErro("Por favor, preencha seu nome e WhatsApp.");
      return;
    }
    if (!horario) {
      setErro("Por favor, selecione o horário de sua preferência.");
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
      setErro(
        res.error || "Não foi possível confirmar. Tente novamente em instantes."
      );
      setSubmitting(false);
      return;
    }

    setConfirmado({
      nome: nomeLimpo,
      horario,
      whatsapp: whatsappLimpo,
    });
    setSubmitting(false);
  }

  const displaySlots = slots && slots.length > 0 ? slots : DEFAULT_SLOTS;

  return (
    <div className={styles.pageContainer}>
      {/* Top Header Bar */}
      <header className={styles.headerNav}>
        <div className={styles.headerInner}>
          <div className={styles.brandLogoWrap}>
            <Image
              src="/brand/logo-floresca.png"
              alt="Floresça - Saúde Integral Feminina"
              width={46}
              height={46}
              className={styles.brandLogoImg}
              priority
            />
            <div className={styles.brandTitles}>
              <h1>Espaço Floresça</h1>
              <span>Saúde Integral Feminina</span>
            </div>
          </div>

          <button onClick={scrollToForm} className={styles.navCtaBtn}>
            <span>Confirmar Visita</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroLeft}>
            <div className={styles.pillBadge}>
              <span className={styles.pillBadgeDot} />
              <span>Inauguração & Visitação Exclusiva</span>
            </div>

            <h1 className={styles.heroTitle}>
              O cuidado integral feminino{" "}
              <span className={styles.heroTitleHighlight}>
                que você merece vivenciar
              </span>
            </h1>

            <p className={styles.heroDescription}>
              Convidamos você para a inauguração e visitação exclusiva do novo
              Espaço Floresça. Um ambiente acolhedor, pensado em cada detalhe para
              cuidar da sua saúde física, emocional e hormonal com escuta
              atenta, ciência e acolhimento.
            </p>

            {/* Highlights Grid */}
            <div className={styles.eventHighlightsGrid}>
              <div className={styles.highlightItem}>
                <div className={styles.highlightIcon}>
                  <Calendar size={18} />
                </div>
                <div className={styles.highlightText}>
                  <strong>Sábado, 12 de Setembro</strong>
                  <span>Sessões exclusivas</span>
                </div>
              </div>

              <div className={styles.highlightItem}>
                <div className={styles.highlightIcon}>
                  <Users size={18} />
                </div>
                <div className={styles.highlightText}>
                  <strong>Turmas Reduzidas</strong>
                  <span>Acolhimento intimista</span>
                </div>
              </div>

              <div className={styles.highlightItem}>
                <div className={styles.highlightIcon}>
                  <Coffee size={18} />
                </div>
                <div className={styles.highlightText}>
                  <strong>Welcome Coffee</strong>
                  <span>Recepção com delícias</span>
                </div>
              </div>

              <div className={styles.highlightItem}>
                <div className={styles.highlightIcon}>
                  <Sparkles size={18} />
                </div>
                <div className={styles.highlightText}>
                  <strong>Mimos & Surpresas</strong>
                  <span>Para convidadas</span>
                </div>
              </div>
            </div>

            {/* Inspiring Quote Box */}
            <div className={styles.quoteBox}>
              <p>
                “A mulher não precisa dar conta de tudo sozinha. No Espaço
                Floresça, você encontra acolhimento, cuidado e respeito ao seu
                tempo.”
              </p>
              <span>— Método Floresça</span>
            </div>
          </div>

          {/* Form / RSVP Card Right */}
          <div ref={formRef} className={styles.formCard}>
            <div className={styles.formCardHeader}>
              <Image
                src="/brand/logo-floresca.png"
                alt="Floresça"
                width={72}
                height={72}
                className={styles.formCardLogo}
              />
              <h2>Garanta a sua Presença</h2>
              <p>
                Escolha o horário de sua preferência abaixo para viver essa
                experiência especial.
              </p>
            </div>

            {!confirmado ? (
              <form onSubmit={handleSubmit} noValidate>
                <div className={styles.formGroup}>
                  <label htmlFor="nome">Como podemos te chamar? *</label>
                  <input
                    type="text"
                    id="nome"
                    required
                    placeholder="Seu nome completo"
                    className={styles.inputField}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="whatsapp">Seu WhatsApp *</label>
                  <input
                    type="tel"
                    id="whatsapp"
                    required
                    placeholder="(00) 00000-0000"
                    className={styles.inputField}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">E-mail (opcional)</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="seuemail@exemplo.com"
                    className={styles.inputField}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="dataNascimento">
                    Data de nascimento (opcional)
                  </label>
                  <input
                    type="text"
                    id="dataNascimento"
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    className={styles.inputField}
                    value={dataNascimento}
                    onChange={(e) =>
                      setDataNascimento(formatDate(e.target.value))
                    }
                  />
                </div>

                {/* Slots Selector */}
                <div className={styles.formGroup}>
                  <div className={styles.slotsSectionTitle}>
                    <label>Escolha o seu horário de visita *</label>
                    <span className={styles.slotsBadgeNote}>
                      Turmas exclusivas
                    </span>
                  </div>

                  <div className={styles.slotsGrid}>
                    {displaySlots.map((s) => {
                      const capacity = s.capacity !== undefined ? s.capacity : 20;
                      const taken = s.taken ?? 0;
                      const remaining = Math.max(0, capacity - taken);
                      const cheio =
                        slots !== null && !slotsError && remaining <= 0;

                      let statusText = `${remaining} vagas`;
                      if (cheio) statusText = "Esgotado";
                      else if (remaining <= 5) statusText = "Últimas vagas";

                      return (
                        <div
                          key={s.horario}
                          className={`${styles.slotOption} ${
                            cheio ? styles.isFull : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="horario"
                            id={`slot-${s.horario}`}
                            value={s.horario}
                            checked={horario === s.horario}
                            disabled={cheio}
                            onChange={() => setHorario(s.horario)}
                          />
                          <label
                            htmlFor={`slot-${s.horario}`}
                            className={styles.slotLabel}
                          >
                            <span className={styles.slotHorario}>
                              {s.horario}
                            </span>
                            <span className={styles.slotStatus}>
                              {statusText}
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {erro && <div className={styles.errorMessage}>{erro}</div>}

                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.submitBtn}
                >
                  {submitting ? (
                    "Confirmando vaga..."
                  ) : (
                    <>
                      <span>Confirmar Minha Presença</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p className={styles.privacyDisclaimer}>
                  <ShieldCheck
                    size={13}
                    style={{
                      display: "inline",
                      marginRight: "4px",
                      verticalAlign: "middle",
                    }}
                  />
                  Suas informações são confidenciais e protegidas. Uso exclusivo
                  pela equipe Floresça para organização do evento.
                </p>
              </form>
            ) : (
              <div className={styles.successView}>
                <div className={styles.successIcon}>
                  <CheckCircle2 size={36} />
                </div>
                <h2>Presença Confirmada! 🌷</h2>
                <p>
                  Que alegria ter você conosco, <strong>{confirmado.nome}</strong>!
                  Sua vaga foi reservada com carinho.
                </p>

                <div className={styles.successSummaryBox}>
                  <div className={styles.summaryRow}>
                    <span>Data:</span>
                    <span>Sábado, 12 de Setembro</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Horário Escolhido:</span>
                    <span>{confirmado.horario}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Local:</span>
                    <span>Espaço Floresça</span>
                  </div>
                </div>

                <div className={styles.successTip}>
                  💡 Dica: Recomendamos chegar cerca de 10 minutos antes do seu
                  horário para aproveitar a recepção com tranquilidade!
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section: O que esperar da sua visita */}
        <section className={styles.infoSection}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionCategory}>
              Experiência de Inauguração
            </span>
            <h2>O que você vai vivenciar na sua visita</h2>
            <p>
              Preparamos uma programação suave e acolhedora para que você conheça
              cada detalhe do nosso método integrativo.
            </p>
          </div>

          <div className={styles.experienceGrid}>
            <div className={styles.experienceCard}>
              <div className={styles.experienceStep}>1</div>
              <h3>Recepção & Welcome Coffee</h3>
              <p>
                Desfrute de chás especiais, café aromático e comidinhas saudáveis
                preparadas especialmente para receber você com carinho.
              </p>
            </div>

            <div className={styles.experienceCard}>
              <div className={styles.experienceStep}>2</div>
              <h3>Tour Guiado pelo Espaço</h3>
              <p>
                Conheça nossas salas de atendimento, ambiente sensorial e toda a
                estrutura pensada para garantir privacidade e conforto.
              </p>
            </div>

            <div className={styles.experienceCard}>
              <div className={styles.experienceStep}>3</div>
              <h3>Apresentação do Método</h3>
              <p>
                Entenda como integramos saúde física, emocional, nutricional e
                hormonal em um plano de cuidado individualizado para você.
              </p>
            </div>

            <div className={styles.experienceCard}>
              <div className={styles.experienceStep}>4</div>
              <h3>Conversa com Especialistas & Mimos</h3>
              <p>
                Tire suas dúvidas diretamente com nossa equipe e receba um mimo
                exclusivo de boas-vindas do Espaço Floresça.
              </p>
            </div>
          </div>
        </section>

        {/* Section: A Diferença no Cuidado / Método Floresça */}
        <section className={styles.infoSection}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionCategory}>Nossa Filosofia</span>
            <h2>A diferença do Método Floresça</h2>
            <p>
              Entenda por que o nosso modelo de acolhimento transforma a saúde da
              mulher moderna.
            </p>
          </div>

          <div className={styles.compareContainer}>
            <div className={styles.compareColOld}>
              <h3>No modelo convencional</h3>
              <ul className={styles.compareList}>
                <li className={styles.compareItem}>
                  <XIcon size={16} color="#b0574e" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>Consultas rápidas e pouco tempo para ser ouvida com calma.</span>
                </li>
                <li className={styles.compareItem}>
                  <XIcon size={16} color="#b0574e" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>Foco apenas nos sintomas isolados, sem investigar a causa raiz.</span>
                </li>
                <li className={styles.compareItem}>
                  <XIcon size={16} color="#b0574e" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>Profissionais que não conversam entre si, gerando orientações desencontradas.</span>
                </li>
                <li className={styles.compareItem}>
                  <XIcon size={16} color="#b0574e" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>Ambientes impessoais e frios que aumentam a ansiedade.</span>
                </li>
              </ul>
            </div>

            <div className={styles.compareColNew}>
              <h3>No Método Floresça</h3>
              <ul className={styles.compareList}>
                <li className={styles.compareItem}>
                  <Check size={16} color="#3b662e" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>Escuta atenta e sem pressa para entender sua história por inteiro.</span>
                </li>
                <li className={styles.compareItem}>
                  <Check size={16} color="#3b662e" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>Visão integrativa: corpo, mente, hormônios, nutrição e estilo de vida.</span>
                </li>
                <li className={styles.compareItem}>
                  <Check size={16} color="#3b662e" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>Equipe multidisciplinar alinhada no mesmo plano de saúde feminina.</span>
                </li>
                <li className={styles.compareItem}>
                  <Check size={16} color="#3b662e" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>Ambiente acolhedor, sensorial e planejado para o seu relaxamento.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section: Informações Importantes & Local */}
        <section className={styles.infoSection}>
          <div className={styles.eventDetailsCard}>
            <div className={styles.eventDetailItem}>
              <div className={styles.detailIcon}>
                <Calendar size={22} />
              </div>
              <div className={styles.detailContent}>
                <h4>Quando acontece</h4>
                <p>
                  Sábado, 12 de Setembro. Horários às 15h30, 16h30 e 17h30.
                  Escolha o seu horário ideal no formulário.
                </p>
              </div>
            </div>

            <div className={styles.eventDetailItem}>
              <div className={styles.detailIcon}>
                <MapPin size={22} />
              </div>
              <div className={styles.detailContent}>
                <h4>Nosso Espaço</h4>
                <p>
                  Ambiente exclusivo, privativo e com estacionamento facilitado
                  para seu total conforto.
                </p>
              </div>
            </div>

            <div className={styles.eventDetailItem}>
              <div className={styles.detailIcon}>
                <Heart size={22} />
              </div>
              <div className={styles.detailContent}>
                <h4>Experiência Gratuita</h4>
                <p>
                  Acesso livre para você e acompanhante mediante confirmação
                  prévia das vagas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className={styles.bottomCtaBanner}>
          <h2>Venha fazer parte deste momento inesquecível</h2>
          <p>
            As vagas para cada horário de visitação são estritamente limitadas
            para preservar a privacidade e o conforto de todas as convidadas.
          </p>
          <button onClick={scrollToForm} className={styles.bottomCtaBtn}>
            <span>Garantir meu horário de visitação</span>
            <ArrowRight size={16} />
          </button>
        </section>

        {/* Footer */}
        <footer className={styles.footerSection}>
          <Image
            src="/brand/logo-floresca.png"
            alt="Floresça"
            width={48}
            height={48}
            className={styles.footerLogo}
          />
          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} Espaço Floresça · Saúde Integral Feminina. Todos os direitos reservados.
          </p>

          <div>
            <Link href="/login" className={styles.teamLink}>
              <Lock size={12} />
              <span>Acesso restrito da equipe</span>
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
