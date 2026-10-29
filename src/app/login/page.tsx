"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Login failed");
        return;
      }
      router.push("/");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl font-bold">AI Filmmaking Studio</h1>
      <p className="mb-6 text-sm text-zinc-400">Sign in to continue</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="passcode" className="mb-1 block text-sm text-zinc-300">
            Passcode
          </label>
          <input
            id="passcode"
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            autoFocus
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || !passcode}
          className="w-full rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-xs text-zinc-600">
        Default passcode is set in your local <code>.env</code> as
        AUTH_PASSCODE.
      </p>
    </main>
  );
}
