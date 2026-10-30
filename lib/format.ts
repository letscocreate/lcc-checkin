const LAMPORTS_PER_SOL = 1_000_000_000;

export function shortenAddress(fullAddress: string) {
  return `${fullAddress.slice(0, 4)}...${fullAddress.slice(-4)}`;
}

export function lamportsToSol(lamports: bigint | number) {
  return Number(lamports) / LAMPORTS_PER_SOL;
}

export function formatSol(lamports: bigint | number) {
  return `${lamportsToSol(lamports).toFixed(4)} SOL`;
}

export function formatTime(unixSeconds: number | null) {
  if (unixSeconds === null) return "—";
  return new Date(unixSeconds * 1000).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(unixSeconds: number | null) {
  if (unixSeconds === null) return "—";
  return new Date(unixSeconds * 1000).toLocaleDateString("pt-BR");
}

export function solscanTxUrl(signature: string) {
  return `https://solscan.io/tx/${signature}?cluster=devnet`;
}

export function solscanAddressUrl(walletAddress: string) {
  return `https://solscan.io/account/${walletAddress}?cluster=devnet`;
}
