"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/app/actions/auth";
import { Button, Input, Label } from "@/components/ui";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await register({ name, email, password });
    setSubmitting(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded-full bg-blue-600" />
        <h1 className="text-xl font-semibold text-zinc-900">Crear cuenta</h1>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        Regístrate para acceder a las finanzas del grupo
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creando..." : "Crear cuenta"}
        </Button>
      </form>
    </div>
  );
}
