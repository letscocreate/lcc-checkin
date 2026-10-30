"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getWallets } from "@wallet-standard/app";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import {
  StandardConnect,
  StandardDisconnect,
  type StandardConnectFeature,
  type StandardDisconnectFeature,
} from "@wallet-standard/features";

const SOLANA_DEVNET_CHAIN = "solana:devnet";
const PHANTOM_WALLET_NAME = "Phantom";

function isSolanaWallet(wallet: Wallet) {
  return wallet.chains.some((chain) => chain.startsWith("solana:"));
}

type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

type WalletContextValue = {
  wallet: Wallet | null;
  account: WalletAccount | null;
  status: WalletStatus;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<readonly Wallet[]>(() =>
    typeof window === "undefined" ? [] : getWallets().get(),
  );
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const walletsApi = getWallets();
    const offRegister = walletsApi.on("register", () =>
      setWallets(walletsApi.get()),
    );
    const offUnregister = walletsApi.on("unregister", () =>
      setWallets(walletsApi.get()),
    );
    return () => {
      offRegister();
      offUnregister();
    };
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setStatus("connecting");
    try {
      const phantom = wallets.find(
        (w) => w.name === PHANTOM_WALLET_NAME && isSolanaWallet(w),
      );
      if (!phantom) {
        throw new Error(
          "Phantom não encontrada. Instale a extensão em phantom.app e recarregue a página.",
        );
      }
      const connectFeature = phantom.features[StandardConnect] as
        | StandardConnectFeature[typeof StandardConnect]
        | undefined;
      if (!connectFeature) {
        throw new Error("Essa carteira não oferece conexão compatível.");
      }
      const { accounts } = await connectFeature.connect();
      const solanaAccount =
        accounts.find((a) => a.chains.includes(SOLANA_DEVNET_CHAIN)) ??
        accounts[0];
      if (!solanaAccount) {
        throw new Error("Nenhuma conta disponível na carteira.");
      }
      setWallet(phantom);
      setAccount(solanaAccount);
      setStatus("connected");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Não foi possível conectar.",
      );
    }
  }, [wallets]);

  const disconnect = useCallback(async () => {
    if (wallet) {
      const disconnectFeature = wallet.features[StandardDisconnect] as
        | StandardDisconnectFeature[typeof StandardDisconnect]
        | undefined;
      try {
        await disconnectFeature?.disconnect();
      } catch {
        // Algumas carteiras não suportam desconexão explícita — ignora.
      }
    }
    setWallet(null);
    setAccount(null);
    setStatus("disconnected");
    setError(null);
  }, [wallet]);

  const value = useMemo<WalletContextValue>(
    () => ({ wallet, account, status, error, connect, disconnect }),
    [wallet, account, status, error, connect, disconnect],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet precisa estar dentro de um WalletProvider.");
  }
  return ctx;
}
