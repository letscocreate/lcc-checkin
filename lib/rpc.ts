import { createSolanaRpc, devnet } from "@solana/kit";

// Passa pela nossa própria rota (/api/rpc), que decide no servidor se usa a
// Helius ou o RPC público da devnet. Assim nenhuma chave de API fica exposta
// no navegador.
export const rpc = createSolanaRpc(devnet("/api/rpc"));
