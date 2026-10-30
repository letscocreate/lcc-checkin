import {
  address,
  appendTransactionMessageInstructions,
  assertIsFullySignedTransaction,
  compileTransaction,
  createNoopSigner,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  getTransactionDecoder,
  getTransactionEncoder,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { getAddMemoInstruction } from "@solana-program/memo";
import {
  SolanaSignTransaction,
  type SolanaSignTransactionFeature,
} from "@solana/wallet-standard-features";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import { rpc } from "./rpc";
import { CHECKIN_LAMPORTS, MEMO_PREFIX, TEAM_WALLET_ADDRESS } from "./config";

export const SOLANA_DEVNET_CHAIN = "solana:devnet";

export type CheckinStage = "awaiting-signature" | "sending" | "confirmed";

export class CheckinError extends Error {}

export function buildCheckinMemo(roomName: string, studentName: string) {
  return `${MEMO_PREFIX} | ${roomName} | ${studentName}`;
}

export async function performCheckin(options: {
  wallet: Wallet;
  account: WalletAccount;
  roomName: string;
  studentName: string;
  onStage: (stage: CheckinStage) => void;
}): Promise<{ signature: string }> {
  const { wallet, account, roomName, studentName, onStage } = options;

  const signFeature = wallet.features[SolanaSignTransaction] as
    | SolanaSignTransactionFeature[typeof SolanaSignTransaction]
    | undefined;
  if (!signFeature) {
    throw new CheckinError(
      "Essa carteira não sabe assinar transações da Solana.",
    );
  }

  const studentAddress = address(account.address);
  const studentSigner = createNoopSigner(studentAddress);

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transferInstruction = getTransferSolInstruction({
    source: studentSigner,
    destination: address(TEAM_WALLET_ADDRESS),
    amount: CHECKIN_LAMPORTS,
  });

  const memoInstruction = getAddMemoInstruction({
    memo: buildCheckinMemo(roomName, studentName),
    signers: [studentSigner],
  });

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(studentAddress, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) =>
      appendTransactionMessageInstructions(
        [transferInstruction, memoInstruction],
        tx,
      ),
  );

  const unsignedTransaction = compileTransaction(transactionMessage);
  const unsignedWireBytes = getTransactionEncoder().encode(
    unsignedTransaction,
  );

  onStage("awaiting-signature");
  const [{ signedTransaction }] = await signFeature.signTransaction({
    account,
    transaction: new Uint8Array(unsignedWireBytes),
    chain: SOLANA_DEVNET_CHAIN,
  });

  onStage("sending");
  const fullySignedTransaction = getTransactionDecoder().decode(
    signedTransaction,
  );
  assertIsFullySignedTransaction(fullySignedTransaction);
  const signature = getSignatureFromTransaction(fullySignedTransaction);
  const base64Transaction = getBase64EncodedWireTransaction(
    fullySignedTransaction,
  );

  await rpc.sendTransaction(base64Transaction, { encoding: "base64" }).send();
  await waitForConfirmation(signature);

  onStage("confirmed");
  return { signature };
}

async function waitForConfirmation(
  signature: Parameters<typeof rpc.getSignatureStatuses>[0][number],
  timeoutMs = 60_000,
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { value } = await rpc.getSignatureStatuses([signature]).send();
    const status = value[0];
    if (status) {
      if (status.err) {
        throw new CheckinError("A transação falhou na blockchain.");
      }
      if (
        status.confirmationStatus === "confirmed" ||
        status.confirmationStatus === "finalized"
      ) {
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new CheckinError(
    "A confirmação está demorando mais que o esperado. Confira o link do Solscan antes de tentar de novo.",
  );
}
