import { address, type Signature } from "@solana/kit";
import { rpc } from "./rpc";
import { MEMO_PREFIX, TEAM_WALLET_ADDRESS } from "./config";

// Lê os check-ins direto da blockchain: as transações da carteira da turma,
// com o memo "LCC | <sala> | <nome>". Nada é guardado fora da memória da aba.

export type Checkin = {
  signature: string;
  roomName: string;
  studentName: string;
  wallet: string;
  blockTime: number | null;
};

type TeamSignature = {
  signature: Signature;
  memo: string;
  blockTime: number | null;
};

const PAGE_SIZE = 1000;
const MAX_PARALLEL_REQUESTS = 4;
const MEMO_SEPARATOR = " | ";

// Assinaturas da carteira da turma com memo, da mais recente para a mais antiga.
let teamSignatures: TeamSignature[] = [];
let teamSignaturesLoaded = false;
// Uma transação confirmada nunca muda, então a carteira de quem assinou
// pode ficar guardada em memória.
const walletBySignature = new Map<string, string>();

// O RPC devolve o memo como "[<tamanho em bytes>] <texto>". Usamos o tamanho
// para recortar o texto exato, mesmo com acentos.
export function parseCheckinMemo(
  rawMemo: string,
): { roomName: string; studentName: string } | null {
  const match = /^\[(\d+)\] /.exec(rawMemo);
  if (!match) return null;

  const byteLength = Number(match[1]);
  const memoBytes = new TextEncoder().encode(rawMemo.slice(match[0].length));
  const memo = new TextDecoder().decode(memoBytes.slice(0, byteLength));

  const parts = memo.split(MEMO_SEPARATOR);
  if (parts.length !== 3 || parts[0] !== MEMO_PREFIX) return null;

  const [, roomName, studentName] = parts;
  if (!roomName || !studentName) return null;
  return { roomName, studentName };
}

async function fetchSignaturesPage(options: {
  before?: Signature;
  until?: Signature;
}) {
  return rpc
    .getSignaturesForAddress(address(TEAM_WALLET_ADDRESS), {
      limit: PAGE_SIZE,
      ...options,
    })
    .send();
}

// Na primeira vez lê todo o histórico (de 1000 em 1000); depois busca só o
// que chegou desde a assinatura mais recente que já conhecemos.
let refreshInFlight: Promise<void> | null = null;

function refreshTeamSignatures() {
  refreshInFlight ??= fetchNewTeamSignatures().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function fetchNewTeamSignatures() {
  const newest = teamSignaturesLoaded ? teamSignatures[0]?.signature : undefined;
  const fresh: TeamSignature[] = [];
  let before: Signature | undefined;

  while (true) {
    const page = await fetchSignaturesPage({ before, until: newest });
    for (const item of page) {
      if (item.err === null && item.memo) {
        fresh.push({
          signature: item.signature,
          memo: item.memo,
          blockTime: item.blockTime === null ? null : Number(item.blockTime),
        });
      }
    }
    if (page.length < PAGE_SIZE) break;
    before = page[page.length - 1].signature;
  }

  teamSignatures = [...fresh, ...teamSignatures];
  teamSignaturesLoaded = true;
}

// A carteira do aluno é quem pagou a taxa: a primeira conta da transação.
async function fetchSignerWallet(signature: Signature) {
  const cached = walletBySignature.get(signature);
  if (cached) return cached;

  const transaction = await rpc
    .getTransaction(signature, {
      encoding: "json",
      maxSupportedTransactionVersion: 0,
    })
    .send();
  const feePayer = transaction?.transaction.message.accountKeys[0];
  if (!feePayer) return null;

  walletBySignature.set(signature, feePayer);
  return feePayer;
}

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
) {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

// Check-ins de uma sala: filtro pelo nome exato, uma vez por carteira
// (vale o primeiro check-in), do mais recente para o mais antigo.
export async function loadRoomCheckins(roomName: string): Promise<Checkin[]> {
  await refreshTeamSignatures();

  const roomSignatures = teamSignatures.flatMap((item) => {
    const parsed = parseCheckinMemo(item.memo);
    if (!parsed || parsed.roomName !== roomName) return [];
    return [{ ...item, studentName: parsed.studentName }];
  });

  const wallets = await mapWithLimit(
    roomSignatures,
    MAX_PARALLEL_REQUESTS,
    (item) => fetchSignerWallet(item.signature),
  );

  // teamSignatures vem do mais recente para o mais antigo; percorrendo de
  // trás para frente, o primeiro que aparece de cada carteira é o mais antigo.
  const firstByWallet = new Map<string, Checkin>();
  for (let i = roomSignatures.length - 1; i >= 0; i--) {
    const wallet = wallets[i];
    if (!wallet || firstByWallet.has(wallet)) continue;
    const item = roomSignatures[i];
    firstByWallet.set(wallet, {
      signature: item.signature,
      roomName,
      studentName: item.studentName,
      wallet,
      blockTime: item.blockTime,
    });
  }

  return [...firstByWallet.values()].sort(
    (a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0),
  );
}
