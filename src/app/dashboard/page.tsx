"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Copy,
  Mail,
  Phone,
  Share2,
  Globe,
  MapPin,
  Download,
  MessageSquare,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// Caso não tenha instalado ainda:
// npm i lucide-react qrcode.react
// (e certifique-se de ter os componentes shadcn/ui: Card, Button, Input, Textarea)

const BRAND = {
  primary: "#0066FF",
  primaryDark: "#0152CC",
  accent: "#111827",
  bg: "#F5F7FB",
};

function toVCard(p: any) {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${p.name};;;;`,
    `FN:${p.name}`,
    p.company ? `ORG:${p.company}` : null,
    p.role ? `TITLE:${p.role}` : null,
    p.phone ? `TEL;TYPE=CELL:${p.phone}` : null,
    p.email ? `EMAIL;TYPE=INTERNET:${p.email}` : null,
    p.address ? `ADR;TYPE=WORK:;;${p.address}` : null,
    p.website ? `URL:${p.website}` : null,
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

function downloadVCard(profile: any) {
  const vcard = toVCard(profile);
  const blob = new Blob([vcard], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${profile.name}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    name: "João Silva",
    role: "Desenvolvedor Full Stack",
    company: "Tech Solutions",
    phone: "(11) 99999-9999",
    whatsapp: "5511999999999",
    email: "joao@exemplo.com",
    website: "https://joaosilva.dev",
    address: "São Paulo, SP",
    about:
      "Desenvolvedor apaixonado por tecnologia com mais de 5 anos de experiência em React, Node.js e Python.",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/");
      } else {
        setUser(u);
      }
    });
    return () => unsub();
  }, [router]);

  const shareUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/card/${user?.uid || "demo"}`;
    }
    return "";
  }, [user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado!");
  };

  const shareCard = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Cartão de ${profile.name}`,
        url: shareUrl,
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand text-white p-6 flex items-center justify-between shadow-md">
        <h1 className="text-lg font-semibold">Meu Cartão Digital</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user.displayName}</span>
          <button
            onClick={() => signOut(auth)}
            className="bg-white text-brand px-3 py-1 rounded-lg hover:bg-gray-100 transition"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 grid lg:grid-cols-2 gap-8">
        {/* Formulário de Edição */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editar Perfil</CardTitle>
              <CardDescription>
                Personalize as informações do seu cartão digital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome</label>
                <Input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cargo</label>
                <Input
                  value={profile.role}
                  onChange={(e) =>
                    setProfile({ ...profile, role: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Empresa
                </label>
                <Input
                  value={profile.company}
                  onChange={(e) =>
                    setProfile({ ...profile, company: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Telefone
                </label>
                <Input
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  WhatsApp
                </label>
                <Input
                  value={profile.whatsapp}
                  onChange={(e) =>
                    setProfile({ ...profile, whatsapp: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">E-mail</label>
                <Input
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Website
                </label>
                <Input
                  value={profile.website}
                  onChange={(e) =>
                    setProfile({ ...profile, website: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Endereço
                </label>
                <Input
                  value={profile.address}
                  onChange={(e) =>
                    setProfile({ ...profile, address: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sobre</label>
                <Textarea
                  value={profile.about}
                  onChange={(e) =>
                    setProfile({ ...profile, about: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview do Cartão */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview do Cartão</CardTitle>
              <CardDescription>
                Veja como seu cartão aparecerá para outros
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simulação do cartão em um dispositivo móvel */}
              <div
                className="mx-auto max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
                style={{
                  ["--primary" as any]: BRAND.primary,
                  ["--primary-dark" as any]: BRAND.primaryDark,
                  ["--accent" as any]: BRAND.accent,
                  ["--bg" as any]: BRAND.bg,
                }}
              >
                {/* Header do cartão */}
                <div
                  className="px-6 py-8 text-white text-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)`,
                  }}
                >
                  <div className="relative z-10">
                    <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                      {profile.name.charAt(0)}
                    </div>
                    <h1 className="text-xl font-bold mb-1">{profile.name}</h1>
                    <p className="text-white/90 text-sm">{profile.role}</p>
                    {profile.company && (
                      <p className="text-white/80 text-xs mt-1">
                        {profile.company}
                      </p>
                    )}
                  </div>
                  {/* Decoração de fundo */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                </div>

                {/* Botões de ação */}
                <div className="p-6 grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${profile.phone.replace(/\s|\(|\)|-/g, "")}`}
                    className="group"
                  >
                    <div className="w-full h-11 bg-brand-bg flex items-center justify-center rounded-2xl ring-1 ring-black/5 hover:ring-2">
                      <Phone className="w-4 h-4 mr-2" /> Ligar
                    </div>
                  </a>
                  <a
                    href={`https://wa.me/${profile.whatsapp.replace(
                      /\D/g,
                      ""
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group"
                  >
                    <div className="w-full h-11 bg-brand-bg flex items-center justify-center rounded-2xl ring-1 ring-black/5 hover:ring-2">
                      <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                    </div>
                  </a>
                  <a href={`mailto:${profile.email}`} className="group">
                    <div className="w-full h-11 bg-brand-bg flex items-center justify-center rounded-2xl ring-1 ring-black/5 hover:ring-2">
                      <Mail className="w-4 h-4 mr-2" /> E-mail
                    </div>
                  </a>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="group"
                  >
                    <div className="w-full h-11 bg-brand-bg flex items-center justify-center rounded-2xl ring-1 ring-black/5 hover:ring-2">
                      <Globe className="w-4 h-4 mr-2" /> Site
                    </div>
                  </a>
                </div>

                {/* Seções */}
                <div className="px-6 pb-6 space-y-4">
                  <Card className="border-0 bg-brand-bg rounded-2xl">
                    <CardContent className="p-4 text-sm text-gray-700">
                      {profile.about}
                    </CardContent>
                  </Card>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Card className="border-0 bg-brand-bg rounded-2xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Contato</CardTitle>
                        <CardDescription>Toque para copiar</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 space-y-2 text-sm">
                        <button
                          className="flex items-center gap-2 hover:underline"
                          onClick={() => copyToClipboard(profile.phone)}
                        >
                          <Phone className="w-3 h-3" />
                          {profile.phone}
                        </button>
                        <button
                          className="flex items-center gap-2 hover:underline"
                          onClick={() => copyToClipboard(profile.email)}
                        >
                          <Mail className="w-3 h-3" />
                          {profile.email}
                        </button>
                        {profile.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {profile.address}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-0 bg-brand-bg rounded-2xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Links</CardTitle>
                        <CardDescription>Acesso rápido</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 space-y-2 text-sm">
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Globe className="w-3 h-3" />
                          Website
                        </a>
                        <a
                          href={`https://wa.me/${profile.whatsapp.replace(
                            /\D/g,
                            ""
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 hover:underline"
                        >
                          <MessageSquare className="w-3 h-3" />
                          WhatsApp
                        </a>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
              <CardDescription>
                Compartilhe ou baixe seu cartão digital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={shareCard} className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar Cartão
              </Button>
              <Button
                onClick={() => downloadVCard(profile)}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar vCard
              </Button>
              <Button
                onClick={() => copyToClipboard(shareUrl)}
                variant="outline"
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>Escaneie para acessar o cartão</CardDescription>
            </CardHeader>
            <CardContent>
              <Card className="border-0 bg-brand-bg rounded-2xl flex items-center justify-center">
                <CardContent className="p-6">
                  <QRCodeSVG
                    value={shareUrl}
                    size={200}
                    bgColor="transparent"
                    fgColor={BRAND.accent}
                    level="M"
                  />
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CSS customizado para o preview */}
      <style jsx>{`
        .card-preview {
          --primary: ${BRAND.primary};
          --primary-dark: ${BRAND.primaryDark};
          --accent: ${BRAND.accent};
          --bg: ${BRAND.bg};
        }
        .card-preview .bg-primary {
          background: var(--primary);
        }
        .card-preview .bg-bg {
          background: var(--bg);
        }
      `}</style>
    </div>
  );
}
