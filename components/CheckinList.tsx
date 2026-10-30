"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadRoomCheckins, type Checkin } from "@/lib/checkin-feed";
import { formatTime, shortenAddress, solscanTxUrl } from "@/lib/format";

const REFRESH_INTERVAL_MS = 10_000;

export function useRoomCheckins(roomName: string) {
  const [checkins, setCheckins] = useState<Checkin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeRoomRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await loadRoomCheckins(roomName);
      if (activeRoomRef.current !== roomName) return;
      setCheckins(result);
      setError(null);
    } catch {
      if (activeRoomRef.current !== roomName) return;
      setError("Não foi possível ler a lista agora. Tentando de novo...");
    }
  }, [roomName]);

  useEffect(() => {
    activeRoomRef.current = roomName;
    // Primeira leitura logo em seguida, depois a cada 10 segundos.
    const firstLoad = setTimeout(refresh, 0);
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      activeRoomRef.current = null;
      clearTimeout(firstLoad);
      clearInterval(timer);
    };
  }, [roomName, refresh]);

  return { checkins, error, refresh };
}

export function CheckinList({
  checkins,
  error,
}: {
  checkins: Checkin[] | null;
  error: string | null;
}) {
  return (
    <section className="w-full max-w-md text-left">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">
          Quem já fez check-in
        </h2>
        {checkins && (
          <span className="text-sm text-zinc-600">
            {checkins.length} {checkins.length === 1 ? "pessoa" : "pessoas"}
          </span>
        )}
      </div>

      {error && <p className="mb-2 text-sm text-amber-700">{error}</p>}

      {checkins === null ? (
        !error && <p className="text-sm text-zinc-500">Lendo a blockchain...</p>
      ) : checkins.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Ninguém fez check-in nesta sala ainda.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
          {checkins.map((checkin) => (
            <li
              key={checkin.signature}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-900">
                  {checkin.studentName}
                </p>
                <a
                  href={solscanTxUrl(checkin.signature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-zinc-500 underline"
                >
                  {shortenAddress(checkin.wallet)}
                </a>
              </div>
              <span className="shrink-0 text-sm text-zinc-600">
                {formatTime(checkin.blockTime)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
