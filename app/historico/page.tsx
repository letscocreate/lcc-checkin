"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadAllCheckins, type Checkin } from "@/lib/checkin-feed";
import { formatDate, shortenAddress, solscanAddressUrl } from "@/lib/format";

type RoomSummary = { roomName: string; total: number; lastTime: number | null };

type StudentSummary = {
  wallet: string;
  latestName: string;
  // Salas do aluno, da mais recente para a mais antiga.
  rooms: string[];
};

// checkins já vem do mais recente para o mais antigo.
function summarizeRooms(checkins: Checkin[]): RoomSummary[] {
  const byRoom = new Map<string, RoomSummary>();
  for (const checkin of checkins) {
    const room = byRoom.get(checkin.roomName);
    if (room) {
      room.total += 1;
    } else {
      byRoom.set(checkin.roomName, {
        roomName: checkin.roomName,
        total: 1,
        lastTime: checkin.blockTime,
      });
    }
  }
  return [...byRoom.values()];
}

function summarizeStudents(checkins: Checkin[]): StudentSummary[] {
  const byWallet = new Map<string, StudentSummary>();
  for (const checkin of checkins) {
    const student = byWallet.get(checkin.wallet);
    if (student) {
      student.rooms.push(checkin.roomName);
    } else {
      byWallet.set(checkin.wallet, {
        wallet: checkin.wallet,
        latestName: checkin.studentName,
        rooms: [checkin.roomName],
      });
    }
  }
  return [...byWallet.values()].sort(
    (a, b) =>
      b.rooms.length - a.rooms.length ||
      a.latestName.localeCompare(b.latestName, "pt-BR"),
  );
}

export default function HistoryPage() {
  const [checkins, setCheckins] = useState<Checkin[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAllCheckins()
      .then((result) => {
        if (!cancelled) setCheckins(result);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Não foi possível ler a blockchain agora. Recarregue a página para tentar de novo.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6">
      <header className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          LCC · Check-in on-chain
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Histórico
        </h1>
        <p className="max-w-md text-sm text-zinc-600">
          Tudo lido direto da blockchain: todas as salas que já tiveram
          check-in e a presença de cada carteira.
        </p>
      </header>

      {error && <p className="text-center text-red-600">{error}</p>}
      {!error && checkins === null && (
        <p className="text-center text-zinc-500">Lendo a blockchain...</p>
      )}
      {checkins && checkins.length === 0 && (
        <p className="text-center text-zinc-500">
          Nenhum check-in ainda.
        </p>
      )}
      {checkins && checkins.length > 0 && (
        <>
          <RoomsTable rooms={summarizeRooms(checkins)} />
          <StudentsTable students={summarizeStudents(checkins)} />
        </>
      )}
    </main>
  );
}

function RoomsTable({ rooms }: { rooms: RoomSummary[] }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-zinc-900">
        Salas ({rooms.length})
      </h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600">
            <tr>
              <th className="px-4 py-2 font-medium">Sala</th>
              <th className="px-4 py-2 font-medium">Check-ins</th>
              <th className="px-4 py-2 font-medium">Último</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {rooms.map((room) => (
              <tr key={room.roomName}>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/${room.roomName}`}
                    className="font-medium text-zinc-900 underline"
                  >
                    {room.roomName}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-zinc-700">{room.total}</td>
                <td className="px-4 py-2.5 text-zinc-600">
                  {formatDate(room.lastTime)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StudentsTable({ students }: { students: StudentSummary[] }) {
  return (
    <section>
      <h2 className="mb-1 text-xl font-semibold text-zinc-900">
        Presença por aluno ({students.length})
      </h2>
      <p className="mb-3 text-xs text-zinc-500">
        Agrupado pela carteira. O nome mostrado é o do check-in mais recente.
      </p>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600">
            <tr>
              <th className="px-4 py-2 font-medium">Aluno</th>
              <th className="px-4 py-2 font-medium">Presenças</th>
              <th className="px-4 py-2 font-medium">Salas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {students.map((student) => (
              <tr key={student.wallet} className="align-top">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-zinc-900">
                    {student.latestName}
                  </p>
                  <a
                    href={solscanAddressUrl(student.wallet)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-zinc-500 underline"
                  >
                    {shortenAddress(student.wallet)}
                  </a>
                </td>
                <td className="px-4 py-2.5 text-zinc-700">
                  {student.rooms.length}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {student.rooms.map((roomName) => (
                      <Link
                        key={roomName}
                        href={`/${roomName}`}
                        className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700 hover:bg-zinc-200"
                      >
                        {roomName}
                      </Link>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
