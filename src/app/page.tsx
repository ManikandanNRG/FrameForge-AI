"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (d.data?.loggedIn) router.replace("/projects");
        else router.replace("/login");
      })
      .catch(() => router.replace("/login"));
  }, []);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
    </div>
  );
}
