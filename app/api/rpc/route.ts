import { NextRequest, NextResponse } from "next/server";

// Repassa chamadas JSON-RPC para a devnet. Usa a Helius se houver HELIUS_RPC_URL
// no .env (lida só aqui, no servidor — nunca chega ao navegador); senão usa o
// RPC público da devnet, sem exigir nenhuma chave.
const PUBLIC_DEVNET_RPC = "https://api.devnet.solana.com";

// Só os comandos que o app usa. Assim esta rota não vira um RPC grátis para
// qualquer um.
const ALLOWED_METHODS = new Set([
  "getBalance",
  "getLatestBlockhash",
  "getMinimumBalanceForRentExemption",
  "getSignatureStatuses",
  "getSignaturesForAddress",
  "getTransaction",
  "sendTransaction",
]);

const MAX_BODY_BYTES = 16_384;

function rejected(message: string, status: number) {
  return NextResponse.json(
    { jsonrpc: "2.0", id: null, error: { code: -32600, message } },
    { status },
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) {
    return rejected("Pedido grande demais.", 413);
  }

  let method: unknown;
  try {
    method = (JSON.parse(body) as { method?: unknown }).method;
  } catch {
    return rejected("Pedido inválido.", 400);
  }
  if (typeof method !== "string" || !ALLOWED_METHODS.has(method)) {
    return rejected("Comando não permitido.", 403);
  }

  const targetUrl = process.env.HELIUS_RPC_URL?.trim() || PUBLIC_DEVNET_RPC;
  const upstream = await fetch(targetUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });

  const data = await upstream.text();
  return new NextResponse(data, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}
