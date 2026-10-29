"use client";

import { useEffect, useState } from "react";
import { address } from "@solana/kit";
import { rpc } from "@/lib/rpc";
import { useWallet } from "@/lib/wallet-context";
import { formatSol, shortenAddress } from "@/lib/format";

type BalanceResult = {
  address: string;
  value: bigint | null;
  error: string | null;
};

export function WalletButton() {
  const { account, status, error, connect, disconnect } = useWallet();
  const [balanceResult, setBalanceResult] = useState<BalanceResult | null>(
    null,
  );

  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    rpc
      .getBalance(address(account.address))
      .send()
      .then(({ value }) => {
        if (!cancelled) {
          setBalanceResult({ address: account.address, value, error: null });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBalanceResult({
            address: account.address,
            value: null,
            error: "Não foi possível consultar o saldo.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [account]);

  const balanceForAccount =
    account && balanceResult?.address === account.address
      ? balanceResult
      : null;

  if (status === "connected" && account) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-center">
        <span className="font-mono text-sm text-zinc-700">
          {shortenAddress(account.address)}
        </span>
        <span className="text-sm text-zinc-600">
          {balanceForAccount === null
            ? "Consultando saldo..."
            : balanceForAccount.error ??
              `${formatSol(balanceForAccount.value!)} (devnet)`}
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Desconectar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => connect()}
        disabled={status === "connecting"}
        className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {status === "connecting" ? "Conectando..." : "Conectar carteira"}
      </button>
      {error && <p className="max-w-xs text-sm text-red-600">{error}</p>}
    </div>
  );
}
