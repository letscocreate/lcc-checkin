import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet-context";

export const metadata: Metadata = {
  title: "LCC · Check-in on-chain",
  description: "Registro de presença gravado na blockchain da Solana.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
