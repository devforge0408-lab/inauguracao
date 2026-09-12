"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BrevoConfigStatus } from "@/lib/email-types";
import { EmailTabs } from "./tabs";
import { AlertTriangle, Loader2, LogOut, Users } from "lucide-react";

export function EmailShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<BrevoConfigStatus | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/email/config")
      .then((res) => res.json())
      .then((data: BrevoConfigStatus) => setConfig(data))
      .catch((err) => console.error("Erro ao verificar configuração da Brevo:", err));
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#fbf7f3] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 text-[#5e9e90] animate-spin" />
          <p className="text-sm text-[#8a7e78] font-serif">Carregando módulo de e-mails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f6] text-[#453127] font-sans pb-16">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#eeddd4] px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
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
                Floresça · Disparo de E-mails
              </h1>
              <p className="text-[11px] text-[#5e9e90] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5e9e90] animate-pulse"></span>
                Inauguração Método Floresça
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8a7e78] hover:text-[#4a3f3a] bg-[#f8f2ed] hover:bg-[#f0e6de] rounded-lg transition-colors border border-[#ebdcd3]"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Painel de confirmações</span>
            </Link>

            <div className="hidden sm:block h-4 w-px bg-[#e4d5cc]" />

            <div className="hidden sm:flex items-center gap-2 pl-1">
              <div className="w-7 h-7 rounded-full bg-[#5e9e90]/15 text-[#3f7a6c] flex items-center justify-center font-serif text-xs font-bold uppercase">
                {user.email?.charAt(0) || "A"}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-[#4a3f3a] leading-tight max-w-[150px] truncate">
                  {user.email}
                </p>
                <p className="text-[10px] text-[#5e9e90]">Administrador</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#b0574e] hover:bg-[#fef2f2] rounded-lg transition-colors border border-transparent hover:border-[#fecaca] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        <div className="mb-6">
          <EmailTabs />
        </div>

        {config && !config.configured && (
          <div className="mb-6 p-4 rounded-2xl bg-[#fdf6e9] border border-[#eeddb4] text-[#8a6d2f] text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Brevo não configurada</p>
              <p className="mt-0.5">
                Defina <code className="bg-[#f6ecd6] px-1 rounded">BREVO_API_KEY</code> e{" "}
                <code className="bg-[#f6ecd6] px-1 rounded">BREVO_SENDER_EMAIL</code> no{" "}
                <code className="bg-[#f6ecd6] px-1 rounded">.env.local</code> e reinicie o
                servidor para habilitar o envio de e-mails.
              </p>
            </div>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
