"use client";

import { useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { validateRoomName, validateStudentName } from "@/lib/validation";
import { useWallet } from "@/lib/wallet-context";
import { performCheckin, type CheckinStage } from "@/lib/checkin";
import { CheckinError, FAUCET_URL } from "@/lib/checkin-errors";
import { TEAM_WALLET_ADDRESS } from "@/lib/config";
import { solscanAddressUrl, solscanTxUrl } from "@/lib/format";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { WalletButton } from "@/components/WalletButton";
import { CheckinList, useRoomCheckins } from "@/components/CheckinList";

const STAGE_LABEL: Record<CheckinStage, string> = {
  "awaiting-signature": "Aguardando sua assinatura na Phantom...",
  sending: "Gravando na blockchain...",
  confirmed: "Check-in feito!",
};

export default function RoomPage() {
  const params = useParams<{ sala: string }>();
  const roomName = params.sala;
  const roomNameError = validateRoomName(roomName);

  const { wallet, account } = useWallet();
  const [studentName, setStudentName] = useState("");
  const [formError, setFormError] = useState<CheckinError | null>(null);
  const [stage, setStage] = useState<CheckinStage | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const roomCheckins = useRoomCheckins(roomName);

  async function handleCheckin(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!wallet || !account) {
      setFormError(new CheckinError("not-connected"));
      return;
    }
    const trimmedName = studentName.trim();
    const nameError = validateStudentName(trimmedName);
    if (nameError) {
      setFormError(new CheckinError("unknown", nameError));
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
      roomCheckins.refresh();
    } catch (err) {
      setFormError(
        err instanceof CheckinError ? err : new CheckinError("unknown"),
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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          LCC · Check-in on-chain
        </p>
        <h1 className="break-all text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          {roomName}
        </h1>
        <CopyLinkButton path={`/${roomName}`} />
      </header>

      <div className="grid gap-8 md:grid-cols-[1fr_20rem] md:items-start">
        <aside className="flex flex-col items-center gap-4 md:order-2">
          <WalletButton />

          {signature ? (
            <div className="flex w-full flex-col items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
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
              className="flex w-full flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left"
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
              {formError && <ErrorMessage error={formError} />}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
              >
                {stage ? STAGE_LABEL[stage] : "Fazer check-in"}
              </button>
            </form>
          )}
        </aside>

        <div className="flex flex-col gap-3 md:order-1">
          <CheckinList
            checkins={roomCheckins.checkins}
            error={roomCheckins.error}
          />
          <a
            href={solscanAddressUrl(TEAM_WALLET_ADDRESS)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-zinc-600 underline"
          >
            Ver todos os check-ins no Solscan
          </a>
        </div>
      </div>
    </main>
  );
}

function ErrorMessage({ error }: { error: CheckinError }) {
  return (
    <div className="flex flex-col gap-1 text-sm text-red-600" role="alert">
      <p>{error.message}</p>
      {error.kind === "insufficient-funds" && (
        <a
          href={FAUCET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline"
        >
          Abrir faucet.solana.com
        </a>
      )}
      {error.signature && (
        <a
          href={solscanTxUrl(error.signature)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline"
        >
          Ver transação no Solscan
        </a>
      )}
    </div>
  );
}
