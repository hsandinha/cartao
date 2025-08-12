"use client";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function AuthButtons() {
  async function loginGoogle() {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }
  async function logout() {
    await signOut(auth);
  }
  return (
    <div className="flex gap-2">
      <button
        onClick={loginGoogle}
        className="px-4 py-2 rounded-2xl text-white bg-brand hover:bg-brand-dark transition"
      >
        Entrar com Google
      </button>
      <button
        onClick={logout}
        className="px-4 py-2 rounded-2xl ring-1 ring-black/10 hover:bg-gray-50 transition"
      >
        Sair
      </button>
    </div>
  );
}
