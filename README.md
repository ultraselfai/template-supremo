# Decode Console

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Decode Console** é um dashboard multi-tenant SaaS construído com Next.js 16, Prisma 7 e Better-Auth.

> 🏗️ **Em Desenvolvimento** - Este projeto está sendo construído como parte do ecossistema Decode.

---

## 🚀 Tech Stack

| Categoria | Tecnologia |
|-----------|------------|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Runtime** | React 19.2 |
| **Linguagem** | TypeScript 5 |
| **Estilização** | Tailwind CSS v4 |
| **Componentes** | shadcn/ui v3 + Radix UI |
| **Banco de Dados** | PostgreSQL 17 |
| **ORM** | Prisma 7 (com adapter) |
| **Autenticação** | Better-Auth 1.4 |
| **Cache** | Redis |
| **Gerenciador** | pnpm |

---

## 📁 Arquitetura

O projeto segue uma **Feature-Based Architecture**:

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Páginas de autenticação
│   ├── (dashboard)/        # Páginas do dashboard
│   └── api/                # API Routes
├── components/             # Componentes compartilhados
│   ├── ui/                 # shadcn/ui components
│   └── layout/             # Layout components
├── features/               # Features isoladas
│   ├── auth/               # Feature de autenticação
│   └── projects/           # Feature de projetos
├── db/                     # Database client
├── lib/                    # Utilitários
└── hooks/                  # Custom hooks
```

---

## 🛠️ Setup Local

### Pré-requisitos

- Node.js 18+
- pnpm
- Docker e Docker Compose

### 1. Clone e Instale

```bash
git clone https://github.com/ultraselfai/template-supremo.git
cd template-supremo
pnpm install
```

### 2. Configure o Ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas configurações.

### 3. Inicie os Serviços

```bash
# Inicia PostgreSQL e Redis
docker-compose up -d

# Aplica migrations
pnpm prisma migrate dev

# Inicia o servidor
pnpm dev
```

**Acesse:** http://localhost:3000

---

## 📋 Scripts Disponíveis

```bash
pnpm dev          # Servidor de desenvolvimento
pnpm build        # Build de produção
pnpm start        # Inicia em produção
pnpm lint         # Lint do código

# Prisma
pnpm prisma studio    # Interface visual do banco
pnpm prisma migrate dev   # Aplica migrations
pnpm prisma generate      # Gera client
```

---

## 🔐 Autenticação

O projeto usa **Better-Auth** com os seguintes plugins:

- **Organization** - Multi-tenancy (subdomínios por tenant)
- **Two-Factor** - Autenticação de dois fatores
- **Next.js Cookies** - Integração nativa

### Endpoints de Auth

| Endpoint | Descrição |
|----------|-----------|
| `POST /api/auth/sign-up/email` | Criar conta |
| `POST /api/auth/sign-in/email` | Login |
| `POST /api/auth/sign-out` | Logout |
| `GET /api/auth/session` | Sessão atual |
| `GET /api/auth/ok` | Health check |

---

## 🗃️ Banco de Dados

### Modelos Principais

- **User** - Usuários do sistema
- **Session** - Sessões ativas
- **Account** - Contas de login (email, OAuth)
- **Organization** - Tenants (multi-tenancy)
- **Member** - Membros de uma organização
- **Invitation** - Convites pendentes
- **TwoFactor** - Configuração de 2FA

### Prisma 7

O projeto usa Prisma 7 com adapter PostgreSQL:

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

---

## 🐳 Docker

```yaml
services:
  postgres:
    image: postgres:17-alpine
    ports: ["5432:5432"]
    
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

```bash
docker-compose up -d      # Inicia serviços
docker-compose down       # Para serviços
docker-compose logs -f    # Ver logs
```

---

## 📄 Licença

MIT License - Veja [LICENSE](LICENSE) para detalhes.

---

<div align="center">

**Desenvolvido por [Decode](https://decode.app)**

</div>
