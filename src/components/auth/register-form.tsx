"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone.trim() || undefined,
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error ?? "Бүртгэл үүсгэхэд алдаа гарлаа");
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setMessage("Бүртгэл үүслээ. Одоо нэвтэрнэ үү.");
        router.push("/login");
        return;
      }

      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-bold text-center">Бүртгүүлэх</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Бүртгэлтэй юу?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Нэвтрэх
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {message && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-danger">
            {message}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Нэр
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-primary/25 min-h-11"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Имэйл
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-primary/25 min-h-11"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Утас
          </label>
          <input
            id="phone"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="99112233"
            className="w-full rounded-xl border border-border bg-white px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-primary/25 min-h-11"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Нууц үг
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-primary/25 min-h-11"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Үүсгэж байна..." : "Бүртгэл үүсгэх"}
        </Button>
      </form>
    </div>
  );
}
