import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      "https://convite.florescasaudefeminina.com.br"
  ),
  alternates: {
    canonical: "/",
  },
  title: "Floresça · Saúde Integral Feminina",
  description:
    "Confirmação de presença para a inauguração do espaço Floresça — Método Floresça.",
  openGraph: {
    title: "Floresça · Saúde Integral Feminina",
    description:
      "Confirme sua presença para a inauguração do espaço Floresça — Método Floresça.",
    url: "/",
    siteName: "Floresça",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Floresça - Saúde Integral Feminina",
        type: "image/jpeg",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Floresça · Saúde Integral Feminina",
    description:
      "Confirme sua presença para a inauguração do espaço Floresça — Método Floresça.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/brand/logo-floresca.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
