"use client";

import { useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { validateRoomName, validateStudentName } from "@/lib/validation";
import { useWallet } from "@/lib/wallet-context";
import { performCheckin, CheckinError, type CheckinStage } from "@/lib/checkin";
import { solscanTxUrl } from "@/lib/format";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { WalletButton } from "@/components/WalletButton";

const STAGE_LABEL: Record<CheckinStage, string> = {
  "awaiting-signature": "Aguardando sua assinatura na Phantom...",
  sending: "Gravando na blockchain...",
  confirmed: "Check-in feito!",
};

export default function RoomPage() {
  const params = useParams<{ sala: string }>();
  const roomName = params.sala;
  const roomNameError = validateRoomName(roomName);

  const { wallet, account, status: walletStatus } = useWallet();
  const [studentName, setStudentName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [stage, setStage] = useState<CheckinStage | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  async function handleCheckin(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const trimmedName = studentName.trim();
    const nameError = validateStudentName(trimmedName);
    if (nameError) {
      setFormError(nameError);
      return;
    }
    if (!wallet || !account) {
      setFormError("Conecte sua carteira antes de fazer o check-in.");
      return;
    }

    try {
      const result = await performCheckin({
        wallet,
        account,
        roomName,
        studentName: trimmedName,
        onStage: setStage,
      });
      setSignature(result.signature);
    } catch (err) {
      setFormError(
        err instanceof CheckinError || err instanceof Error
          ? err.message
          : "Não foi possível fazer o check-in.",
      );
    } finally {
      setStage(null);
    }
  }

  if (roomNameError) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-red-600">{roomNameError}</p>
        <Link href="/" className="text-sm font-medium text-zinc-700 underline">
          Voltar para o início
        </Link>
      </main>
    );
  }

  const isSubmitting = stage !== null;

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-6 py-10 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Sala: {roomName}
        </h1>
        <CopyLinkButton path={`/${roomName}`} />
      </div>

      <WalletButton />

      {signature ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <p className="font-medium text-green-800">Check-in feito!</p>
          <a
            href={solscanTxUrl(signature)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-green-700 underline"
          >
            Ver transação no Solscan
          </a>
        </div>
      ) : (
        <form
          onSubmit={handleCheckin}
          className="flex w-full max-w-sm flex-col gap-3 text-left"
        >
          <label
            htmlFor="student-name"
            className="text-sm font-medium text-zinc-700"
          >
            Seu nome
          </label>
          <input
            id="student-name"
            type="text"
            value={studentName}
            onChange={(event) => setStudentName(event.target.value)}
            placeholder="ex.: Maria"
            disabled={isSubmitting}
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-base text-zinc-900 disabled:opacity-60"
          />
          <p className="text-xs text-zinc-500">
            Use só o primeiro nome ou apelido. Tudo o que vai para a
            blockchain é público e permanente.
          </p>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={isSubmitting || walletStatus !== "connected"}
            className="mt-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
          >
            {stage ? STAGE_LABEL[stage] : "Fazer check-in"}
          </button>
        </form>
      )}
    </main>
  );
}
