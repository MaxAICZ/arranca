"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, User, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  if (success) {
    return (
      <div className="text-center animate-[fadeIn_0.3s_ease-out]">
        <div className="w-16 h-16 rounded-full bg-[#10B981]/20 mx-auto mb-4 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-[#10B981]" />
        </div>
        <h1 className="text-3xl font-bold mb-2">¡Cuenta creada!</h1>
        <p className="text-[#8B949E]">Te estamos llevando a tu dashboard...</p>
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Crea tu cuenta</h1>
        <p className="text-[#8B949E]">Empieza a construir tu empresa en minutos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-[#8B949E] mb-2 block">
            Nombre completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg pl-10 pr-4 py-3 text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6] transition-colors"
              placeholder="Tu nombre"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-[#8B949E] mb-2 block">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg pl-10 pr-4 py-3 text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6] transition-colors"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-[#8B949E] mb-2 block">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg pl-10 pr-4 py-3 text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6] transition-colors"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#F97316] hover:bg-[#EA6C0A] text-white font-semibold px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear cuenta"}
        </button>
      </form>

      <p className="text-center text-[#8B949E] text-sm mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-[#3B82F6] hover:text-[#60A5FA] font-medium">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
