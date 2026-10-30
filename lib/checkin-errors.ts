import {
  isSolanaError,
  SOLANA_ERROR__INSTRUCTION_ERROR__INSUFFICIENT_FUNDS,
  SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
  SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_NOT_FOUND,
  SOLANA_ERROR__TRANSACTION_ERROR__BLOCKHASH_NOT_FOUND,
  SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE,
  SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_RENT,
} from "@solana/kit";

export const FAUCET_URL = "https://faucet.solana.com";

export type CheckinErrorKind =
  | "not-connected"
  | "insufficient-funds"
  | "wrong-network"
  | "rejected"
  | "network"
  | "timeout"
  | "unknown";

export const CHECKIN_ERROR_MESSAGES: Record<CheckinErrorKind, string> = {
  "not-connected": "Conecte sua carteira antes de fazer o check-in.",
  "insufficient-funds":
    "Saldo insuficiente na devnet. Pegue SOL de teste de graça no faucet e tente de novo.",
  "wrong-network":
    "Sua Phantom não está na rede de testes. Abra a Phantom → Configurações → Configurações de desenvolvedor → ative o Modo de rede de testes e escolha Solana Devnet.",
  rejected:
    "Você recusou a assinatura na Phantom. Nada foi gravado. Clique em “Fazer check-in” para tentar de novo.",
  network:
    "Não conseguimos falar com a blockchain. Confira sua internet e tente de novo.",
  timeout:
    "A confirmação está demorando mais que o esperado. Confira no Solscan antes de tentar de novo.",
  unknown: "Não foi possível fazer o check-in. Tente de novo.",
};

export class CheckinError extends Error {
  constructor(
    readonly kind: CheckinErrorKind,
    message = CHECKIN_ERROR_MESSAGES[kind],
    readonly signature?: string,
  ) {
    super(message);
  }
}

const INSUFFICIENT_FUNDS_CODES = [
  SOLANA_ERROR__INSTRUCTION_ERROR__INSUFFICIENT_FUNDS,
  SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_NOT_FOUND,
  SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE,
  SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_RENT,
] as const;

// Percorre o erro e as causas dele (o kit embrulha o erro da blockchain
// dentro do erro do RPC).
function errorChain(err: unknown) {
  const chain: unknown[] = [];
  let current = err;
  while (current && chain.length < 5) {
    chain.push(current);
    current = (current as { cause?: unknown }).cause;
  }
  return chain;
}

function isRejection(err: unknown) {
  const { code, message } = err as { code?: unknown; message?: unknown };
  if (code === 4001) return true;
  return typeof message === "string" && /reject|denied|cancel/i.test(message);
}

export function toCheckinError(err: unknown): CheckinError {
  if (err instanceof CheckinError) return err;

  const chain = errorChain(err);
  if (chain.some(isRejection)) return new CheckinError("rejected");
  if (
    chain.some((e) =>
      INSUFFICIENT_FUNDS_CODES.some((code) => isSolanaError(e, code)),
    )
  ) {
    return new CheckinError("insufficient-funds");
  }
  if (
    chain.some((e) =>
      isSolanaError(e, SOLANA_ERROR__TRANSACTION_ERROR__BLOCKHASH_NOT_FOUND),
    )
  ) {
    return new CheckinError("wrong-network");
  }
  if (
    chain.some(
      (e) =>
        isSolanaError(e, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR) ||
        // O navegador avisa queda de conexão com TypeError("Failed to fetch").
        (e instanceof TypeError && /fetch|network|load failed/i.test(e.message)),
    )
  ) {
    return new CheckinError("network");
  }
  return new CheckinError("unknown");
}
