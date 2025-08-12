import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Login — Cartão Digital",
  description: "Acesse com Firebase Auth",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
