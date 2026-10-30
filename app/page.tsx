"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { validateRoomName } from "@/lib/validation";

export default function Home() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalized = roomName.trim().toLowerCase();
    const validationError = validateRoomName(normalized);
    if (validationError) {
      setError(validationError);
      return;
    }
    router.push(`/${normalized}`);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        LCC · Check-in on-chain
      </h1>
      <p className="max-w-md text-zinc-600">
        Crie uma sala para a aula de hoje e compartilhe o link com a turma.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 text-left"
      >
        <label htmlFor="room-name" className="text-sm font-medium text-zinc-700">
          Nome da sala
        </label>
        <input
          id="room-name"
          type="text"
          value={roomName}
          onChange={(event) => setRoomName(event.target.value)}
          placeholder="ex.: bloco5-aula09"
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-base text-zinc-900"
        />
        <p className="text-xs text-zinc-500">
          Só letras minúsculas, números e hífen, até 40 caracteres.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="mt-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Criar sala
        </button>
      </form>
    </main>
  );
}
