import { WalletButton } from "@/components/WalletButton";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        LCC · Check-in on-chain
      </h1>
      <p className="max-w-md text-zinc-600">
        Em breve: crie uma sala e faça o check-in da aula direto na
        blockchain da Solana.
      </p>
      <WalletButton />
    </main>
  );
}
