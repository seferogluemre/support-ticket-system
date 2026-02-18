# 🚀 HelpDesk Pro - Başlangıç Rehberi

> **Eğitim Amaçlı Kapsamlı Geliştirme Rehberi**  
> Bu rehber, projeyi sıfırdan anlamak ve geliştirmeye başlamak için hazırlanmıştır.

---

## 📋 İçindekiler

1. [Proje Hakkında](#-proje-hakkında)
2. [Ön Gereksinimler](#-ön-gereksinimler)
3. [Kurulum Adımları](#-kurulum-adımları)
4. [Proje Yapısını Anlamak](#-proje-yapısını-anlamak)
5. [İlk Çalıştırma](#-i̇lk-çalıştırma)
6. [Geliştirme Ortamı](#-geliştirme-ortamı)
7. [Ticket System Geliştirme](#-ticket-system-geliştirme)
8. [Veritabanı İşlemleri](#-veritabanı-i̇şlemleri)
9. [API Geliştirme](#-api-geliştirme)
10. [Frontend Geliştirme](#-frontend-geliştirme)
11. [Testing](#-testing)
12. [Deployment](#-deployment)
13. [Sık Karşılaşılan Sorunlar](#-sık-karşılaşılan-sorunlar)
14. [Yararlı Komutlar](#-yararlı-komutlar)

---

## 🎯 Proje Hakkında

### Ne İnşa Ediyoruz?

**HelpDesk Pro**, Zendesk benzeri bir müşteri destek yönetim sistemidir. Ancak sıfırdan başlamıyoruz!

### Boilerplate Avantajı

Bu proje, güçlü bir **Turborepo + Bun + Elysia.js + React 19** boilerplate üzerine kurulu:

```
✅ Hazır Olan Sistemler:
├── Authentication (Better Auth)
├── Authorization (RBAC - Role Based Access Control)
├── Multi-tenancy (Company Management)
├── User Management
├── File Upload System
├── Audit Logs
├── WebSocket Infrastructure
└── Modern UI Components (Radix UI + Tailwind)

🎫 Ekleyeceğimiz Sistemler:
├── Ticket Management
├── Message System
├── Category & Tag System
├── Notification System
└── Analytics Dashboard
```

### Teknoloji Stack'i

| Kategori | Teknoloji | Neden? |
|----------|-----------|--------|
| **Runtime** | Bun | Node.js'ten 3x daha hızlı |
| **Monorepo** | Turborepo | Hızlı build ve cache sistemi |
| **Backend** | Elysia.js | Type-safe, ultra-fast web framework |
| **Frontend** | React 19 | En güncel React özellikleri |
| **Database** | PostgreSQL + Prisma | Type-safe ORM |
| **Auth** | Better Auth | Modern, güvenli authentication |
| **Routing** | TanStack Router | Type-safe routing |
| **State** | TanStack Query + Zustand | Server + Client state |
| **UI** | Tailwind CSS + Radix UI | Modern, accessible components |

---

## 🔧 Ön Gereksinimler

### 1. Bun Kurulumu

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Kurulumu kontrol et
bun --version  # v1.3.4 veya üzeri olmalı
```

### 2. PostgreSQL Kurulumu

**Seçenek A: Docker ile (Önerilen)**

```bash
# PostgreSQL container'ı başlat
docker run -d \
  --name helpdesk-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=helpdesk_db \
  -p 5432:5432 \
  postgres:16

# Container'ın çalıştığını kontrol et
docker ps
```

**Seçenek B: Local Kurulum**

- **macOS:** `brew install postgresql@16`
- **Windows:** [PostgreSQL Installer](https://www.postgresql.org/download/windows/)
- **Linux:** `sudo apt install postgresql-16`

### 3. IDE Kurulumu

**VS Code (Önerilen)**

```bash
# VS Code Extensions (önerilen)
code --install-extension biomejs.biome
code --install-extension Prisma.prisma
code --install-extension bradlc.vscode-tailwindcss
code --install-extension dbaeumer.vscode-eslint
```

### 4. Git Kurulumu

```bash
# Git versiyonunu kontrol et
git --version  # 2.x olmalı
```

---

## 📦 Kurulum Adımları

### Adım 1: Projeyi Klonla

```bash
# Repository'yi klonla
git clone <repository-url> helpdesk-pro
cd helpdesk-pro

# Veya mevcut klasördeysek
cd support-ticket-system
```

### Adım 2: Dependencies Kur

```bash
# Tüm workspace dependencies'leri kur
bun install

# Bu komut şunları yapar:
# - Root dependencies
# - apps/web dependencies
# - apps/api dependencies
# - packages/* dependencies
```

**Beklenen Çıktı:**
```
bun install v1.3.4
+ 1247 packages installed [5.23s]
```

### Adım 3: Environment Dosyalarını Oluştur

```bash
# API environment dosyası
cp config/apps/api/.env.example config/apps/api/.env

# Web environment dosyası
cp config/apps/web/.env.example config/apps/web/.env
```

**config/apps/api/.env dosyasını düzenle:**

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/helpdesk_db?schema=public"

# Better Auth
BETTER_AUTH_SECRET="your-super-secret-key-change-this-in-production"
BETTER_AUTH_URL="http://localhost:3000"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Email (geliştirme için opsiyonel)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@helpdesk.com"

# Server
PORT=3000
NODE_ENV=development
```

**config/apps/web/.env dosyasını düzenle:**

```env
# API Configuration
VITE_API_URL="http://localhost:3000"
VITE_WS_URL="ws://localhost:3000"

# App Configuration
VITE_APP_NAME="HelpDesk Pro"
VITE_APP_VERSION="1.0.0"
```

### Adım 4: Database Setup

```bash
# Database migration'ları çalıştır
cd packages/database
bun run prisma migrate dev

# Prisma Client'ı oluştur
bun run prisma generate

# (Opsiyonel) Seed data ekle
bun run prisma db seed
```

**Beklenen Çıktı:**
```
Prisma schema loaded from schema.prisma
Datasource "db": PostgreSQL database "helpdesk_db"

✔ Generated Prisma Client
✔ Applied migrations:
  └─ 20260219_init
```

### Adım 5: İlk Kullanıcıyı Oluştur

Seed script otomatik olarak test kullanıcıları oluşturur:

```
Email: admin@example.com
Password: Admin123!
Role: ADMIN

Email: agent@example.com
Password: Agent123!
Role: AGENT

Email: customer@example.com
Password: Customer123!
Role: CUSTOMER
```

---

## 📁 Proje Yapısını Anlamak

### Monorepo Yapısı

```
support-ticket-system/
│
├── apps/                          # Uygulamalar
│   ├── web/                       # Frontend (React 19 + Vite)
│   │   ├── src/
│   │   │   ├── routes/           # TanStack Router routes
│   │   │   │   ├── __root.tsx   # Root layout
│   │   │   │   ├── (auth)/       # Auth routes (login, signup)
│   │   │   │   └── _authenticated/ # Protected routes
│   │   │   │       ├── index.tsx  # Dashboard
│   │   │   │       ├── users/     # User management
│   │   │   │       ├── companies/ # Company management
│   │   │   │       └── tickets/   # 🎫 YENİ EKLENECEK
│   │   │   │
│   │   │   ├── components/       # React components
│   │   │   │   ├── ui/           # Radix UI wrappers
│   │   │   │   └── layout/       # Layout components
│   │   │   │
│   │   │   ├── lib/              # Utilities
│   │   │   │   ├── api.ts        # Eden Treaty API client
│   │   │   │   ├── auth/         # Auth utilities
│   │   │   │   └── router/       # Router guards
│   │   │   │
│   │   │   ├── stores/           # Zustand stores
│   │   │   └── hooks/            # Custom React hooks
│   │   │
│   │   └── package.json
│   │
│   └── api/                       # Backend (Elysia.js + Bun)
│       ├── src/
│       │   ├── modules/          # Feature modules
│       │   │   ├── auth/         # Authentication
│       │   │   │   ├── controller.ts
│       │   │   │   ├── index.ts
│       │   │   │   └── authorization/
│       │   │   │       ├── roles/
│       │   │   │       └── permissions/
│       │   │   │
│       │   │   ├── users/        # User management
│       │   │   │   ├── controller.ts
│       │   │   │   ├── service.ts
│       │   │   │   ├── dtos.ts
│       │   │   │   ├── formatters.ts
│       │   │   │   └── types.ts
│       │   │   │
│       │   │   ├── companies/    # Company management
│       │   │   ├── projects/     # Örnek CRUD modülü
│       │   │   └── tickets/      # 🎫 YENİ EKLENECEK
│       │   │
│       │   ├── core/             # Core functionality
│       │   ├── utils/            # Utilities
│       │   ├── seeders/          # Database seeders
│       │   └── index.ts          # Main entry point
│       │
│       └── package.json
│
├── packages/                      # Shared packages
│   ├── database/                 # Prisma schema & client
│   │   ├── schema.prisma         # Database schema
│   │   ├── client/               # Generated Prisma client
│   │   ├── prismabox/            # Generated TypeBox schemas
│   │   └── src/seeder/           # Seeding system
│   │
│   ├── eden/                     # Type-safe API client
│   │   └── index.ts              # Eden Treaty exports
│   │
│   └── tooling-config/           # Shared configs
│       └── tsconfig/             # TypeScript configs
│
├── config/                        # Environment configs
│   └── apps/
│       ├── web/.env              # Frontend env
│       └── api/.env              # Backend env
│
├── turbo.json                     # Turborepo config
├── package.json                   # Root package.json
├── biome.json                     # Biome config
└── README.md
```

### Modül Yapısı (Backend)

Her modül aynı pattern'i takip eder:

```typescript
modules/[module-name]/
├── controller.ts    // Route tanımları (Elysia endpoints)
├── service.ts       // Business logic
├── dtos.ts         // Zod validation schemas
├── formatters.ts   // Response formatters
├── types.ts        // TypeScript types
└── index.ts        // Module export
```

**Örnek: Users Modülü**

```typescript
// controller.ts - API endpoints
export const userController = new Elysia({ prefix: '/users' })
  .get('/', async () => {
    return await userService.list()
  })
  .get('/:uuid', async ({ params }) => {
    return await userService.getByUuid(params.uuid)
  })

// service.ts - Business logic
export const userService = {
  async list() {
    return await db.user.findMany()
  },
  async getByUuid(uuid: string) {
    return await db.user.findUnique({ where: { uuid } })
  }
}

// dtos.ts - Validation
export const createUserDto = t.Object({
  email: t.String({ format: 'email' }),
  firstName: t.String({ minLength: 2 }),
  lastName: t.String({ minLength: 2 })
})
```

---

## 🎬 İlk Çalıştırma

### Development Server'ları Başlat

```bash
# Terminal 1: Tüm servisleri başlat (önerilen)
bun run dev

# Veya ayrı terminallerde:
# Terminal 1: Backend
bun run dev:api

# Terminal 2: Frontend
bun run dev:web
```

**Beklenen Çıktı:**

```
🚀 Backend (API):
Elysia is running at http://localhost:3000
Swagger docs: http://localhost:3000/swagger

🎨 Frontend (Web):
VITE v7.3.0  ready in 523 ms
➜  Local:   http://localhost:5173/
```

### İlk Giriş

1. Tarayıcıda `http://localhost:5173` adresine git
2. Login sayfasında şu bilgilerle giriş yap:
   ```
   Email: admin@example.com
   Password: Admin123!
   ```
3. Dashboard'u gör ve mevcut özellikleri keşfet

### Swagger API Dokümantasyonu

1. `http://localhost:3000/swagger` adresine git
2. Tüm API endpoint'lerini gör
3. "Try it out" ile endpoint'leri test et

---

## 💻 Geliştirme Ortamı

### Hot Reload Nasıl Çalışır?

**Backend (Bun):**
- Dosya değişikliklerini otomatik algılar
- Server'ı yeniden başlatır (~100ms)
- API değişiklikleri anında yansır

**Frontend (Vite):**
- HMR (Hot Module Replacement)
- Sayfa yenilenmeden değişiklikler yansır
- React Fast Refresh aktif

### Type Safety

Proje **tam type-safe**:

```typescript
// Prisma - Database type safety
const user = await db.user.findUnique({ where: { id: '123' } })
// user'ın tipi otomatik: User | null

// Eden Treaty - API type safety
const { data } = await api.users.get()
// data'nın tipi otomatik: User[]

// TanStack Router - Route type safety
const navigate = useNavigate()
navigate({ to: '/users/$uuid', params: { uuid: '123' } })
// Yanlış route veya params hata verir
```

### Debugging

**Backend Debug:**

```typescript
// Console logging
console.log('User created:', user)

// Prisma query logging
// config/apps/api/.env
DATABASE_URL="...?connection_limit=10&log=query"

// Breakpoint (VS Code)
// .vscode/launch.json oluştur
{
  "type": "bun",
  "request": "launch",
  "name": "Debug API",
  "program": "${workspaceFolder}/apps/api/src/index.ts"
}
```

**Frontend Debug:**

```typescript
// React DevTools (browser extension)
// TanStack Query DevTools (otomatik aktif)
// TanStack Router DevTools (otomatik aktif)

// Console logging
console.log('Component rendered:', props)
```

---

## 🎫 Ticket System Geliştirme

### Adım 1: Prisma Schema Güncelleme

**packages/database/schema.prisma** dosyasına ekle:

```prisma
// Enums
enum TicketStatus {
  OPEN
  IN_PROGRESS
  PENDING
  RESOLVED
  CLOSED
  
  @@map("ticket_status")
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
  
  @@map("ticket_priority")
}

// Ticket Model
model Ticket {
  id              Int            @id @default(autoincrement())
  uuid            String         @unique @default(uuid())
  
  ticketNumber    String         @unique @map("ticket_number") @db.VarChar(50)
  subject         String         @db.VarChar(500)
  description     String         @db.Text
  
  status          TicketStatus   @default(OPEN)
  priority        TicketPriority @default(MEDIUM)
  
  customerId      String         @map("customer_id")
  customer        User           @relation("TicketToCustomer", fields: [customerId], references: [id], onDelete: Cascade)
  
  assignedAgentId String?        @map("assigned_agent_id")
  assignedAgent   User?          @relation("TicketToAgent", fields: [assignedAgentId], references: [id], onDelete: SetNull)
  
  companyId       Int?           @map("company_id")
  company         Company?       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")
  resolvedAt      DateTime?      @map("resolved_at")
  deletedAt       DateTime?      @map("deleted_at")
  
  messages        TicketMessage[]
  
  @@index([customerId])
  @@index([assignedAgentId])
  @@index([companyId])
  @@index([status])
  @@index([priority])
  @@map("tickets")
}

// Message Model
model TicketMessage {
  id              Int       @id @default(autoincrement())
  uuid            String    @unique @default(uuid())
  
  ticketId        Int       @map("ticket_id")
  ticket          Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  senderId        String    @map("sender_id")
  sender          User      @relation(fields: [senderId], references: [id], onDelete: Cascade)
  
  content         String    @db.Text
  isInternalNote  Boolean   @default(false) @map("is_internal_note")
  
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")
  
  @@index([ticketId])
  @@index([senderId])
  @@map("ticket_messages")
}
```

**User model'ine relation ekle:**

```prisma
model User {
  // ... mevcut fields ...
  
  // Ticket relations ekle
  tickets              Ticket[]        @relation("TicketToCustomer")
  assignedTickets      Ticket[]        @relation("TicketToAgent")
  messages             TicketMessage[]
  
  // ... rest of the model ...
}
```

**Company model'ine relation ekle:**

```prisma
model Company {
  // ... mevcut fields ...
  
  tickets          Ticket[]
  
  // ... rest of the model ...
}
```

### Adım 2: Migration Oluştur

```bash
cd packages/database

# Migration oluştur
bun run prisma migrate dev --name add_ticket_system

# Prisma Client'ı yeniden oluştur
bun run prisma generate
```

**Beklenen Çıktı:**
```
✔ Generated Prisma Client
✔ Applied migration: 20260219_add_ticket_system
```

### Adım 3: Backend Modülü Oluştur

```bash
# Ticket modülü dizinini oluştur
mkdir -p apps/api/src/modules/tickets

# Dosyaları oluştur
cd apps/api/src/modules/tickets
touch controller.ts service.ts dtos.ts formatters.ts types.ts constants.ts index.ts
```

**apps/api/src/modules/tickets/types.ts:**

```typescript
import type { Ticket, TicketMessage, TicketStatus, TicketPriority } from '@onlyjs/db'

export type TicketWithRelations = Ticket & {
  customer: {
    uuid: string
    name: string
    email: string
  }
  assignedAgent?: {
    uuid: string
    name: string
    email: string
  } | null
  _count?: {
    messages: number
  }
}

export type CreateTicketInput = {
  subject: string
  description: string
  priority?: TicketPriority
  companyId?: number
}

export type UpdateTicketInput = {
  subject?: string
  description?: string
  priority?: TicketPriority
  status?: TicketStatus
}

export type TicketFilters = {
  status?: TicketStatus
  priority?: TicketPriority
  customerId?: string
  assignedAgentId?: string
  companyId?: number
  search?: string
}
```

**apps/api/src/modules/tickets/constants.ts:**

```typescript
// Ticket number generator
export function generateTicketNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `TKT-${year}-${random}`
}

// Permissions
export const TICKET_PERMISSIONS = {
  'tickets:create': 'Ticket oluşturma',
  'tickets:list-all': 'Tüm ticketları listeleme',
  'tickets:list-own': 'Kendi ticketlarını listeleme',
  'tickets:list-assigned': 'Atanmış ticketları listeleme',
  'tickets:show-all': 'Tüm ticketları görüntüleme',
  'tickets:show-own': 'Kendi ticketlarını görüntüleme',
  'tickets:update-all': 'Tüm ticketları güncelleme',
  'tickets:update-own': 'Kendi ticketlarını güncelleme',
  'tickets:assign': 'Ticket atama',
  'tickets:change-status': 'Ticket durumu değiştirme',
} as const
```

**apps/api/src/modules/tickets/service.ts:**

```typescript
import { db } from '@onlyjs/db'
import type { 
  CreateTicketInput, 
  UpdateTicketInput, 
  TicketFilters,
  TicketWithRelations 
} from './types'
import { generateTicketNumber } from './constants'

export const ticketService = {
  /**
   * Ticket listesini getirir (pagination ve filtreleme ile)
   */
  async list(
    filters: TicketFilters = {},
    page = 1,
    limit = 10
  ): Promise<{ data: TicketWithRelations[]; total: number }> {
    const { status, priority, customerId, assignedAgentId, companyId, search } = filters
    
    const where = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(customerId && { customerId }),
      ...(assignedAgentId && { assignedAgentId }),
      ...(companyId && { companyId }),
      ...(search && {
        OR: [
          { subject: { contains: search, mode: 'insensitive' } },
          { ticketNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
      deletedAt: null,
    }
    
    const [data, total] = await Promise.all([
      db.ticket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              uuid: true,
              name: true,
              email: true,
            },
          },
          assignedAgent: {
            select: {
              uuid: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      db.ticket.count({ where }),
    ])
    
    return { data, total }
  },

  /**
   * UUID'ye göre ticket getirir
   */
  async getByUuid(uuid: string): Promise<TicketWithRelations | null> {
    return await db.ticket.findUnique({
      where: { uuid, deletedAt: null },
      include: {
        customer: {
          select: {
            uuid: true,
            name: true,
            email: true,
          },
        },
        assignedAgent: {
          select: {
            uuid: true,
            name: true,
            email: true,
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                uuid: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })
  },

  /**
   * Yeni ticket oluşturur
   */
  async create(
    input: CreateTicketInput,
    customerId: string
  ): Promise<TicketWithRelations> {
    const ticketNumber = generateTicketNumber()
    
    const ticket = await db.ticket.create({
      data: {
        ticketNumber,
        subject: input.subject,
        description: input.description,
        priority: input.priority || 'MEDIUM',
        customerId,
        companyId: input.companyId,
      },
      include: {
        customer: {
          select: {
            uuid: true,
            name: true,
            email: true,
          },
        },
      },
    })
    
    return ticket
  },

  /**
   * Ticket günceller
   */
  async update(
    uuid: string,
    input: UpdateTicketInput
  ): Promise<TicketWithRelations> {
    const ticket = await db.ticket.update({
      where: { uuid },
      data: {
        ...input,
        ...(input.status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
      include: {
        customer: {
          select: {
            uuid: true,
            name: true,
            email: true,
          },
        },
        assignedAgent: {
          select: {
            uuid: true,
            name: true,
            email: true,
          },
        },
      },
    })
    
    return ticket
  },

  /**
   * Ticket'a agent atar
   */
  async assign(
    uuid: string,
    agentId: string
  ): Promise<TicketWithRelations> {
    return await this.update(uuid, {
      assignedAgentId: agentId,
      status: 'IN_PROGRESS',
    })
  },

  /**
   * Ticket'ı soft delete yapar
   */
  async delete(uuid: string): Promise<void> {
    await db.ticket.update({
      where: { uuid },
      data: { deletedAt: new Date() },
    })
  },
}
```

**apps/api/src/modules/tickets/dtos.ts:**

```typescript
import { t } from 'elysia'

export const createTicketDto = t.Object({
  subject: t.String({ minLength: 5, maxLength: 500 }),
  description: t.String({ minLength: 10 }),
  priority: t.Optional(t.Union([
    t.Literal('LOW'),
    t.Literal('MEDIUM'),
    t.Literal('HIGH'),
    t.Literal('URGENT'),
  ])),
  companyId: t.Optional(t.Number()),
})

export const updateTicketDto = t.Object({
  subject: t.Optional(t.String({ minLength: 5, maxLength: 500 })),
  description: t.Optional(t.String({ minLength: 10 })),
  priority: t.Optional(t.Union([
    t.Literal('LOW'),
    t.Literal('MEDIUM'),
    t.Literal('HIGH'),
    t.Literal('URGENT'),
  ])),
  status: t.Optional(t.Union([
    t.Literal('OPEN'),
    t.Literal('IN_PROGRESS'),
    t.Literal('PENDING'),
    t.Literal('RESOLVED'),
    t.Literal('CLOSED'),
  ])),
})

export const ticketFiltersDto = t.Object({
  status: t.Optional(t.String()),
  priority: t.Optional(t.String()),
  customerId: t.Optional(t.String()),
  assignedAgentId: t.Optional(t.String()),
  companyId: t.Optional(t.Number()),
  search: t.Optional(t.String()),
  page: t.Optional(t.Number({ minimum: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
})

export const assignTicketDto = t.Object({
  agentId: t.String(),
})
```

**apps/api/src/modules/tickets/formatters.ts:**

```typescript
import type { TicketWithRelations } from './types'

export function formatTicket(ticket: TicketWithRelations) {
  return {
    uuid: ticket.uuid,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    customer: ticket.customer,
    assignedAgent: ticket.assignedAgent,
    messageCount: ticket._count?.messages || 0,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    resolvedAt: ticket.resolvedAt,
  }
}

export function formatTicketList(tickets: TicketWithRelations[]) {
  return tickets.map(formatTicket)
}
```

**apps/api/src/modules/tickets/controller.ts:**

```typescript
import { Elysia } from 'elysia'
import { ticketService } from './service'
import { 
  createTicketDto, 
  updateTicketDto, 
  ticketFiltersDto,
  assignTicketDto 
} from './dtos'
import { formatTicket, formatTicketList } from './formatters'

export const ticketController = new Elysia({ prefix: '/tickets' })
  // List tickets
  .get('/', async ({ query, user }) => {
    if (!user) throw new Error('Unauthorized')
    
    const { page = 1, limit = 10, ...filters } = query
    const { data, total } = await ticketService.list(filters, page, limit)
    
    return {
      data: formatTicketList(data),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }, {
    query: ticketFiltersDto,
  })
  
  // Get ticket by UUID
  .get('/:uuid', async ({ params, user }) => {
    if (!user) throw new Error('Unauthorized')
    
    const ticket = await ticketService.getByUuid(params.uuid)
    
    if (!ticket) {
      throw new Error('Ticket not found')
    }
    
    return formatTicket(ticket)
  })
  
  // Create ticket
  .post('/', async ({ body, user }) => {
    if (!user) throw new Error('Unauthorized')
    
    const ticket = await ticketService.create(body, user.id)
    
    return formatTicket(ticket)
  }, {
    body: createTicketDto,
  })
  
  // Update ticket
  .put('/:uuid', async ({ params, body, user }) => {
    if (!user) throw new Error('Unauthorized')
    
    const ticket = await ticketService.update(params.uuid, body)
    
    return formatTicket(ticket)
  }, {
    body: updateTicketDto,
  })
  
  // Assign ticket
  .put('/:uuid/assign', async ({ params, body, user }) => {
    if (!user) throw new Error('Unauthorized')
    
    const ticket = await ticketService.assign(params.uuid, body.agentId)
    
    return formatTicket(ticket)
  }, {
    body: assignTicketDto,
  })
  
  // Delete ticket
  .delete('/:uuid', async ({ params, user }) => {
    if (!user) throw new Error('Unauthorized')
    
    await ticketService.delete(params.uuid)
    
    return { message: 'Ticket deleted successfully' }
  })
```

**apps/api/src/modules/tickets/index.ts:**

```typescript
import { Elysia } from 'elysia'
import { ticketController } from './controller'

export const ticketModule = new Elysia()
  .use(ticketController)

export * from './types'
export * from './service'
```

### Adım 4: Modülü Ana Uygulamaya Ekle

**apps/api/src/index.ts:**

```typescript
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'

// Mevcut modüller
import { authModule } from './modules/auth'
import { userModule } from './modules/users'
import { companyModule } from './modules/companies'

// YENİ: Ticket modülü
import { ticketModule } from './modules/tickets'

const app = new Elysia()
  .use(cors())
  .use(swagger({
    documentation: {
      info: {
        title: 'HelpDesk Pro API',
        version: '1.0.0',
      },
    },
  }))
  .use(authModule)
  .use(userModule)
  .use(companyModule)
  .use(ticketModule)  // 🎫 YENİ
  .listen(3000)

console.log(`🚀 Server running at http://localhost:3000`)
```

### Adım 5: API Test Et

```bash
# Server'ı yeniden başlat (otomatik reload olmalı)
# Swagger'a git: http://localhost:3000/swagger

# Veya curl ile test et:

# 1. Login (token al)
curl -X POST http://localhost:3000/api/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Customer123!"
  }'

# 2. Ticket oluştur
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subject": "Test Ticket",
    "description": "This is a test ticket",
    "priority": "HIGH"
  }'

# 3. Ticket listele
curl http://localhost:3000/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎨 Frontend Geliştirme

### Adım 1: Route Yapısını Oluştur

```bash
# Ticket routes dizinini oluştur
mkdir -p apps/web/src/routes/_authenticated/tickets

# Route dosyalarını oluştur
cd apps/web/src/routes/_authenticated/tickets
touch index.tsx create.tsx '$uuid.tsx'
```

**apps/web/src/routes/_authenticated/tickets/index.tsx (Liste Sayfası):**

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export const Route = createFileRoute('/_authenticated/tickets/')({
  component: TicketListPage,
})

function TicketListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const response = await api.tickets.get()
      return response.data
    },
  })

  if (isLoading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tickets</h1>
        <a
          href="/tickets/create"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Yeni Ticket
        </a>
      </div>

      <div className="grid gap-4">
        {data?.data.map((ticket) => (
          <div
            key={ticket.uuid}
            className="p-4 border rounded-lg hover:shadow-lg transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                <p className="text-sm text-gray-600">
                  {ticket.ticketNumber}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded text-sm ${
                  ticket.status === 'OPEN'
                    ? 'bg-green-100 text-green-800'
                    : ticket.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {ticket.status}
              </span>
            </div>
            <p className="mt-2 text-gray-700">{ticket.description}</p>
            <div className="mt-4 flex gap-4 text-sm text-gray-600">
              <span>Öncelik: {ticket.priority}</span>
              <span>Mesaj: {ticket.messageCount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**apps/web/src/routes/_authenticated/tickets/create.tsx (Oluşturma Sayfası):**

```typescript
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'

export const Route = createFileRoute('/_authenticated/tickets/create')({
  component: CreateTicketPage,
})

type FormData = {
  subject: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

function CreateTicketPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.tickets.post(data)
      return response.data
    },
    onSuccess: () => {
      navigate({ to: '/tickets' })
    },
  })

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data)
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Yeni Ticket Oluştur</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Konu *
          </label>
          <input
            {...register('subject', {
              required: 'Konu zorunludur',
              minLength: { value: 5, message: 'En az 5 karakter' },
            })}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Ticket konusu"
          />
          {errors.subject && (
            <p className="text-red-500 text-sm mt-1">
              {errors.subject.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Açıklama *
          </label>
          <textarea
            {...register('description', {
              required: 'Açıklama zorunludur',
              minLength: { value: 10, message: 'En az 10 karakter' },
            })}
            rows={6}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Detaylı açıklama"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Öncelik
          </label>
          <select
            {...register('priority')}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="LOW">Düşük</option>
            <option value="MEDIUM">Orta</option>
            <option value="HIGH">Yüksek</option>
            <option value="URGENT">Acil</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/tickets' })}
            className="px-6 py-2 border rounded hover:bg-gray-50"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  )
}
```

**apps/web/src/routes/_authenticated/tickets/$uuid.tsx (Detay Sayfası):**

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export const Route = createFileRoute('/_authenticated/tickets/$uuid')({
  component: TicketDetailPage,
})

function TicketDetailPage() {
  const { uuid } = Route.useParams()

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', uuid],
    queryFn: async () => {
      const response = await api.tickets({ uuid }).get()
      return response.data
    },
  })

  if (isLoading) {
    return <div>Yükleniyor...</div>
  }

  if (!ticket) {
    return <div>Ticket bulunamadı</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{ticket.subject}</h1>
            <p className="text-gray-600">{ticket.ticketNumber}</p>
          </div>
          <span
            className={`px-3 py-1 rounded ${
              ticket.status === 'OPEN'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {ticket.status}
          </span>
        </div>

        <div className="prose max-w-none">
          <p>{ticket.description}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Müşteri:</span>{' '}
            {ticket.customer.name}
          </div>
          <div>
            <span className="font-semibold">Öncelik:</span>{' '}
            {ticket.priority}
          </div>
          {ticket.assignedAgent && (
            <div>
              <span className="font-semibold">Atanan Agent:</span>{' '}
              {ticket.assignedAgent.name}
            </div>
          )}
        </div>

        {/* Messages section - ileride eklenecek */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Mesajlar</h2>
          <p className="text-gray-500">Henüz mesaj yok</p>
        </div>
      </div>
    </div>
  )
}
```

### Adım 2: Navigation'a Ekle

**apps/web/src/components/layout/sidebar.tsx** (veya navigation component)

```typescript
// Mevcut navigation items'a ekle:
{
  name: 'Tickets',
  href: '/tickets',
  icon: TicketIcon, // lucide-react'tan import et
}
```

### Adım 3: Test Et

1. Frontend'i yeniden başlat (otomatik reload olmalı)
2. Tarayıcıda `/tickets` sayfasına git
3. "Yeni Ticket" butonuna tıkla
4. Form'u doldur ve gönder
5. Liste sayfasında yeni ticket'ı gör

---

## 🧪 Testing

### Unit Tests

**Backend Test Örneği:**

```typescript
// apps/api/src/modules/tickets/__tests__/service.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { ticketService } from '../service'
import { db } from '@onlyjs/db'

describe('TicketService', () => {
  let testUser: any

  beforeAll(async () => {
    testUser = await db.user.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        scope: 'COMPANY',
      },
    })
  })

  afterAll(async () => {
    await db.user.delete({ where: { id: testUser.id } })
  })

  describe('create', () => {
    it('should create a ticket with valid data', async () => {
      const input = {
        subject: 'Test Ticket',
        description: 'Test Description',
        priority: 'HIGH' as const,
      }

      const ticket = await ticketService.create(input, testUser.id)

      expect(ticket).toBeDefined()
      expect(ticket.subject).toBe(input.subject)
      expect(ticket.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/)
      expect(ticket.status).toBe('OPEN')
    })
  })
})
```

**Test Çalıştırma:**

```bash
# Tüm testleri çalıştır
bun test

# Watch mode
bun test --watch

# Coverage
bun test --coverage
```

---

## 🚀 Deployment

### Production Build

```bash
# Tüm projeyi build et
bun run build

# Sadece API
bun run build:api

# Sadece Web
bun run build:web
```

### Railway (Backend)

```bash
# Railway CLI kur
npm i -g @railway/cli

# Login
railway login

# Yeni proje oluştur
railway init

# Environment variables ekle
railway variables set DATABASE_URL="postgresql://..."
railway variables set BETTER_AUTH_SECRET="..."

# Deploy
railway up
```

### Vercel (Frontend)

```bash
# Vercel CLI kur
npm i -g vercel

# Login
vercel login

# Deploy
cd apps/web
vercel

# Production
vercel --prod
```

---

## ❓ Sık Karşılaşılan Sorunlar

### 1. Bun Kurulum Hatası

**Sorun:** `bun: command not found`

**Çözüm:**
```bash
# Shell config dosyanı yeniden yükle
source ~/.bashrc  # veya ~/.zshrc

# PATH'i kontrol et
echo $PATH | grep bun
```

### 2. PostgreSQL Bağlantı Hatası

**Sorun:** `Can't reach database server`

**Çözüm:**
```bash
# Docker container'ın çalıştığını kontrol et
docker ps

# Container'ı yeniden başlat
docker restart helpdesk-postgres

# Connection string'i kontrol et
echo $DATABASE_URL
```

### 3. Prisma Migration Hatası

**Sorun:** `Migration failed`

**Çözüm:**
```bash
# Database'i reset et (dikkat: tüm data silinir!)
cd packages/database
bun run prisma migrate reset

# Veya manuel migration
bun run prisma migrate dev --name fix_migration
```

### 4. Port Zaten Kullanımda

**Sorun:** `Port 3000 is already in use`

**Çözüm:**
```bash
# Port'u kullanan process'i bul
lsof -i :3000

# Process'i kapat
kill -9 <PID>

# Veya farklı port kullan
PORT=3001 bun run dev:api
```

### 5. Type Error: Cannot find module

**Sorun:** TypeScript modül bulamıyor

**Çözüm:**
```bash
# Node modules'leri temizle ve yeniden kur
rm -rf node_modules
bun install

# Prisma client'ı yeniden oluştur
cd packages/database
bun run prisma generate
```

---

## 📝 Yararlı Komutlar

### Development

```bash
# Tüm servisleri başlat
bun run dev

# Sadece backend
bun run dev:api

# Sadece frontend
bun run dev:web
```

### Database

```bash
cd packages/database

# Prisma Studio (GUI)
bun run prisma studio

# Migration oluştur
bun run prisma migrate dev --name migration_name

# Migration uygula (production)
bun run prisma migrate deploy

# Database reset
bun run prisma migrate reset

# Seed data
bun run prisma db seed
```

### Linting & Formatting

```bash
# Biome check
bun run format-and-lint

# Biome fix
bun run format-and-lint:fix
```

### Testing

```bash
# Tüm testler
bun test

# Watch mode
bun test --watch

# Coverage
bun test --coverage

# Specific file
bun test apps/api/src/modules/tickets/__tests__/service.test.ts
```

### Build

```bash
# Tüm proje
bun run build

# Sadece API
bun run build:api

# Sadece Web
bun run build:web
```

### Git

```bash
# Status
git status

# Stage all
git add .

# Commit
git commit -m "feat(tickets): add ticket list page"

# Push
git push origin main
```

---

## 🎓 Öğrenme Kaynakları

### Resmi Dokümantasyon

- [Bun Documentation](https://bun.sh/docs)
- [Elysia.js Documentation](https://elysiajs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [React 19 Documentation](https://react.dev)

### Video Tutorials

- [Bun Crash Course](https://www.youtube.com/results?search_query=bun+crash+course)
- [Elysia.js Tutorial](https://www.youtube.com/results?search_query=elysiajs+tutorial)
- [Prisma Tutorial](https://www.youtube.com/results?search_query=prisma+tutorial)

### Örnek Projekte Bakılacak Yerler

```bash
# Mevcut modülleri incele
apps/api/src/modules/users/      # User management örneği
apps/api/src/modules/companies/  # Company management örneği
apps/api/src/modules/projects/   # CRUD örneği

# Frontend route örnekleri
apps/web/src/routes/_authenticated/users/
apps/web/src/routes/_authenticated/companies/
```

---

## 🎉 Sonraki Adımlar

1. ✅ Ticket System'i tamamla
2. 💬 Message System ekle
3. 🔔 Notification System ekle
4. 📊 Analytics Dashboard oluştur
5. 🏷️ Category & Tag System ekle
6. 📧 Email Notifications ekle
7. 🎨 UI/UX iyileştirmeleri
8. 🧪 Test coverage artır
9. 📱 Responsive design optimize et
10. 🚀 Production'a deploy et

---

## 💡 İpuçları

1. **Type Safety'i Kullan:** TypeScript hatalarını görmezden gelme
2. **Prisma Studio Kullan:** Database'i görsel olarak yönet
3. **Swagger'ı Kullan:** API'yi test etmek için
4. **DevTools'u Kullan:** TanStack Query ve Router DevTools
5. **Git Commit'leri:** Küçük ve anlamlı commit'ler at
6. **Dokümantasyon:** Kod yazarken yorum ekle
7. **Testing:** Her önemli özellik için test yaz
8. **Code Review:** Başka birinin kodunu incele
9. **Refactoring:** Kodu sürekli iyileştir
10. **Öğrenmeye Devam Et:** Yeni teknolojileri takip et

---

