"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Mail, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { user, loading, loginWithEmail } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/admin");
    }
  }, [user, loading, router]);

  const handleFirebaseError = (error: unknown) => {
    const code = (error as { code?: string })?.code || "";
    switch (code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "E-mail ou senha inválidos. Verifique os dados digitados.";
      case "auth/invalid-email":
        return "Formato de e-mail inválido.";
      case "auth/user-disabled":
        return "Este usuário foi desativado.";
      case "auth/too-many-requests":
        return "Muitas tentativas incorretas. Aguarde alguns instantes e tente novamente.";
      default:
        return "Falha na autenticação. Verifique se o usuário foi criado no Firebase.";
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed || !password) {
      setErro("Por favor, preencha o e-mail e a senha.");
      return;
    }

    try {
      setSubmitting(true);
      await loginWithEmail(emailTrimmed, password);
      router.replace("/admin");
    } catch (err) {
      setErro(handleFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fbf6f1] to-[#f3e9e3] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#b07e76] animate-spin" />
          <p className="text-sm text-[#8a7e78] font-serif">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf6f1] to-[#f3e9e3] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[440px] bg-white rounded-3xl p-8 sm:p-10 shadow-[0_10px_40px_rgba(176,126,118,0.18)] border border-[#f0e1d9] relative">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#8a7e78] hover:text-[#4a3f3a] transition-colors py-1 px-2 rounded-lg hover:bg-[#f7f1ee]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao início
          </Link>
        </div>

        <div className="text-center mb-7">
          <Image
            className="mx-auto mb-3 h-auto"
            src="/brand/logo-floresca.png"
            alt="Floresça"
            width={76}
            height={76}
            priority
          />
          <h1 className="font-serif text-2xl sm:text-[26px] text-[#b07e76] font-normal tracking-wide">
            Área Administrativa
          </h1>
          <p className="text-xs sm:text-[13px] text-[#74896a] mt-1 font-serif tracking-wide">
            Acesso restrito · Equipe Floresça
          </p>
        </div>

        {erro && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#b0574e] text-xs leading-relaxed text-center font-sans">
            {erro}
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-serif text-[#4a3f3a] mb-1.5"
            >
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#b7aaa1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e4d5cc] bg-[#fdfaf8] text-[#4a3f3a] text-sm focus:outline-none focus:border-[#c99a93] transition-colors font-sans"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-serif text-[#4a3f3a] mb-1.5"
            >
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#b7aaa1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#e4d5cc] bg-[#fdfaf8] text-[#4a3f3a] text-sm focus:outline-none focus:border-[#c99a93] transition-colors font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b7aaa1] hover:text-[#4a3f3a] transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#74896a] hover:bg-[#5e7256] text-white font-serif text-[15px] tracking-wide transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:bg-[#c9c1ba] disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              "Entrar com E-mail"
            )}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#f0e1d9]"></div>
          </div>
          <span className="relative bg-white px-3 text-[11px] text-[#b7aaa1] uppercase tracking-wider font-sans">
            ou acesse com
          </span>
        </div>

        <button
          type="button"
          disabled={true}
          title="Login com Google temporariamente desabilitado"
          className="w-full py-3 px-4 rounded-xl border border-[#e4d5cc] bg-[#f9f7f5] text-[#9c8e87] font-sans text-sm font-medium flex items-center justify-center gap-2.5 opacity-60 cursor-not-allowed select-none"
        >
          <svg className="w-4 h-4 grayscale opacity-70" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.37 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.98 0 12s.46 3.82 1.26 5.42l4.02-3.13z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
            />
          </svg>
          <span>Entrar com conta Google</span>
          <span className="text-[10px] bg-[#eee5df] text-[#8a7e78] px-1.5 py-0.5 rounded-md font-sans uppercase tracking-wider font-semibold">
            Bloqueado
          </span>
        </button>

        <p className="text-center text-[11px] text-[#b7aaa1] mt-6 leading-relaxed font-sans">
          Apenas administradores autorizados têm permissão para acessar os dados dos formulários.
        </p>
      </div>
    </div>
  );
}
