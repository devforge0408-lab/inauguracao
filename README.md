# Inauguração Floresça 🌷

Aplicação web para confirmação de presença (RSVP) e gestão de vagas na inauguração do espaço Floresça — Método Floresça.

Construído com:
- **Node.js** & **Next.js 15** (App Router)
- **React 19**, **Tailwind CSS**, **Lucide React**
- **Firebase Firestore** (persistência em tempo real, transações de reserva e controle de capacidade de vagas)
- **Firebase App Hosting** (hospedagem e escalabilidade automática)

---

## 🚀 Como Rodar Localmente

### 1. Pré-requisitos
- Node.js (v18+ ou v20+)
- npm

### 2. Instalação das dependências
```bash
npm install
```

### 3. Configuração do Firebase
1. Crie um projeto no [Console do Firebase](https://console.firebase.google.com/).
2. Ative o **Cloud Firestore** em modo de produção (ou teste) no console.
3. Copie as credenciais da Web App nas configurações do projeto.
4. Crie o arquivo `.env.local` na raiz baseado no `.env.example`:
```bash
cp .env.example .env.local
```
Preencha as variáveis em `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

### 4. Executar em desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### 5. Build e Execução de Produção
```bash
npm run build
npm run start
```

---

## ☁️ Deploy com Firebase App Hosting

O projeto já inclui o arquivo `apphosting.yaml` e `firebase.json` configurados para o Firebase App Hosting.

1. Instale o Firebase CLI (caso ainda não possua):
   ```bash
   npm install -g firebase-tools
   ```
2. Faça login e inicialize o App Hosting:
   ```bash
   firebase login
   firebase apphosting:backends:create
   ```
3. Ou conecte seu repositório GitHub diretamente pelo Console do Firebase em **Build > App Hosting**.
4. Configure as variáveis de ambiente no console do Firebase / App Hosting Secrets.

---

## 🔒 Regras do Firestore (`firestore.rules`)
As regras de segurança estão definidas em `firestore.rules`.
Para publicar as regras:
```bash
firebase deploy --only firestore:rules
```
