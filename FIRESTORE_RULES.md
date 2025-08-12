# Configuração das Regras de Segurança do Firestore

## Problema Identificado

O Firestore por padrão vem com regras de segurança que bloqueiam todas as operações de leitura e escrita:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Solução: Regras para Usuários Autenticados

Para permitir que usuários autenticados leiam e escrevam seus próprios dados, você deve configurar as seguintes regras no Firebase Console:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto (`cartao-94fa8`)
3. Vá em "Firestore Database" > "Rules"
4. Substitua as regras existentes por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite que usuários autenticados leiam e escrevam apenas seus próprios perfis
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Permite teste de conexão (opcional - remover em produção)
    match /test/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Explicação das Regras

- `request.auth != null`: Verifica se o usuário está autenticado
- `request.auth.uid == userId`: Garante que o usuário só pode acessar seus próprios dados
- A coleção `profiles/{userId}` permite que cada usuário gerencie apenas seu próprio perfil
- A coleção `test` é opcional e serve para testar a conectividade

## Como Aplicar

1. Copie as regras acima
2. Cole no editor de regras do Firebase Console
3. Clique em "Publicar"
4. Teste a aplicação novamente

## Verificação

Após aplicar as regras, você deve ver nos logs do console:

- ✅ Escrita no Firestore funcionando
- ✅ Leitura do Firestore funcionando
- ✅ Perfil salvo com sucesso!
