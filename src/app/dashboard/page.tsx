"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  User as UserIcon,
  Mail,
  Phone,
  Globe,
  Download,
  Share2,
  LogOut,
  Save,
  ExternalLink,
  Trash2,
  Crop,
} from "lucide-react";

import QRCodeLib from "qrcode";
import Image from "next/image";

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
  photoOffsetX: number; // px
  photoOffsetY: number; // px
}

const DEFAULT_PROFILE: Profile = {
  name: "",
  email: "",
  phone: "",
  role: "",
  website: "",
  linkedin: "",
  instagram: "",
  address: [], // Already set as an empty array as requested
  about: "",
  photoUrl: "",
  photoZoom: 1,
  photoOffsetX: 0,
  photoOffsetY: 0,
};

const UNIDADES = [
  {
    id: "sion",
    nome: "Unidade Sion",
    endereco: "R. Califórnia, 200",
  },
  {
    id: "cidade-nova",
    nome: "Unidade Cidade Nova",
    endereco: "R. Dr. Júlio Otaviano Ferreira, 620",
  },
];

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");

  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  // upload / edição de foto
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(false);

  // helpers
  const onlyDigits = (s: string) => s.replace(/\D/g, "");
  const asUrl = (u: string) =>
    u ? (u.startsWith("http") ? u : `https://${u}`) : "";

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      const docRef = doc(db, "profiles", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<Profile>;
        // merge com defaults + fallback do auth
        setProfile({
          ...DEFAULT_PROFILE,
          ...data,
          name: data.name ?? (user.displayName || ""),
          email: data.email ?? (user.email || ""),
          photoUrl: data.photoUrl ?? "",
          address: Array.isArray(data.address)
            ? data.address
            : data.address
            ? [data.address]
            : [],
          photoZoom: typeof data.photoZoom === "number" ? data.photoZoom : 1,
          photoOffsetX:
            typeof data.photoOffsetX === "number" ? data.photoOffsetX : 0,
          photoOffsetY:
            typeof data.photoOffsetY === "number" ? data.photoOffsetY : 0,
        });
        console.log("✅ Perfil carregado:", data);
      } else {
        setProfile({
          ...DEFAULT_PROFILE,
          name: user.displayName || "",
          email: user.email || "",
        });
      }
    } catch (error) {
      console.error("❌ Erro ao carregar perfil:", error);
    }
  }, [user]);

  const generateQRCode = useCallback(async () => {
    if (!user || !profile.name) return;

    try {
      const url = `${window.location.origin}/card/${user.uid}`;
      const qrCodeDataUrl = await QRCodeLib.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setQrCode(qrCodeDataUrl);
    } catch (err) {
      console.error(err);
    }
  }, [user, profile.name]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/");
      } else {
        setUser(u);
        console.log("👤 Usuário autenticado:", u.uid, u.email);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (user) loadProfile();
  }, [user, loadProfile]);

  // gere QR code apenas quando nome existir/mudar
  useEffect(() => {
    if (user && profile.name) generateQRCode();
  }, [user, profile.name, generateQRCode]);

  const openFilePicker = () => fileInputRef.current?.click();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    const file = e.target.files[0];

    // preview local imediato
    const localUrl = URL.createObjectURL(file);
    setProfile((p) => ({ ...p, photoUrl: localUrl }));

    if (file.size > 2 * 1024 * 1024) {
      alert("Envie uma imagem até 2MB.");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const path = `avatars/${user.uid}/${Date.now()}_${file.name}`;
      console.log("Storage Path:", path);
      console.log("User UID:", user.uid);
      console.log("File Size:", file.size);

      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      console.log("Upload URL:", url);

      // Atualizar o perfil com a nova URL da foto
      const updatedProfile = { ...profile, photoUrl: url };
      setProfile(updatedProfile);

      // Salvar automaticamente no Firestore
      const docRef = doc(db, "profiles", user.uid);
      await setDoc(docRef, updatedProfile);
      console.log("✅ Foto salva no perfil automaticamente");

      URL.revokeObjectURL(localUrl);
    } catch (err) {
      console.error("❌ Erro ao subir foto:", err);
      alert("Não foi possível enviar a foto.");
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = ""; // permite reenviar o mesmo arquivo
    }
  };

  const removePhoto = () => {
    setProfile((p) => ({
      ...p,
      photoUrl: "",
      photoZoom: 1,
      photoOffsetX: 0,
      photoOffsetY: 0,
    }));
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const docRef = doc(db, "profiles", user.uid);
      await setDoc(docRef, profile);
      console.log("✅ Perfil salvo com sucesso");

      const button = document.querySelector("[data-save-button]");
      if (button) {
        button.textContent = "✅ Salvo!";
        setTimeout(() => {
          button.textContent = "💾 Salvar Perfil";
        }, 2000);
      }
    } catch (error) {
      console.error("❌ Erro ao salvar perfil:", error);
      alert("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("❌ Erro ao fazer logout:", error);
    }
  };

  const shareCard = async () => {
    if (!user) return;
    const cardUrl = `${window.location.origin}/card/${user.uid}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cartão Digital - ${profile.name}`,
          text: `Confira meu cartão digital!`,
          url: cardUrl,
        });
      } catch {
        console.log("Compartilhamento cancelado");
      }
    } else {
      try {
        await navigator.clipboard.writeText(cardUrl);
        alert("Link copiado para a área de transferência!");
      } catch (error) {
        console.error("❌ Erro ao copiar link:", error);
      }
    }
  };

  const toVCard = (p: Profile) => {
    const addresses = p.address.filter(Boolean);
    const addressLines = addresses
      .map((addr) => `ADR;TYPE=WORK:;;${addr};;;;`)
      .join("\n");

    return `BEGIN:VCARD
VERSION:3.0
FN:${p.name}
ORG:
TITLE:${p.role}
EMAIL:${p.email}
TEL:${p.phone}
URL:${asUrl(p.website)}
${addressLines}
NOTE:${p.about}
END:VCARD`;
  };

  const downloadVCard = (p: Profile) => {
    const vcard = toVCard(p);
    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${p.name.replace(/\s+/g, "_")}_cartao.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Cartão Digital
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Image
                  src={user?.photoURL || "/default-avatar.svg"}
                  alt="Avatar"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/default-avatar.svg";
                  }}
                />
                <span className="text-sm text-gray-700">
                  {user?.displayName}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm px-3 py-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Edição */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserIcon className="w-5 h-5" />
                  <span>Informações Pessoais</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nome Completo
                    </label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      E-mail
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Telefone / WhatsApp
                    </label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Cargo/Função
                    </label>
                    <Input
                      id="role"
                      value={profile.role}
                      onChange={(e) =>
                        setProfile({ ...profile, role: e.target.value })
                      }
                      placeholder="Seu cargo ou função"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="unidade"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Unidade
                  </label>
                  <select
                    id="unidade"
                    value={
                      profile.address.length > 0
                        ? UNIDADES.find((u) =>
                            profile.address[0]?.includes(u.nome)
                          )?.id || ""
                        : ""
                    }
                    onChange={(e) => {
                      const selectedUnidade = UNIDADES.find(
                        (u) => u.id === e.target.value
                      );
                      if (selectedUnidade) {
                        const fullAddress = `${selectedUnidade.nome} - ${selectedUnidade.endereco}`;
                        setProfile({
                          ...profile,
                          address: [fullAddress],
                        });
                      } else {
                        setProfile({
                          ...profile,
                          address: [],
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma unidade</option>
                    {UNIDADES.map((unidade) => (
                      <option key={unidade.id} value={unidade.id}>
                        {unidade.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="about"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sobre
                  </label>
                  <Textarea
                    id="about"
                    value={profile.about}
                    onChange={(e) =>
                      setProfile({ ...profile, about: e.target.value })
                    }
                    placeholder="Fale um pouco sobre você ou sua empresa..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Redes Sociais & Links</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="website"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Site
                    </label>
                    <Input
                      id="website"
                      value={profile.website}
                      onChange={(e) =>
                        setProfile({ ...profile, website: e.target.value })
                      }
                      placeholder="seusite.com"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="linkedin"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      LinkedIn
                    </label>
                    <Input
                      id="linkedin"
                      value={profile.linkedin}
                      onChange={(e) =>
                        setProfile({ ...profile, linkedin: e.target.value })
                      }
                      placeholder="linkedin.com/in/seuperfil"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="instagram"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Instagram
                    </label>
                    <Input
                      id="instagram"
                      value={profile.instagram}
                      onChange={(e) =>
                        setProfile({ ...profile, instagram: e.target.value })
                      }
                      placeholder="instagram.com/seuperfil"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={saveProfile}
              disabled={saving}
              className="w-full"
              data-save-button
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "💾 Salvar Perfil"}
            </Button>
          </div>

          {/* Preview do Cartão */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Preview do Cartão</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Visualização
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {/* Header com fundo + avatar + botões */}
                  <div className="relative px-6 pt-8 pb-10 text-center text-white bg-[url('/fundo.jpg')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative flex flex-col items-center">
                      <div className="relative w-20 h-20 rounded-full ring-4 ring-white overflow-hidden bg-white shadow mb-3">
                        {profile.photoUrl || user?.photoURL ? (
                          <Image
                            src={profile.photoUrl || (user?.photoURL as string)}
                            alt="Foto de perfil"
                            fill
                            sizes="80px"
                            style={{
                              objectFit: "cover",
                              transform: `translate(${profile.photoOffsetX}px, ${profile.photoOffsetY}px) scale(${profile.photoZoom})`,
                              transformOrigin: "center",
                            }}
                            className="absolute inset-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-500 flex items-center justify-center text-2xl font-bold">
                            {(profile.name || user?.displayName || "H")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        {/* Status de upload */}
                        {isUploadingPhoto && (
                          <div className="absolute inset-0 bg-black/40 text-white text-xs flex items-center justify-center">
                            Enviando…
                          </div>
                        )}
                      </div>

                      {/* Ações da foto */}
                      <div className="flex gap-2 mb-2">
                        <Button
                          onClick={openFilePicker}
                          className="h-8 px-3 text-sm bg-white/90 text-gray-900 hover:bg-white"
                        >
                          Carregar foto
                        </Button>
                        {profile.photoUrl && (
                          <>
                            <Button
                              onClick={() => setEditingPhoto((v) => !v)}
                              variant="outline"
                              className="h-8 px-3 text-sm bg-white/80 hover:bg-white"
                            >
                              <Crop className="w-4 h-4 mr-1" />{" "}
                              {editingPhoto ? "Fechar edição" : "Editar"}
                            </Button>
                            <Button
                              onClick={removePhoto}
                              variant="outline"
                              className="h-8 px-3 text-sm bg-white/80 hover:bg-white"
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Remover
                            </Button>
                          </>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />

                      <h2 className="text-xl font-bold mb-1">
                        {profile.name || user?.displayName || "Seu Nome"}
                      </h2>
                      <p className="text-blue-100 text-sm">
                        {profile.role || "Seu Cargo"}
                      </p>

                      {/* Painel simples de edição (zoom/posição) */}
                      {editingPhoto && profile.photoUrl && (
                        <div className="mt-3 w-full max-w-xs bg-white/90 rounded-lg p-3 text-gray-800 shadow">
                          <div className="grid gap-3">
                            <label className="text-xs font-medium text-gray-600">
                              Zoom:{" "}
                              <span className="tabular-nums">
                                {profile.photoZoom.toFixed(2)}x
                              </span>
                            </label>
                            <input
                              type="range"
                              min={1}
                              max={2.5}
                              step={0.05}
                              value={profile.photoZoom}
                              onChange={(e) =>
                                setProfile((p) => ({
                                  ...p,
                                  photoZoom: Number(e.target.value),
                                }))
                              }
                            />

                            <label className="text-xs font-medium text-gray-600">
                              Posição X: {profile.photoOffsetX}px
                            </label>
                            <input
                              type="range"
                              min={-40}
                              max={40}
                              step={1}
                              value={profile.photoOffsetX}
                              onChange={(e) =>
                                setProfile((p) => ({
                                  ...p,
                                  photoOffsetX: Number(e.target.value),
                                }))
                              }
                            />

                            <label className="text-xs font-medium text-gray-600">
                              Posição Y: {profile.photoOffsetY}px
                            </label>
                            <input
                              type="range"
                              min={-40}
                              max={40}
                              step={1}
                              value={profile.photoOffsetY}
                              onChange={(e) =>
                                setProfile((p) => ({
                                  ...p,
                                  photoOffsetY: Number(e.target.value),
                                }))
                              }
                            />
                          </div>
                          <p className="mt-2 text-[11px] text-gray-600">
                            * Este recorte é visual (não altera o arquivo
                            original). Para “gravar” o recorte na imagem, posso
                            implementar export via canvas depois.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="px-6 py-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        onClick={() => {
                          const f = onlyDigits(profile.phone);
                          if (f) window.open(`tel:${f}`);
                        }}
                        className="flex items-center justify-center space-x-2 py-2 px-3 bg-white rounded-lg border text-sm hover:bg-gray-50"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Ligar</span>
                      </button>
                      <button
                        onClick={() => {
                          const f = onlyDigits(profile.phone);
                          if (f) window.open(`https://wa.me/${f}`);
                        }}
                        className="flex items-center justify-center space-x-2 py-2 px-3 bg-white rounded-lg border text-sm hover:bg-gray-50"
                      >
                        <span className="text-green-600">📱</span>
                        <span>WhatsApp</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() =>
                          profile.email &&
                          window.open(`mailto:${profile.email}`)
                        }
                        className="flex items-center justify-center space-x-2 py-2 px-3 bg-white rounded-lg border text-sm hover:bg-gray-50"
                      >
                        <Mail className="w-4 h-4" />
                        <span>E-mail</span>
                      </button>
                      <button
                        onClick={() =>
                          profile.website &&
                          window.open(asUrl(profile.website), "_blank")
                        }
                        className="flex items-center justify-center space-x-2 py-2 px-3 bg-white rounded-lg border text-sm hover:bg-gray-50"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Site</span>
                      </button>
                    </div>
                  </div>

                  {/* Sobre */}
                  {profile.about && (
                    <div className="px-6 py-4 border-t">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {profile.about}
                      </p>
                    </div>
                  )}

                  {/* Contato e Links */}
                  <div className="px-6 py-4 border-t">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Contato
                        </h4>
                        <div className="space-y-2">
                          {profile.phone && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                {profile.phone}
                              </span>
                            </div>
                          )}
                          {profile.email && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600 truncate">
                                {profile.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Links
                        </h4>
                        <div className="space-y-2 text-sm">
                          {profile.website && (
                            <a
                              href={asUrl(profile.website)}
                              target="_blank"
                              className="flex items-center space-x-2 text-blue-600 hover:underline"
                            >
                              <Globe className="w-4 h-4 text-gray-400" />
                              <span className="truncate">
                                {asUrl(profile.website)}
                              </span>
                            </a>
                          )}
                          {profile.linkedin && (
                            <a
                              href={asUrl(profile.linkedin)}
                              target="_blank"
                              className="flex items-center space-x-2 text-blue-600 hover:underline"
                            >
                              <Globe className="w-4 h-4 text-gray-400" />
                              <span className="truncate">LinkedIn</span>
                            </a>
                          )}
                          {profile.instagram && (
                            <a
                              href={asUrl(profile.instagram)}
                              target="_blank"
                              className="flex items-center space-x-2 text-blue-600 hover:underline"
                            >
                              <Globe className="w-4 h-4 text-gray-400" />
                              <span className="truncate">Instagram</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR CODE */}
                  {qrCode && (
                    <div className="px-6 py-5 border-t bg-gray-50 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <Image
                          src={qrCode}
                          alt="QR Code do Cartão"
                          width={112}
                          height={112}
                          className="w-28 h-28"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          Aponte a câmera para abrir seu cartão
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ações do Cartão */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={shareCard}
                    className="flex items-center space-x-2 text-sm px-3 py-1"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Compartilhar</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => downloadVCard(profile)}
                    className="flex items-center space-x-2 text-sm px-3 py-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download vCard</span>
                  </Button>

                  {user && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(`/card/${user.uid}`, "_blank")}
                      className="flex items-center space-x-2 text-sm px-3 py-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Ver Cartão</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
