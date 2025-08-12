#!/usr/bin/env node

// Script para testar conectividade Firebase fora do Next.js
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, getDoc } = require("firebase/firestore");

// Configuração do Firebase (substitua pelos seus valores)
const firebaseConfig = {
  apiKey: "AIzaSyD--SWBUS5v7Qj1-KSOam7VEy1w7lR2ObU",
  authDomain: "cartao-94fa8.firebaseapp.com",
  projectId: "cartao-94fa8",
  storageBucket: "cartao-94fa8.firebasestorage.app",
  messagingSenderId: "350348390931",
  appId: "1:350348390931:web:a759c0018437360cb305e6",
};

async function testConnection() {
  console.log("🔍 Testando conectividade Firebase...");

  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);

    // Usar o banco de dados específico "cartao"
    const db = getFirestore(app, "cartao");

    console.log("✅ Firebase inicializado");
    console.log("📡 Project ID:", firebaseConfig.projectId);
    console.log("🗄️  Database: cartao");

    // Teste de escrita
    console.log("📝 Testando escrita...");
    const testRef = doc(db, "connection-test", "node-test");
    await setDoc(testRef, {
      message: "Teste de conectividade via Node.js",
      timestamp: new Date().toISOString(),
      environment: "node",
      database: "cartao",
    });
    console.log("✅ Escrita bem-sucedida");

    // Teste de leitura
    console.log("📖 Testando leitura...");
    const snap = await getDoc(testRef);
    if (snap.exists()) {
      console.log("✅ Leitura bem-sucedida:", snap.data());
    } else {
      console.log("❌ Documento não encontrado");
    }

    console.log("🎉 Teste concluído com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro durante o teste:", error.message);
    console.error("Código do erro:", error.code);

    if (error.code === "unavailable") {
      console.log("\n🔍 Possíveis soluções:");
      console.log("1. Verifique sua conexão com a internet");
      console.log("2. Verifique se as credenciais Firebase estão corretas");
      console.log("3. Verifique se o projeto Firebase existe e está ativo");
      console.log('4. Verifique se o banco de dados "cartao" existe');
    }

    if (error.code === "permission-denied") {
      console.log("\n🔍 Problema de permissão:");
      console.log("1. Verifique as regras de segurança do Firestore");
      console.log(
        "2. Este teste não usa autenticação - pode ser necessário ajustar as regras"
      );
    }

    process.exit(1);
  }
}

testConnection();
