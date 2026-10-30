import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet-context";

export const metadata: Metadata = {
  title: "LCC · Check-in on-chain",
  description: "Registro de presença gravado na blockchain da Solana.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans">
        <div className="sticky top-0 z-10 bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">
          Rede de testes (devnet) · moedas sem valor
        </div>
        <WalletProvider>{children}</WalletProvider>
        <footer className="flex justify-center gap-4 px-4 py-6 text-sm text-zinc-600">
          <Link href="/" className="underline">
            Início
          </Link>
          <Link href="/historico" className="underline">
            Histórico
          </Link>
        </footer>
      </body>
    </html>
  );
}
