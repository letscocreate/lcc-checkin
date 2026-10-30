# LCC · Check-in on-chain

Lista de presença das aulas e eventos da Let's CoCreate (LCC), gravada na blockchain da Solana (rede de testes, **devnet**).

**Acesse: https://lcc-checkin.vercel.app**

Feito para o Bloco 5 da LCC, em parceria com a Superteam Brasil: mostrar um registro de presença na blockchain e depois debater com a turma se isso precisava mesmo de blockchain.

> Rede de testes (devnet) · moedas sem valor. Use só o primeiro nome ou apelido: tudo o que vai para a blockchain é público e permanente.

## Como funciona

1. Alguém cria uma sala (ex.: `bloco5-aula09`) e compartilha o link `/<nome-da-sala>`.
2. O aluno abre o link, conecta a carteira **Phantom** na devnet, escreve o nome e clica em **Fazer check-in**.
3. O app monta **uma transação com duas instruções**:
   - envia **1000 lamports** (0,000001 SOL de teste) da carteira do aluno para a **carteira da turma**;
   - grava um **memo** com o texto `LCC | <nome-da-sala> | <nome-do-aluno>`.
4. A Phantom pede a assinatura. Depois da confirmação, aparece o link da transação no Solscan.
5. A lista "Quem já fez check-in" lê as transações da carteira da turma **direto da blockchain**, filtra pelo nome exato da sala e mostra cada carteira uma vez só (vale o primeiro check-in). Ela se atualiza a cada 10 segundos.

**Não existe banco de dados, login nem backend próprio.** Uma sala "existe" quando alguém faz o primeiro check-in nela, e a blockchain é o único registro. O app não guarda nada, não usa cookies de rastreamento nem analytics, e nunca pede chave privada ou seed phrase.

Todos os check-ins ficam públicos na [página da carteira da turma no Solscan](https://solscan.io/account/Ckdc6ZauKBMxAMqt5cmcLAYtZy3aQ155KXFAYAN6wPA7?cluster=devnet).

## Onde está cada coisa

| Arquivo | O que faz |
| --- | --- |
| [`lib/config.ts`](lib/config.ts) | Carteira da turma, prefixo do memo e valor do check-in |
| [`lib/checkin.ts`](lib/checkin.ts) | Monta a transação (transferência + memo), pede a assinatura e envia |
| [`lib/checkin-feed.ts`](lib/checkin-feed.ts) | Lê os check-ins da blockchain e filtra por sala |
| [`lib/checkin-errors.ts`](lib/checkin-errors.ts) | Mensagens de erro em português |
| [`lib/wallet-context.tsx`](lib/wallet-context.tsx) | Conexão com a Phantom via Wallet Standard |
| [`app/[sala]/page.tsx`](app/[sala]/page.tsx) | Página da sala |
| [`app/api/rpc/route.ts`](app/api/rpc/route.ts) | Repassa os pedidos para a devnet, só com os comandos que o app usa |

Feito com [Next.js](https://nextjs.org), [`@solana/kit`](https://github.com/anza-xyz/kit) e [Wallet Standard](https://github.com/wallet-standard/wallet-standard). Usa só programas que já existem na Solana (System Program e Memo Program), sem nenhum programa novo.

## Rodar no seu computador

Você precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
git clone https://github.com/letscocreate/lcc-checkin.git
cd lcc-checkin
npm install
npm run dev
```

Abra http://localhost:3000. Para fazer check-in, instale a [Phantom](https://phantom.app), ative a rede de testes (Solana Devnet) nas configurações de desenvolvedor e pegue SOL de teste grátis em https://faucet.solana.com.

Opcional: para usar um RPC da [Helius](https://helius.dev) em vez do RPC público da devnet, crie um arquivo `.env` com `HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=SUA_CHAVE`.

## Licença

[MIT](LICENSE): pode usar, copiar e modificar, mantendo o aviso de autoria.
