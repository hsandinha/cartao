"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace("/dashboard");
    });
    return () => unsub();
  }, [router]);

  async function handleLogin() {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Não foi possível entrar. Tente novamente.");
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Lado visual (inspirado no estilo QuintoAndar: azul forte, clean, cantos arredondados) */}
      <section className="hidden lg:flex flex-col items-center justify-center p-12 bg-blue-600 text-white">
        <div className="max-w-sm space-y-6">
          <div className="rounded-2xl backdrop-blur p-4 w-max">
            {/* Ícone genérico (não usa marca de terceiros) */}
            <Image
              src="/quintoandar.svg"
              alt="Logo QuintoAndar"
              width={120}
              height={120}
            />
          </div>
          <h1 className="text-3xl font-semibold leading-tight">
            Acesse sua conta
          </h1>
          <p className="text-white/90">
            Gestione seu cartão digital em um painel simples e moderno. Visual
            minimalista, foco no conteúdo.
          </p>
          <ul className="text-white/90 space-y-2 text-sm">
            <li>• Login seguro com Google</li>
            <li>• Edite seu cartão e compartilhe o link</li>
            <li>• Gere PDF com links clicáveis</li>
          </ul>
        </div>
      </section>

      {/* Lado do formulário */}
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Entrar</h2>
            <p className="text-gray-600 text-sm">
              Use sua conta Google para continuar.
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-2.5 bg-gray-900 text-white hover:opacity-95 transition focus:outline-none focus:ring-2 focus:ring-black/30"
          >
            {/* Ícone do Google simplificado para uso genérico */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-5 h-5"
              aria-hidden
            >
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.6 31.6 29.3 34 24 34c-7 0-12.8-5.7-12.8-12.8S17 8.5 24 8.5c3.1 0 5.9 1.1 8.1 3.1l5.7-5.7C34.4 2.7 29.5 1 24 1 11.9 1 2 10.9 2 23s9.9 22 22 22 22-9.9 22-22c0-1.4-.1-2.7-.4-4.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.5 16.2 18.9 13 24 13c3.1 0 5.9 1.1 8.1 3.1l5.7-5.7C34.4 6.7 29.5 5 24 5 16 5 9.1 9.6 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 41c5.2 0 10.1-2 13.6-5.3l-6.3-5.1C29.1 31.9 26.7 33 24 33c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9 36.5 15.9 41 24 41z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.4 5.8-6.7 7.6l6.3 5.1C38.1 37 42 30.9 42 23c0-1.4-.1-2.7-.4-4.5z"
              />
            </svg>
            Entrar com Google
          </button>

          <div className="text-xs text-gray-500 leading-relaxed">
            Ao continuar, você concorda com os termos de uso e política de
            privacidade.
          </div>

          <div className="text-center text-sm text-gray-500">
            Precisa de ajuda?{" "}
            <a className="underline" href="#">
              Fale conosco
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
