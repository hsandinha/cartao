import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function testFirebaseConnection() {
  try {
    console.log("Testando conexão com Firebase...");

    // Teste de escrita
    const testRef = doc(db, "test", "connection");
    await setDoc(testRef, {
      message: "Teste de conexão",
      timestamp: new Date(),
    });
    console.log("✅ Escrita no Firestore funcionando");

    // Teste de leitura
    const testSnap = await getDoc(testRef);
    if (testSnap.exists()) {
      console.log("✅ Leitura do Firestore funcionando:", testSnap.data());
    } else {
      console.log("❌ Documento não encontrado");
    }

    return true;
  } catch (error) {
    console.error("❌ Erro na conexão com Firebase:", error);
    return false;
  }
}
