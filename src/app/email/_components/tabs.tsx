"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Send, LayoutTemplate, Settings } from "lucide-react";

const TABS = [
  { href: "/email", label: "Envio", icon: Send },
  { href: "/email/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/email/config", label: "Configuração", icon: Settings },
];

export function EmailTabs() {
  const pathname = usePathname();

  return (
    <nav className="inline-flex flex-wrap gap-1.5 bg-white border border-[#ede1d8] rounded-2xl p-1.5 shadow-2xs">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-[#eaf4f1] text-[#3f7a6c] border border-[#cfe5de] shadow-2xs"
                : "text-[#8a7e78] hover:text-[#453127] hover:bg-[#f8f2ed] border border-transparent"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
