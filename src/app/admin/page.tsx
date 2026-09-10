"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Rsvp,
  Slot,
  getEventSlots,
  subscribeToEventSlots,
  subscribeToEventRsvps,
  updateSlotCapacity,
  deleteRsvp,
  normalizePhone,
} from "@/lib/firestore-service";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  LogOut,
  ExternalLink,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  AlertCircle,
  Loader2,
  X,
  Copy,
  Check,
  Settings2,
  SlidersHorizontal,
  Plus,
  Minus,
} from "lucide-react";

const EVENT_SLUG = "inauguracao";
const DEFAULT_HORARIOS = ["15h30", "16h30", "17h30"];
const DEFAULT_CAPACITY = 20;

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHorario, setSelectedHorario] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "name">("recent");

  // Actions modal state
  const [deleteTarget, setDeleteTarget] = useState<Rsvp | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Slot capacity management modal state
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [editCapacity, setEditCapacity] = useState<number>(20);
  const [savingCapacity, setSavingCapacity] = useState(false);
  const [showAllCapacitiesModal, setShowAllCapacitiesModal] = useState(false);
  const [batchCapacities, setBatchCapacities] = useState<Record<string, number>>({});

  // Auth Guard
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Setup real-time listeners for RSVPs and Slots
  useEffect(() => {
    if (!user) return;

    setDataLoading(true);

    const unsubSlots = subscribeToEventSlots(
      EVENT_SLUG,
      (slotsList) => {
        setSlots(slotsList);
      },
      (err) => {
        console.error("Erro ao escutar slots:", err);
      }
    );

    const unsubRsvps = subscribeToEventRsvps(
      EVENT_SLUG,
      (list) => {
        setRsvps(list);
        setDataLoading(false);
      },
      (err) => {
        console.error("Erro na escuta em tempo real de RSVPs:", err);
        setErrorMsg("Não foi possível carregar as respostas em tempo real.");
        setDataLoading(false);
      }
    );

    return () => {
      unsubSlots();
      unsubRsvps();
    };
  }, [user]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    setErrorMsg(null);
    try {
      const s = await getEventSlots(EVENT_SLUG);
      setSlots(s);
      showToast("Dados atualizados com sucesso!");
    } catch {
      setErrorMsg("Erro ao atualizar dados.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteRsvp(EVENT_SLUG, deleteTarget.id, deleteTarget.horario);
      if (res.success) {
        showToast(`Confirmação de ${deleteTarget.nome} foi removida.`);
        setDeleteTarget(null);
      } else {
        showToast(res.error || "Erro ao excluir confirmação.", "error");
      }
    } catch (err) {
      console.error("Erro ao deletar:", err);
      showToast("Falha ao comunicar com o servidor.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenEditSlot = (slot: Slot) => {
    setEditingSlot(slot);
    setEditCapacity(slot.capacity ?? DEFAULT_CAPACITY);
  };

  const handleSaveSlotCapacity = async () => {
    if (!editingSlot) return;
    setSavingCapacity(true);
    try {
      const res = await updateSlotCapacity(
        EVENT_SLUG,
        editingSlot.id || editingSlot.horario,
        editCapacity
      );
      if (res.success) {
        showToast(`Vagas do horário ${editingSlot.horario} alteradas para ${editCapacity}!`);
        setEditingSlot(null);
      } else {
        showToast(res.error || "Erro ao salvar capacidade.", "error");
      }
    } catch (err) {
      console.error("Erro ao salvar capacidade:", err);
      showToast("Erro ao conectar com o servidor.", "error");
    } finally {
      setSavingCapacity(false);
    }
  };

  const handleOpenBatchModal = () => {
    const initial: Record<string, number> = {};
    const list = slots.length > 0 ? slots : DEFAULT_HORARIOS.map((h, i) => ({ horario: h, capacity: DEFAULT_CAPACITY, taken: 0, ordem: i + 1 }));
    list.forEach((s) => {
      initial[s.horario] = s.capacity ?? DEFAULT_CAPACITY;
    });
    setBatchCapacities(initial);
    setShowAllCapacitiesModal(true);
  };

  const handleSaveBatchCapacities = async () => {
    setSavingCapacity(true);
    try {
      for (const [horario, cap] of Object.entries(batchCapacities)) {
        await updateSlotCapacity(EVENT_SLUG, horario, cap);
      }
      showToast("Todas as capacidades foram atualizadas com sucesso!");
      setShowAllCapacitiesModal(false);
    } catch (err) {
      console.error("Erro ao salvar capacidades em lote:", err);
      showToast("Erro ao salvar algumas capacidades.", "error");
    } finally {
      setSavingCapacity(false);
    }
  };

  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (rsvps.length === 0) {
      showToast("Nenhum dado para exportar.", "error");
      return;
    }

    const headers = ["Nome", "WhatsApp", "E-mail", "Data de Nascimento", "Horario", "Data de Registro"];
    const rows = filteredRsvps.map((r) => [
      `"${r.nome.replace(/"/g, '""')}"`,
      `"${r.whatsapp}"`,
      `"${(r.email || "").replace(/"/g, '""')}"`,
      `"${r.data_nascimento || ""}"`,
      `"${r.horario}"`,
      `"${r.created_at}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `confirmacoes_floresca_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Planilha CSV exportada com sucesso!");
  };

  // Filtered and sorted RSVPs
  const filteredRsvps = useMemo(() => {
    let list = [...rsvps];

    if (selectedHorario !== "todos") {
      list = list.filter((r) => r.horario === selectedHorario);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const termDigits = normalizePhone(searchTerm);
      list = list.filter((r) => {
        const matchesName = r.nome.toLowerCase().includes(term);
        const matchesEmail = (r.email || "").toLowerCase().includes(term);
        const matchesPhone = normalizePhone(r.whatsapp).includes(termDigits) || r.whatsapp.includes(term);
        return matchesName || matchesEmail || matchesPhone;
      });
    }

    list.sort((a, b) => {
      if (sortBy === "name") {
        return a.nome.localeCompare(b.nome);
      }
      if (sortBy === "oldest") {
        return a.created_at.localeCompare(b.created_at);
      }
      // default: recent (descending)
      return b.created_at.localeCompare(a.created_at);
    });

    return list;
  }, [rsvps, selectedHorario, searchTerm, sortBy]);

  // Dynamic slots list for display and calculations
  const dynamicSlots = useMemo(() => {
    if (slots && slots.length > 0) {
      return slots;
    }
    return DEFAULT_HORARIOS.map((h, i) => ({
      horario: h,
      capacity: DEFAULT_CAPACITY,
      taken: 0,
      ordem: i + 1,
    }));
  }, [slots]);

  // Statistics calculated dynamically from Firestore slots
  const stats = useMemo(() => {
    const totalConfirmados = rsvps.length;
    const totalCapacidade = dynamicSlots.reduce(
      (acc, s) => acc + (s.capacity !== undefined ? s.capacity : DEFAULT_CAPACITY),
      0
    );
    const ocupacaoGeral = totalCapacidade > 0
      ? Math.min(100, Math.round((totalConfirmados / totalCapacidade) * 100))
      : 0;

    const porHorario = dynamicSlots.map((s) => {
      const count = rsvps.filter((r) => r.horario === s.horario).length;
      const capacity = s.capacity !== undefined ? s.capacity : DEFAULT_CAPACITY;
      const vagasRestantes = Math.max(0, capacity - count);
      const pct = capacity > 0 ? Math.min(100, Math.round((count / capacity) * 100)) : 100;
      return {
        ...s,
        count,
        capacity,
        vagasRestantes,
        pct,
      };
    });

    return { totalConfirmados, totalCapacidade, ocupacaoGeral, porHorario };
  }, [rsvps, dynamicSlots]);

  if (loading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-[#fbf7f3] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 text-[#b07e76] animate-spin" />
          <p className="text-sm text-[#8a7e78] font-serif">Carregando painel de administração...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[#fcf9f6] text-[#453127] font-sans pb-16">
      {/* Toast notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 ${
            toastMsg.type === "success"
              ? "bg-[#eef5eb] border-[#b9d9af] text-[#3b662e]"
              : "bg-[#fef2f2] border-[#fecaca] text-[#b0574e]"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-[#74896a]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#b0574e]" />
          )}
          <span>{toastMsg.text}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="ml-2 text-[#8a7e78] hover:text-[#453127]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#eeddd4] px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/logo-floresca.png"
                alt="Floresça"
                width={38}
                height={38}
                className="w-9 h-auto"
              />
              <div>
                <h1 className="font-serif text-lg font-semibold text-[#b07e76] leading-tight">
                  Floresça · Painel de Gestão
                </h1>
                <p className="text-[11px] text-[#74896a] font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#74896a] animate-pulse"></span>
                  Inauguração Método Floresça
                </p>
              </div>
            </div>

            <div className="sm:hidden flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="p-2 text-[#b0574e] hover:bg-[#fef2f2] rounded-lg transition-colors"
                title="Sair do painel"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={handleOpenBatchModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#74896a] hover:text-[#5e7256] bg-[#eef2e9] hover:bg-[#e4ebd9] rounded-lg transition-colors border border-[#d3e3cc] font-medium cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Configurar Vagas</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8a7e78] hover:text-[#4a3f3a] bg-[#f8f2ed] hover:bg-[#f0e6de] rounded-lg transition-colors border border-[#ebdcd3]"
            >
              <span>Ver formulário público</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="h-4 w-px bg-[#e4d5cc]" />

            <div className="flex items-center gap-2 pl-1">
              <div className="w-7 h-7 rounded-full bg-[#b07e76]/15 text-[#b07e76] flex items-center justify-center font-serif text-xs font-bold uppercase">
                {user.email?.charAt(0) || "A"}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-[#4a3f3a] leading-tight max-w-[150px] truncate">
                  {user.email}
                </p>
                <p className="text-[10px] text-[#74896a]">Administrador</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#b0574e] hover:bg-[#fef2f2] rounded-lg transition-colors ml-1 border border-transparent hover:border-[#fecaca] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {/* Error message banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-[#fef2f2] border border-[#fecaca] text-[#b0574e] text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs underline hover:no-underline font-medium"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Section Header with Quick Actions */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#8a7e78]">
            Ocupação & Horários
          </h2>
          <button
            onClick={handleOpenBatchModal}
            className="sm:hidden inline-flex items-center gap-1 text-xs text-[#74896a] font-medium bg-[#eef2e9] px-2.5 py-1 rounded-lg border border-[#d3e3cc]"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Configurar Vagas</span>
          </button>
        </div>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {/* Total Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#ede1d8] shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-serif uppercase tracking-wider text-[#8a7e78]">
                  Total de Presenças
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#b07e76]/10 text-[#b07e76] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#453127]">
                  {stats.totalConfirmados}
                </span>
                <span className="text-xs text-[#8a7e78]">
                  de {stats.totalCapacidade} vagas configuradas
                </span>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-[#f3e9e3] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#b07e76] h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.ocupacaoGeral}%` }}
                />
              </div>
              <p className="text-[11px] text-[#8a7e78] mt-1 text-right">
                {stats.ocupacaoGeral}% ocupado
              </p>
            </div>
          </div>

          {/* Slots Cards */}
          {stats.porHorario.map((slot) => {
            const isFull = slot.vagasRestantes === 0;
            return (
              <div
                key={slot.horario}
                onClick={() =>
                  setSelectedHorario(selectedHorario === slot.horario ? "todos" : slot.horario)
                }
                className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all hover:shadow-md relative group flex flex-col justify-between ${
                  selectedHorario === slot.horario
                    ? "border-[#74896a] ring-2 ring-[#74896a]/20"
                    : "border-[#ede1d8] hover:border-[#c99a93]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-serif uppercase tracking-wider text-[#74896a] font-semibold">
                      Horário {slot.horario}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditSlot(slot);
                        }}
                        title="Ajustar quantidade de vagas deste horário"
                        className="p-1 rounded-lg text-[#8a7e78] hover:text-[#453127] hover:bg-[#f3e9e3] transition-colors"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-serif ${
                          isFull
                            ? "bg-[#fef2f2] text-[#b0574e]"
                            : "bg-[#eef2e9] text-[#74896a]"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-serif font-bold text-[#453127]">
                        {slot.count}
                      </span>
                      <span className="text-xs text-[#8a7e78]">
                        / {slot.capacity} vagas
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditSlot(slot);
                      }}
                      className="text-[11px] text-[#74896a] hover:underline font-medium"
                    >
                      Alterar vagas
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-[#f3e9e3] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? "bg-[#b0574e]" : "bg-[#74896a]"
                      }`}
                      style={{ width: `${slot.pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-[#8a7e78] mt-1">
                    <span className={isFull ? "text-[#b0574e] font-semibold" : "text-[#74896a]"}>
                      {isFull ? "Esgotado" : `${slot.vagasRestantes} livres`}
                    </span>
                    <span>{slot.pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Toolbar: Search, Filters, CSV Export */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ede1d8] shadow-2xs mb-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#b7aaa1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nome, WhatsApp ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e4d5cc] bg-[#fdfaf8] text-[#4a3f3a] text-sm focus:outline-none focus:border-[#c99a93] transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b7aaa1] hover:text-[#4a3f3a]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter by Horário & Sort */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedHorario}
                  onChange={(e) => setSelectedHorario(e.target.value)}
                  className="w-full sm:w-auto appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#e4d5cc] bg-[#fdfaf8] text-[#4a3f3a] text-xs font-medium focus:outline-none focus:border-[#c99a93] cursor-pointer"
                >
                  <option value="todos">Todos os Horários ({rsvps.length})</option>
                  {dynamicSlots.map((s) => {
                    const count = rsvps.filter((r) => r.horario === s.horario).length;
                    return (
                      <option key={s.horario} value={s.horario}>
                        {s.horario} ({count} / {s.capacity ?? DEFAULT_CAPACITY})
                      </option>
                    );
                  })}
                </select>
                <Filter className="w-3.5 h-3.5 text-[#b7aaa1] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "recent" | "oldest" | "name")}
                  className="w-full sm:w-auto appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#e4d5cc] bg-[#fdfaf8] text-[#4a3f3a] text-xs font-medium focus:outline-none focus:border-[#c99a93] cursor-pointer"
                >
                  <option value="recent">Mais recentes primeiro</option>
                  <option value="oldest">Mais antigos primeiro</option>
                  <option value="name">Ordem alfabética (Nome)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                title="Recarregar dados"
                className="p-2.5 rounded-xl border border-[#e4d5cc] bg-[#fdfaf8] hover:bg-[#f7f1ee] text-[#4a3f3a] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#74896a]" : ""}`} />
              </button>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#74896a] hover:bg-[#5e7256] text-white text-xs font-serif tracking-wide transition-all shadow-2xs hover:shadow cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Active filter pills */}
          {(selectedHorario !== "todos" || searchTerm) && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#f3e9e3] text-xs text-[#8a7e78]">
              <span>Filtros ativos:</span>
              {selectedHorario !== "todos" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#eef2e9] text-[#74896a] font-medium text-[11px]">
                  Horário: {selectedHorario}
                  <button onClick={() => setSelectedHorario("todos")}>
                    <X className="w-3 h-3 hover:text-black" />
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fbeae6] text-[#b07e76] font-medium text-[11px]">
                  Busca: &ldquo;{searchTerm}&rdquo;
                  <button onClick={() => setSearchTerm("")}>
                    <X className="w-3 h-3 hover:text-black" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedHorario("todos");
                  setSearchTerm("");
                }}
                className="text-[11px] text-[#b0574e] underline ml-2 cursor-pointer"
              >
                Limpar todos
              </button>
            </div>
          )}
        </section>

        {/* Responses Table */}
        <section className="bg-white rounded-2xl border border-[#ede1d8] shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#ede1d8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-base font-semibold text-[#453127]">
                Lista de Confirmações
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#f8f2ed] border border-[#eeddd4] text-[11px] font-medium text-[#8a7e78]">
                {filteredRsvps.length} {filteredRsvps.length === 1 ? "registro" : "registros"}
              </span>
            </div>

            <div className="text-xs text-[#8a7e78] flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#34A853]"></span>
              Sincronização em tempo real
            </div>
          </div>

          {dataLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-[#b07e76] animate-spin mx-auto mb-3" />
              <p className="text-sm text-[#8a7e78] font-serif">Carregando respostas do formulário...</p>
            </div>
          ) : filteredRsvps.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-[#fbf6f1] border border-[#f0e1d9] flex items-center justify-center mx-auto mb-3 text-[#b7aaa1]">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-base text-[#453127] mb-1">
                Nenhuma confirmação encontrada
              </h3>
              <p className="text-xs text-[#8a7e78] max-w-sm mx-auto">
                {searchTerm || selectedHorario !== "todos"
                  ? "Tente ajustar os filtros ou o termo de busca para encontrar registros."
                  : "Assim que os convidados preencherem o formulário, as confirmações aparecerão aqui automaticamente."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fcf9f6] text-[#8a7e78] text-[11px] uppercase tracking-wider font-semibold border-b border-[#ede1d8]">
                    <th className="py-3 px-5">Convidado</th>
                    <th className="py-3 px-4">WhatsApp</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Nascimento</th>
                    <th className="py-3 px-4">Horário</th>
                    <th className="py-3 px-4">Data do Envio</th>
                    <th className="py-3 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3e9e3] text-xs">
                  {filteredRsvps.map((rsvp) => {
                    const rawDigits = normalizePhone(rsvp.whatsapp);
                    const waLink = `https://wa.me/55${rawDigits}?text=${encodeURIComponent(
                      `Olá ${rsvp.nome}! Estamos felizes em confirmar sua presença no evento de inauguração do Método Floresça no horário das ${rsvp.horario}. Até sábado!`
                    )}`;

                    return (
                      <tr
                        key={rsvp.id}
                        className="hover:bg-[#fbf7f3] transition-colors group"
                      >
                        {/* Convidado */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#b07e76]/15 text-[#b07e76] flex items-center justify-center font-serif text-xs font-bold shrink-0">
                              {rsvp.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-[#453127] text-sm block">
                                {rsvp.nome}
                              </span>
                              <span className="text-[10px] text-[#8a7e78] font-mono">
                                ID: {rsvp.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* WhatsApp */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#25D366] hover:text-[#1ebe57] font-medium bg-[#e7f8ee] hover:bg-[#d8f4e2] px-2 py-1 rounded-lg transition-colors"
                              title="Abrir conversa no WhatsApp"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{rsvp.whatsapp}</span>
                            </a>
                            <button
                              onClick={() => handleCopyPhone(rsvp.whatsapp, rsvp.id)}
                              className="p-1 text-[#b7aaa1] hover:text-[#4a3f3a] rounded cursor-pointer"
                              title="Copiar número"
                            >
                              {copiedId === rsvp.id ? (
                                <Check className="w-3 h-3 text-[#74896a]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* E-mail */}
                        <td className="py-3.5 px-4">
                          {rsvp.email ? (
                            <div className="flex items-center gap-1 text-[#6b5a53] max-w-[180px] truncate">
                              <Mail className="w-3 h-3 text-[#b7aaa1] shrink-0" />
                              <span className="truncate" title={rsvp.email}>
                                {rsvp.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#c9bbb2] italic">Não informado</span>
                          )}
                        </td>

                        {/* Data de Nascimento */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {rsvp.data_nascimento ? (
                            <div className="flex items-center gap-1 text-[#6b5a53]">
                              <Calendar className="w-3 h-3 text-[#b7aaa1]" />
                              <span>{rsvp.data_nascimento}</span>
                            </div>
                          ) : (
                            <span className="text-[#c9bbb2] italic">Não informada</span>
                          )}
                        </td>

                        {/* Horário */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#eef2e9] text-[#74896a] font-serif font-bold text-xs">
                            <Clock className="w-3 h-3" />
                            {rsvp.horario}
                          </span>
                        </td>

                        {/* Data de Envio */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#8a7e78] text-[11px]">
                          {rsvp.created_at}
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setDeleteTarget(rsvp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[#b0574e] hover:bg-[#fef2f2] border border-transparent hover:border-[#fecaca] transition-colors cursor-pointer"
                            title="Cancelar/Excluir presença"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium">Excluir</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Single Slot Capacity Edit Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#f0e1d9] animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#eef2e9] text-[#74896a] flex items-center justify-center mb-4 mx-auto">
              <SlidersHorizontal className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-lg text-center text-[#453127] font-semibold mb-1">
              Definir Vagas · Horário {editingSlot.horario}
            </h3>

            <p className="text-xs text-[#8a7e78] text-center mb-5">
              Atualmente existem{" "}
              <strong className="text-[#453127]">
                {rsvps.filter((r) => r.horario === editingSlot.horario).length} confirmações
              </strong>{" "}
              para este horário.
            </p>

            <div className="bg-[#fcf9f6] p-4 rounded-2xl border border-[#ede1d8] mb-5">
              <label className="block text-xs font-serif text-[#8a7e78] uppercase tracking-wider mb-2 text-center">
                Capacidade Total de Vagas
              </label>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditCapacity((prev) => Math.max(0, prev - 1))}
                  className="w-10 h-10 rounded-xl bg-white border border-[#e4d5cc] text-[#4a3f3a] hover:bg-[#f7f1ee] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="number"
                  min="0"
                  max="500"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 text-center py-2 text-2xl font-serif font-bold text-[#453127] bg-white rounded-xl border border-[#e4d5cc] focus:outline-none focus:border-[#74896a]"
                />

                <button
                  type="button"
                  onClick={() => setEditCapacity((prev) => prev + 1)}
                  className="w-10 h-10 rounded-xl bg-white border border-[#e4d5cc] text-[#4a3f3a] hover:bg-[#f7f1ee] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick preset buttons */}
              <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-[#ede1d8]">
                {[10, 15, 20, 25, 30].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEditCapacity(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-serif transition-colors cursor-pointer ${
                      editCapacity === preset
                        ? "bg-[#74896a] text-white font-bold"
                        : "bg-white border border-[#e4d5cc] text-[#8a7e78] hover:bg-[#f3e9e3]"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {editCapacity < rsvps.filter((r) => r.horario === editingSlot.horario).length && (
                <div className="mt-3 p-2.5 rounded-xl bg-[#fef2f2] text-[#b0574e] text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Atenção: A nova capacidade é menor que as presenças já confirmadas (
                    {rsvps.filter((r) => r.horario === editingSlot.horario).length}).
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                disabled={savingCapacity}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#e4d5cc] text-[#4a3f3a] text-xs font-medium hover:bg-[#f7f1ee] transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveSlotCapacity}
                disabled={savingCapacity}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#74896a] hover:bg-[#5e7256] text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {savingCapacity ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  "Salvar Vagas"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Configure All Slots Modal */}
      {showAllCapacitiesModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-[#f0e1d9] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#eef2e9] text-[#74896a] flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-[#453127] font-semibold">
                    Configuração de Vagas
                  </h3>
                  <p className="text-xs text-[#8a7e78]">
                    Defina a capacidade máxima de cada horário do evento
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllCapacitiesModal(false)}
                className="text-[#8a7e78] hover:text-[#453127] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-1">
              {dynamicSlots.map((s) => {
                const count = rsvps.filter((r) => r.horario === s.horario).length;
                const currentVal = batchCapacities[s.horario] ?? (s.capacity ?? DEFAULT_CAPACITY);
                const isUnderCount = currentVal < count;

                return (
                  <div
                    key={s.horario}
                    className="p-4 rounded-2xl bg-[#fcf9f6] border border-[#ede1d8] flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-[#453127]">
                          {s.horario}
                        </span>
                        <span className="text-[11px] text-[#74896a] bg-[#eef2e9] px-2 py-0.5 rounded-full font-medium">
                          {count} confirmados
                        </span>
                      </div>
                      {isUnderCount && (
                        <p className="text-[10px] text-[#b0574e] mt-1">
                          Capacidade menor que os confirmados atuais
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setBatchCapacities((prev) => ({
                            ...prev,
                            [s.horario]: Math.max(0, (prev[s.horario] ?? currentVal) - 1),
                          }))
                        }
                        className="w-8 h-8 rounded-lg bg-white border border-[#e4d5cc] text-[#4a3f3a] hover:bg-[#f7f1ee] flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={currentVal}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setBatchCapacities((prev) => ({
                            ...prev,
                            [s.horario]: val,
                          }));
                        }}
                        className="w-16 text-center py-1.5 text-base font-serif font-bold text-[#453127] bg-white rounded-lg border border-[#e4d5cc] focus:outline-none focus:border-[#74896a]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setBatchCapacities((prev) => ({
                            ...prev,
                            [s.horario]: (prev[s.horario] ?? currentVal) + 1,
                          }))
                        }
                        className="w-8 h-8 rounded-lg bg-white border border-[#e4d5cc] text-[#4a3f3a] hover:bg-[#f7f1ee] flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAllCapacitiesModal(false)}
                disabled={savingCapacity}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#e4d5cc] text-[#4a3f3a] text-xs font-medium hover:bg-[#f7f1ee] transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveBatchCapacities}
                disabled={savingCapacity}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#74896a] hover:bg-[#5e7256] text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {savingCapacity ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  "Salvar Todas as Vagas"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#f0e1d9] animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#fef2f2] text-[#b0574e] flex items-center justify-center mb-4 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-lg text-center text-[#453127] font-semibold mb-2">
              Confirmar cancelamento de presença?
            </h3>

            <p className="text-xs text-[#8a7e78] text-center mb-6 leading-relaxed">
              Você está prestes a remover a inscrição de{" "}
              <strong className="text-[#453127]">{deleteTarget.nome}</strong> para o horário{" "}
              <strong className="text-[#74896a]">{deleteTarget.horario}</strong>. Esta ação liberará 1 vaga
              imediatamente e não poderá ser desfeita.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#e4d5cc] text-[#4a3f3a] text-xs font-medium hover:bg-[#f7f1ee] transition-colors cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#b0574e] hover:bg-[#96453d] text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  "Sim, excluir vaga"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
