import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LCC · Check-in on-chain",
  description: "Registro de presença gravado na blockchain da Solana.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
