# 🎫 HelpDesk Pro - Müşteri Destek Yönetim Sistemi

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Bun](https://img.shields.io/badge/Bun-1.3+-black.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)

Modern, type-safe ve ultra-hızlı müşteri destek yönetim platformu

[Özellikler](#-özellikler) • [Kurulum](#-hızlı-başlangıç) • [Dokümantasyon](#-dokümantasyon) • [Teknolojiler](#-teknoloji-stacki)

</div>

---

## 📖 Proje Hakkında

**HelpDesk Pro**, Zendesk benzeri kapsamlı bir müşteri destek yönetim sistemidir. Güçlü bir **Turborepo + Bun + Elysia.js + React 19** boilerplate altyapısı üzerine inşa edilmiştir.

### 🎯 Temel Özellikler

- ✅ **Hazır Authentication & Authorization** - Better Auth + RBAC sistemi
- ✅ **Multi-Tenancy** - Company-based organization management
- ✅ **Type-Safe API** - Eden Treaty ile tam tip güvenliği
- ✅ **Real-time** - WebSocket desteği
- ✅ **Modern UI** - React 19 + Tailwind CSS + Radix UI
- ✅ **Ultra-Fast** - Bun runtime (Node.js'ten 3x hızlı)

### 🚀 Geliştirilecek Özellikler

- 🎫 Ticket Management System
- 💬 Message & Attachment System
- 🏷️ Category & Tag System
- 🔔 Notification System (In-app + Email)
- 📊 Analytics & Reporting Dashboard
- 📧 Email Notifications (React Email)

---

## 🏗️ Teknoloji Stack'i

### Backend
- **Runtime:** Bun 1.3+
- **Framework:** Elysia.js (Type-safe, ultra-fast)
- **Database:** PostgreSQL 16 + Prisma ORM
- **Authentication:** Better Auth
- **Real-time:** Native WebSocket

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite 7
- **Routing:** TanStack Router (Type-safe)
- **State:** TanStack Query + Zustand
- **UI:** Tailwind CSS 4 + Radix UI
- **Icons:** Lucide React + Tabler Icons

### Monorepo
- **Build System:** Turborepo
- **Package Manager:** Bun
- **Code Quality:** Biome (Linter + Formatter)
- **Testing:** Bun Test

---

## 🚀 Hızlı Başlangıç

### Ön Gereksinimler

- [Bun](https://bun.sh) v1.3+
- [PostgreSQL](https://www.postgresql.org/) v16+
- [Git](https://git-scm.com/)

### Kurulum

```bash
# 1. Repository'yi klonla
git clone <repository-url>
cd support-ticket-system

# 2. Dependencies kur
bun install

# 3. Environment dosyalarını oluştur
cp config/apps/api/.env.example config/apps/api/.env
cp config/apps/web/.env.example config/apps/web/.env

# 4. Database URL'i güncelle (config/apps/api/.env)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/helpdesk_db"

# 5. Database migration
cd packages/database
bun run prisma migrate dev
bun run prisma generate

# 6. Development server'ları başlat
cd ../..
bun run dev
```

### Erişim

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Docs:** http://localhost:3000/swagger

### Test Kullanıcıları

```
Admin:
Email: admin@example.com
Password: Admin123!

Agent:
Email: agent@example.com
Password: Agent123!

Customer:
Email: customer@example.com
Password: Customer123!
```

---

## 📁 Proje Yapısı

```
support-ticket-system/
├── apps/
│   ├── web/                    # Frontend (React 19 + Vite)
│   │   ├── src/
│   │   │   ├── routes/         # TanStack Router routes
│   │   │   ├── components/     # React components
│   │   │   ├── lib/            # Utilities & API client
│   │   │   └── stores/         # Zustand stores
│   │   └── package.json
│   │
│   └── api/                    # Backend (Elysia.js + Bun)
│       ├── src/
│       │   ├── modules/        # Feature modules
│       │   │   ├── auth/       # Authentication
│       │   │   ├── users/      # User management
│       │   │   ├── companies/  # Company management
│       │   │   └── tickets/    # 🎫 Ticket system (YENİ)
│       │   ├── core/           # Core functionality
│       │   └── utils/          # Utilities
│       └── package.json
│
├── packages/
│   ├── database/               # Prisma schema & client
│   ├── eden/                   # Type-safe API client
│   └── tooling-config/         # Shared configs
│
├── config/                     # Environment configs
├── turbo.json                  # Turborepo config
└── package.json                # Root package.json
```

---

## 📚 Dokümantasyon

- **[Technical-Document-Sample.md](./Technical-Document-Sample.md)** - Kapsamlı teknik döküman
  - Sistem mimarisi
  - Veritabanı tasarımı
  - API endpoint'leri
  - Güvenlik ve performans
  - Deployment stratejisi

- **[GETTING-STARTED.md](./GETTING-STARTED.md)** - Adım adım başlangıç rehberi
  - Detaylı kurulum
  - Proje yapısını anlama
  - İlk modül geliştirme
  - Testing ve debugging
  - Sorun giderme

---

## 🛠️ Geliştirme

### Komutlar

```bash
# Development
bun run dev              # Tüm servisleri başlat
bun run dev:web          # Sadece frontend
bun run dev:api          # Sadece backend

# Build
bun run build            # Tüm projeyi build et
bun run build:web        # Sadece frontend
bun run build:api        # Sadece backend

# Linting & Formatting
bun run format-and-lint      # Check
bun run format-and-lint:fix  # Fix

# Testing
bun test                 # Tüm testleri çalıştır
bun test --watch         # Watch mode
bun test --coverage      # Coverage report

# Database
cd packages/database
bun run prisma studio    # Database GUI
bun run prisma migrate dev    # Migration oluştur
bun run prisma generate  # Client oluştur
```

### Modül Yapısı

Her backend modülü şu yapıyı takip eder:

```typescript
modules/[module-name]/
├── controller.ts    // API endpoints (Elysia routes)
├── service.ts       // Business logic
├── dtos.ts         // Validation schemas (Zod)
├── formatters.ts   // Response formatters
├── types.ts        // TypeScript types
└── index.ts        // Module export
```

---

## 🎫 Ticket System Geliştirme

### 1. Prisma Schema Ekle

```prisma
// packages/database/schema.prisma
model Ticket {
  id              Int            @id @default(autoincrement())
  uuid            String         @unique @default(uuid())
  ticketNumber    String         @unique @map("ticket_number")
  subject         String         @db.VarChar(500)
  description     String         @db.Text
  status          TicketStatus   @default(OPEN)
  priority        TicketPriority @default(MEDIUM)
  // ... diğer alanlar
}
```

### 2. Migration Oluştur

```bash
cd packages/database
bun run prisma migrate dev --name add_ticket_system
bun run prisma generate
```

### 3. Backend Modülü Oluştur

```bash
mkdir -p apps/api/src/modules/tickets
cd apps/api/src/modules/tickets
touch controller.ts service.ts dtos.ts formatters.ts types.ts index.ts
```

### 4. Frontend Route Oluştur

```bash
mkdir -p apps/web/src/routes/_authenticated/tickets
cd apps/web/src/routes/_authenticated/tickets
touch index.tsx create.tsx '$uuid.tsx'
```

Detaylı adımlar için [GETTING-STARTED.md](./GETTING-STARTED.md) dosyasına bakın.

---

## 🧪 Testing

```typescript
// Backend test örneği
import { describe, it, expect } from 'bun:test'
import { ticketService } from '../service'

describe('TicketService', () => {
  it('should create a ticket', async () => {
    const ticket = await ticketService.create({
      subject: 'Test Ticket',
      description: 'Test Description',
      priority: 'HIGH'
    }, userId)
    
    expect(ticket.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/)
  })
})
```

---

## 🚀 Deployment

### Backend (Railway)

```bash
railway login
railway init
railway variables set DATABASE_URL="..."
railway up
```

### Frontend (Vercel)

```bash
cd apps/web
vercel login
vercel --prod
```

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit atın (`git commit -m 'feat: add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Commit Convention

```
feat(scope): add new feature
fix(scope): fix bug
docs(scope): update documentation
style(scope): format code
refactor(scope): refactor code
test(scope): add tests
chore(scope): update dependencies
```

---

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

## 🙏 Teşekkürler

Bu proje aşağıdaki harika teknolojiler kullanılarak geliştirilmiştir:

- [Bun](https://bun.sh) - Ultra-fast JavaScript runtime
- [Elysia.js](https://elysiajs.com) - Type-safe web framework
- [Prisma](https://www.prisma.io) - Next-generation ORM
- [React](https://react.dev) - UI library
- [TanStack](https://tanstack.com) - Router & Query
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Radix UI](https://www.radix-ui.com) - Headless UI components
- [Turborepo](https://turbo.build) - Monorepo build system

---

## 📞 İletişim

Sorularınız için:
- 📧 Email: [your-email@example.com]
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-repo/discussions)

---

<div align="center">

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**

Made with ❤️ using Bun + Elysia.js + React 19

</div>
