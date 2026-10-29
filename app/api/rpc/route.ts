import { NextRequest, NextResponse } from "next/server";

// Repassa chamadas JSON-RPC para a devnet. Usa a Helius se houver HELIUS_RPC_URL
// no .env (lida só aqui, no servidor — nunca chega ao navegador); senão usa o
// RPC público da devnet, sem exigir nenhuma chave.
const PUBLIC_DEVNET_RPC = "https://api.devnet.solana.com";

export async function POST(request: NextRequest) {
  const targetUrl = process.env.HELIUS_RPC_URL?.trim() || PUBLIC_DEVNET_RPC;
  const body = await request.text();

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
