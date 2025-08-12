"use client";
import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      }),
    []
  );
  if (loading) return <div className="p-6">Carregando...</div>;
  if (!user)
    return (
      <div className="p-6 text-center space-y-3">
        <h1 className="text-xl font-semibold">Faça login para continuar</h1>
        <p className="text-gray-600 text-sm">
          Autenticação exclusiva via Firebase (Google).
        </p>
        {/* Reutilize o botão de login se quiser */}
      </div>
    );
  return <>{children}</>;
}
