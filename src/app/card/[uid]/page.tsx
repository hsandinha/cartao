"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Globe,
  Linkedin,
  Instagram,
  MapPin,
  MessageSquare,
  Download,
  FileDown,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print";

const BRAND = {
  primary: "#0066FF",
  primaryDark: "#0152CC",
  accent: "#111827",
  bg: "#F5F7FB",
};

interface Profile {
  name: string;
  email: string;
  phone: string;
  role: string;
  website: string;
  linkedin: string;
  instagram: string;
  address: string[];
  about: string;
  photoUrl: string;
  photoZoom: number;
  photoOffsetX: number;
  photoOffsetY: number;
}

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");
const asUrl = (u: string) =>
  u ? (u.startsWith("http") ? u : `https://${u}`) : "";

function toVCard(p: Profile) {
  const addresses = Array.isArray(p.address) ? p.address.filter(Boolean) : [];
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${p.name};;;;`,
    `FN:${p.name}`,
    p.role ? `TITLE:${p.role}` : null,
    p.phone ? `TEL;TYPE=CELL:${p.phone}` : null,
    p.email ? `EMAIL;TYPE=INTERNET:${p.email}` : null,
    ...addresses.map((addr: string) => `ADR;TYPE=WORK:;;${addr}`),
    p.website ? `URL:${asUrl(p.website)}` : null,
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

function downloadVCard(profile: Profile) {
  const vcard = toVCard(profile);
  const blob = new Blob([vcard], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${profile.name}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PublicCardPage() {
  const params = useParams<{ uid: string }>();
  const uid = params?.uid;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const shareUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/card/${uid}`;
    }
    return "";
  }, [uid]);

  useEffect(() => {
    const run = async () => {
      if (!uid) return;
      setLoading(true);
      try {
        const ref = doc(db, "profiles", uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            role: data.role || "",
            website: data.website || "",
            linkedin: data.linkedin || "",
            instagram: data.instagram || "",
            address:
              Array.isArray(data.address) && data.address.length > 0
                ? data.address
                : data.address
                ? [data.address]
                : [],
            about: data.about || "",
            photoUrl: data.photoUrl || "",
            photoZoom: data.photoZoom || 1,
            photoOffsetX: data.photoOffsetX || 0,
            photoOffsetY: data.photoOffsetY || 0,
          } as Profile);
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error(e);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [uid]);

  // ====== PDF (igual ao card) ======
  const cardRef = useRef<HTMLDivElement>(null);

  // px -> mm (96 dpi como base comum dos browsers)
  const pxToMm = (px: number) => (px * 25.4) / 96;

  // CSS dinâmico do @page com base no tamanho real do card
  const [pageCss, setPageCss] = useState<string>(`
    @page { margin: 0; }
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      html, body { background: white; margin: 0 !important; padding: 0 !important; }
      .no-print { display: none !important; }
      .print-card { box-shadow: none !important; }
      .print-wrap { margin: 0 !important; padding: 0 !important; width: auto !important; }
    }
  `);

  // mede o card sempre que ele existir/mudar e ajusta o @page size
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // espera um tick para layout estabilizar (fonts/imagens)
    const id = window.requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const wmm = pxToMm(rect.width).toFixed(2);
      const hmm = pxToMm(rect.height).toFixed(2);
      setPageCss(`
        @page { size: ${wmm}mm ${hmm}mm; margin: 0; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body { background: white; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-card { box-shadow: none !important; }
          .print-wrap { margin: 0 !important; padding: 0 !important; width: auto !important; }
        }
      `);
    });

    return () => window.cancelAnimationFrame(id);
  }, [profile]);

  const handlePrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: profile ? `Cartão - ${profile.name}` : "Cartão Digital",
    onAfterPrint: () => {
      // opcional
    },
    pageStyle: pageCss, // usa CSS calculado para @page size
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Carregando…
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cartão não encontrado.</p>
      </div>
    );
  }

  const avatarTransform: React.CSSProperties = {
    transform: `translate(${profile.photoOffsetX}px, ${
      profile.photoOffsetY
    }px) scale(${profile.photoZoom || 1})`,
    transformOrigin: "center",
  };

  return (
    <div className="min-h-screen bg-gray-50 print-wrap">
      {/* não precisamos de <style> fixo; o useReactToPrint injeta pageStyle */}

      <div className="max-w-xl mx-auto p-6 space-y-4">
        {/* Topo com ações (some no PDF) */}
        <div className="flex items-center justify-center no-print">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => downloadVCard(profile)}
              className="h-9 px-3 text-sm"
              title="Baixar vCard"
            >
              <Download className="w-4 h-4 mr-1" />
              vCard
            </Button>
            <Button
              onClick={handlePrint}
              className="h-9 px-3 text-sm"
              title="Baixar PDF"
            >
              <FileDown className="w-4 h-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>

        {/* ====== CARD (o que vai pro PDF) ====== */}
        <div
          ref={cardRef}
          style={
            {
              "--primary": BRAND.primary,
              "--primary-dark": BRAND.primaryDark,
              "--accent": BRAND.accent,
              "--bg": BRAND.bg,
            } as React.CSSProperties &
              Record<
                "--primary" | "--primary-dark" | "--accent" | "--bg",
                string
              >
          }
        >
          <div className="mx-auto max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden print-card">
            {/* HERO */}
            <div
              className="px-6 pt-8 pb-12 text-white text-center relative overflow-hidden"
              style={{
                backgroundImage: "url('/fundo.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                className="absolute inset-0"
                style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              />
              <div className="relative z-10">
                <div className="relative w-24 h-24 rounded-full ring-4 ring-white overflow-hidden bg-white shadow mx-auto mb-3">
                  {profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt="Avatar"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={avatarTransform}
                    />
                  ) : (
                    <div className="w-full h-full bg-white text-[32px] text-[color:var(--accent)] flex items-center justify-center font-bold">
                      {profile.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
                <p className="text-white/90 text-sm">{profile.role}</p>
              </div>
            </div>

            {/* AÇÕES */}
            <div className="p-6 grid grid-cols-3 gap-3">
              {profile.phone && (
                <a
                  href={`tel:${onlyDigits(profile.phone)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-11 inline-flex items-center justify-center rounded-2xl ring-1 ring-black/5 hover:ring-2 transition"
                  style={{ backgroundColor: "var(--bg)" }}
                >
                  <Phone className="w-4 h-4 mr-2" /> Ligar
                </a>
              )}

              {profile.phone && (
                <a
                  href={`https://wa.me/${onlyDigits(profile.phone)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-11 inline-flex items-center justify-center rounded-2xl ring-1 ring-black/5 hover:ring-2 transition"
                  style={{ backgroundColor: "var(--bg)" }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                </a>
              )}

              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="w-full h-11 inline-flex items-center justify-center rounded-2xl ring-1 ring-black/5 hover:ring-2 transition"
                  style={{ backgroundColor: "var(--bg)" }}
                >
                  <Mail className="w-4 h-4 mr-2" /> E-mail
                </a>
              )}
            </div>

            {/* SOBRE */}
            {profile.about && (
              <div className="px-6 pb-0">
                <div
                  className="rounded-2xl text-sm text-gray-700 ring-1 ring-black/5 p-4"
                  style={{ backgroundColor: "var(--bg)" }}
                >
                  {profile.about}
                </div>
              </div>
            )}

            {/* CONTATO & LINKS */}
            <div className="px-6 pb-6 pt-6 grid sm:grid-cols-1 gap-4">
              <div
                className="rounded-2xl ring-1 ring-black/5"
                style={{ backgroundColor: "var(--bg)" }}
              >
                <div className="p-4">
                  <p className="font-semibold text-gray-900 mb-1">Contato</p>
                  <div className="space-y-1 text-sm">
                    <div>
                      {profile.phone && (
                        <a
                          href={`tel:${onlyDigits(profile.phone)}`}
                          className="inline-flex items-center gap-2 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {profile.phone}
                        </a>
                      )}
                    </div>
                    <div>
                      {profile.email && (
                        <a
                          href={`mailto:${profile.email}`}
                          className="inline-flex items-center gap-2 hover:underline"
                        >
                          <Mail className="w-3 h-3" />
                          {profile.email}
                        </a>
                      )}
                    </div>
                    <div>
                      {profile.address && profile.address.length > 0 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="space-y-1">
                            {profile.address.map((addr, index) => (
                              <div key={index} className="text-sm">
                                {addr}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl ring-1 ring-black/5"
                style={{ backgroundColor: "var(--bg)" }}
              >
                <div className="p-4">
                  <p className="font-semibold text-gray-900 mb-1">Links</p>
                  <div className="flex gap-3 text-sm">
                    {profile.website && (
                      <a
                        href={asUrl(profile.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:underline"
                      >
                        <Globe className="w-4 h-4" />
                        Website
                      </a>
                    )}

                    {profile.linkedin && (
                      <a
                        href={asUrl(profile.linkedin)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        <Linkedin className="w-3 h-3" />
                        LinkedIn
                      </a>
                    )}

                    {profile.instagram && (
                      <a
                        href={asUrl(profile.instagram)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        <Instagram className="w-3 h-3" />
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* QR */}
            <div className="px-6 pb-6 flex items-center justify-center">
              {shareUrl && (
                <QRCodeSVG
                  value={shareUrl}
                  size={96}
                  bgColor="transparent"
                  fgColor={BRAND.accent}
                  level="M"
                />
              )}
            </div>
          </div>
        </div>
        {/* ====== FIM do CARD ====== */}
      </div>
    </div>
  );
}
