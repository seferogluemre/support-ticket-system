# Müşteri Destek Yönetim Sistemi
## Teknik Döküman ve Proje Spesifikasyonu

---

**Proje Adı:** HelpDesk Pro - Müşteri Destek Yönetim Sistemi  
**Proje Kodu:** HDPRO-2026  
**Proje Tipi:** Full-Stack Web Aplikasyonu (Monorepo)  
**Proje Durumu:** Geliştirme Aşaması  
**Referans Sistem:** Zendesk  
**Boilerplate:** Custom Turborepo + Bun + Elysia.js + React 19

**Döküman Versiyonu:** 2.0.0 (Boilerplate-based)  
**Son Güncelleme:** 19 Şubat 2026  
---

## Executive Summary

Bu proje, **sıfırdan değil**, güçlü bir **Turborepo + Bun + Elysia.js + React 19** boilerplate altyapısı üzerine inşa edilecektir. Mevcut boilerplate'te zaten hazır olan authentication, authorization (RBAC), multi-tenancy, user management ve file upload sistemleri sayesinde, geliştirme süresi önemli ölçüde kısalmaktadır.

**Temel Avantajlar:**
- ✅ **%60 daha hızlı geliştirme:** Authentication, RBAC, multi-tenancy hazır
- ✅ **Type-safety:** Tam TypeScript desteği (Prisma, Elysia, Eden Treaty)
- ✅ **Modern Stack:** Bun (3x hızlı), Elysia.js, React 19, TanStack
- ✅ **Production-ready:** Audit logs, error handling, security headers mevcut
- ✅ **Developer Experience:** Hot reload, type-safe API, Biome linting

**Geliştirilecek Modüller:**
1. Ticket Management System (CRUD, assignment, status)
2. Message & Attachment System (real-time)
3. Category & Tag System
4. Notification System (in-app + email)
5. Analytics & Reporting Dashboard

**Tahmini Süre:** 10 hafta (12 hafta yerine - boilerplate sayesinde)

---

## İçindekiler

1. [Proje Özeti](#1-proje-özeti)
   - 1.0 [Boilerplate Altyapısı](#10-boilerplate-altyapısı)
   - 1.1 [Proje Tanımı](#11-proje-tanımı)
   - 1.2 [İş Gereksinimleri](#12-iş-gereksinimleri)
   - 1.3 [Proje Hedefleri](#13-proje-hedefleri)
   - 1.4 [Proje Kapsamı](#14-proje-kapsamı)
2. [Sistem Mimarisi](#2-sistem-mimarisi)
   - 2.1 [Teknoloji Stack'i](#21-teknoloji-stacki)
   - 2.2 [Monorepo Yapısı](#22-monorepo-yapısı)
   - 2.3 [Sistem Mimarisi Diyagramı](#23-sistem-mimarisi-diyagramı)
   - 2.4 [API Mimarisi](#24-api-mimarisi)
3. [Veritabanı Tasarımı](#3-veritabanı-tasarımı)
   - 3.1 [Entity Relationship Diagram](#31-entity-relationship-diagram-erd)
   - 3.2 [Tablo Detayları](#32-tablo-detayları)
4. [Özellikler ve Modüller](#4-özellikler-ve-modüller)
5. [Geliştirme Planı](#5-geliştirme-planı)
6. [Teknik Standartlar](#6-teknik-standartlar)
7. [Güvenlik ve Performans](#7-güvenlik-ve-performans)
8. [Deployment Stratejisi](#8-deployment-stratejisi)
9. [Ek Bilgiler](#9-ek-bilgiler)
10. [Sonuç ve Onay](#10-sonuç-ve-onay)
11. [Geliştirme Başlangıç Kılavuzu](#11-geliştirme-başlangıç-kılavuzu)

---

## 1. Proje Özeti

### 1.0 Boilerplate Altyapısı

**Önemli:** Bu proje sıfırdan başlamıyor. Güçlü bir boilerplate altyapısı üzerine inşa edilecek.

**Mevcut Boilerplate Özellikleri:**

✅ **Monorepo Yapısı:**
- Turborepo ile organize edilmiş workspace
- Bun runtime ve package manager
- Shared packages (@onlyjs/db, @onlyjs/eden)

✅ **Authentication & Authorization:**
- Better Auth entegrasyonu (session-based)
- Role-Based Access Control (RBAC)
- Permission-based authorization
- Global ve Organization-specific roller
- User claims ve permissions cache

✅ **Multi-Tenancy:**
- Company modeli (organization management)
- Company members ve membership yönetimi
- Organization-scoped permissions
- Owner/Admin role hierarchy

✅ **User Management:**
- Gelişmiş user modeli (scope, claims, roles cache)
- User roles ve permissions
- Profile management
- Avatar upload (FileLibraryAsset entegrasyonu)

✅ **Database & ORM:**
- PostgreSQL + Prisma ORM
- Type-safe database client
- Prismabox (TypeBox schema generator)
- Custom seeder system
- Audit logs

✅ **API Infrastructure:**
- Elysia.js framework (type-safe)
- Eden Treaty (type-safe API client)
- Swagger/OpenAPI documentation
- Modüler yapı (controller, service, dto, formatter)

✅ **Frontend Infrastructure:**
- React 19 + Vite
- TanStack Router (type-safe routing)
- TanStack Query (server state)
- Zustand (client state)
- Tailwind CSS 4 + Radix UI
- WebSocket worker (real-time)

✅ **File Management:**
- FileLibraryAsset sistemi
- File upload ve storage
- Image optimization

✅ **Developer Experience:**
- Biome (linter + formatter)
- TypeScript strict mode
- Hot reload (Bun + Vite)
- Type-safe API calls (Eden Treaty)

**Eklenecek Özellikler:**
- 🎫 Ticket Management System
- 💬 Message & Attachment System
- 🏷️ Category & Tag System
- 🔔 Notification System
- 📊 Analytics & Reporting
- 📧 Email Notifications (React Email)

### 1.1 Proje Tanımı

HelpDesk Pro, modern işletmelerin müşteri destek süreçlerini dijitalleştirmelerine olanak sağlayan, bulut tabanlı (SaaS) bir müşteri destek yönetim platformudur. Sistem, **mevcut güçlü boilerplate altyapısı üzerine** destek taleplerinin (ticket) yönetiminden, gerçek zamanlı iletişime, raporlamadan bilgi bankasına kadar kapsamlı bir çözüm sunmaktadır.

### 1.2 İş Gereksinimleri

**Temel İhtiyaçlar:**
- Müşterilerin destek talebi oluşturabilmesi
- Destek ekibinin talepleri yönetebilmesi ve yanıtlayabilmesi
- Gerçek zamanlı bildirim ve mesajlaşma
- Taleplerin önceliklendirme ve kategorize edilmesi
- Performans ve istatistik raporları
- Çoklu kullanıcı rol yönetimi

**Hedef Kullanıcılar:**
- **Müşteriler (Customer):** Destek talebi oluşturan ve takip eden son kullanıcılar
- **Destek Temsilcileri (Agent):** Talepleri yanıtlayan ve çözüme kavuşturan ekip üyeleri
- **Yöneticiler (Admin):** Sistem yönetimi, kullanıcı yönetimi ve raporlama yapan üst düzey kullanıcılar

### 1.3 Proje Hedefleri

**Fonksiyonel Hedefler:**
- ✓ Kullanıcı dostu ve sezgisel arayüz tasarımı
- ✓ Gerçek zamanlı bildirim ve mesajlaşma sistemi
- ✓ Rol bazlı erişim kontrolü (RBAC)
- ✓ Otomatik ticket numarası ve önceliklendirme
- ✓ Kapsamlı raporlama ve analitik dashboard
- ✓ RESTful API mimarisi
- ✓ Responsive tasarım (mobil uyumlu)
- ✓ Email entegrasyonu

**Teknik Hedefler:**
- ✓ Ölçeklenebilir mimari
- ✓ Yüksek performans ve düşük yanıt süresi
- ✓ Güvenli veri yönetimi (GDPR uyumlu)
- ✓ API dokümantasyonu (Swagger/OpenAPI)
- ✓ Test coverage minimum %70
- ✓ CI/CD pipeline entegrasyonu

### 1.4 Proje Kapsamı

**Kapsam Dahilinde:**
- Kullanıcı yönetimi ve authentication
- Ticket yönetim sistemi
- Mesajlaşma ve dosya paylaşımı
- Bildirim sistemi (email ve in-app)
- Dashboard ve raporlama
- Admin paneli
- API geliştirme ve dokümantasyon

**Kapsam Dışında (Gelecek Versiyonlar):**
- Canlı chat widget entegrasyonu
- Mobil uygulama (iOS/Android)
- Multi-language desteği
- Üçüncü parti entegrasyonlar (Slack, Teams, vb.)
- AI destekli otomatik yanıt sistemi
- Voice/Video call desteği

---

## 2. Sistem Mimarisi

### 2.1 Teknoloji Stack'i

#### Monorepo Yapısı

| Kategori | Teknoloji | Versiyon | Açıklama |
|----------|-----------|----------|----------|
| Monorepo | Turborepo | 2.5+ | Build system ve task orchestration |
| Package Manager | Bun | 1.3+ | Hızlı paket yöneticisi ve runtime |
| Workspace | Bun Workspaces | Latest | Monorepo paket yönetimi |

#### Frontend Teknolojileri (@onlyjs/web)

| Kategori | Teknoloji | Versiyon | Açıklama |
|----------|-----------|----------|----------|
| Framework | React | 19.1+ | UI geliştirme framework'ü |
| Styling | Tailwind CSS | 4.1+ | Utility-first CSS framework |
| UI Components | Radix UI | Latest | Headless UI component library |
| Icons | Lucide React + Tabler Icons | Latest | Icon kütüphaneleri |
| State Management | Zustand | 5.0+ | Lightweight state yönetimi |
| Routing | TanStack Router | 1.131+ | Type-safe routing |
| Data Fetching | TanStack Query | 5.87+ | Server state yönetimi |
| HTTP Client | Eden Treaty (Elysia) | Latest | Type-safe API client |
| Form Management | React Hook Form + Zod | Latest | Form validasyonu |
| Real-time | WebSocket Worker | Custom | WebSocket iletişimi |
| Charts | Recharts | 3.1+ | Veri görselleştirme |
| Date/Time | date-fns | 4.1+ | Tarih işlemleri |
| Notifications | Sonner | 2.0+ | Toast notifications |
| Build Tool | Vite | 7.3+ | Modern build tool |

#### Backend Teknolojileri (@onlyjs/api)

| Kategori | Teknoloji | Versiyon | Açıklama |
|----------|-----------|----------|----------|
| Runtime | Bun | 1.3+ | Ultra-fast JavaScript runtime |
| Framework | Elysia.js | 1.4+ | Type-safe web framework |
| Database | PostgreSQL | 16+ | İlişkisel veritabanı |
| ORM | Prisma | Latest | Type-safe database ORM |
| Authentication | Better Auth | 1.3+ | Modern auth library |
| Authorization | Custom RBAC | - | Role & Permission based |
| Real-time | WebSocket (Native) | - | WebSocket server |
| File Upload | Elysia Static | 1.4+ | Dosya yükleme |
| Email | React Email | 4.2+ | Email template engine |
| Validation | Zod + Prismabox | Latest | Type-safe validasyon |
| API Docs | Elysia Swagger | 1.3+ | OpenAPI dokümantasyonu |
| Cron Jobs | Elysia Cron | 1.4+ | Zamanlanmış görevler |

#### Database Paketi (@onlyjs/db)

| Kategori | Teknoloji | Açıklama |
|----------|-----------|----------|
| ORM | Prisma Client | Type-safe database client |
| Schema Generator | Prismabox | TypeBox schema generator |
| Seeding | Custom Seeder | Database seeding system |

#### DevOps ve Araçlar

| Kategori | Teknoloji | Açıklama |
|----------|-----------|----------|
| Version Control | Git + GitHub | Kod versiyon kontrolü |
| Package Manager | Bun | Ultra-fast package manager |
| Code Quality | Biome | Linter + Formatter (ESLint + Prettier alternatifi) |
| Testing | Bun Test | Native test runner |
| CI/CD | GitHub Actions | Otomatik deployment |
| Deployment | Railway / Vercel | Backend + Frontend hosting |
| Environment | dotenvx | Environment variable yönetimi |

### 2.2 Monorepo Yapısı

```
support-ticket-system/
├── apps/
│   ├── web/                    # Frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── routes/         # TanStack Router routes
│   │   │   ├── components/     # React components
│   │   │   ├── lib/            # Utilities, auth, API client
│   │   │   ├── stores/         # Zustand stores
│   │   │   └── hooks/          # Custom hooks
│   │   └── package.json
│   │
│   └── api/                    # Backend (Elysia.js + Bun)
│       ├── src/
│       │   ├── modules/        # Feature modules
│       │   │   ├── auth/       # Authentication & Authorization
│       │   │   ├── users/      # User management
│       │   │   ├── tickets/    # Ticket system (YENİ)
│       │   │   ├── messages/   # Message system (YENİ)
│       │   │   └── ...
│       │   ├── core/           # Core functionality
│       │   ├── utils/          # Utilities
│       │   └── seeders/        # Database seeders
│       └── package.json
│
├── packages/
│   ├── database/               # Prisma schema & client
│   │   ├── schema.prisma       # Database schema
│   │   ├── client/             # Generated Prisma client
│   │   └── src/seeder/         # Seeding system
│   │
│   ├── eden/                   # Type-safe API client
│   │   └── index.ts            # Eden Treaty exports
│   │
│   └── tooling-config/         # Shared configs
│       └── tsconfig/           # TypeScript configs
│
├── config/                     # Environment configs
│   ├── apps/web/.env
│   └── apps/api/.env
│
├── turbo.json                  # Turborepo config
├── package.json                # Root package.json
└── biome.json                  # Biome config
```

### 2.3 Sistem Mimarisi Diyagramı

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (@onlyjs/web)                    │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Customer   │    │    Agent     │    │    Admin     │      │
│  │   Dashboard  │    │   Dashboard  │    │   Dashboard  │      │
│  │              │    │              │    │              │      │
│  │  - Tickets   │    │  - Assigned  │    │  - Users     │      │
│  │  - Messages  │    │  - Queue     │    │  - Reports   │      │
│  │  - Profile   │    │  - Stats     │    │  - Settings  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                   │
│  React 19 + TanStack Router + TanStack Query + Zustand          │
│  Tailwind CSS 4 + Radix UI + Recharts                           │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Eden Treaty (Type-safe)
                            │ HTTPS / WebSocket
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                  API LAYER (@onlyjs/api)                         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Elysia.js Server (Bun Runtime)               │   │
│  │              Better Auth + Custom RBAC System             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Auth     │  │   Tickets    │  │   Messages   │          │
│  │   Module     │  │   Module     │  │   Module     │          │
│  │              │  │              │  │              │          │
│  │ - Sign Up    │  │ - CRUD       │  │ - Create     │          │
│  │ - Sign In    │  │ - Filter     │  │ - List       │          │
│  │ - Session    │  │ - Assign     │  │ - Upload     │          │
│  │ - Permissions│  │ - Status     │  │ - Real-time  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Users     │  │   Analytics  │  │    Email     │          │
│  │   Module     │  │   Module     │  │   Module     │          │
│  │              │  │              │  │              │          │
│  │ - Profile    │  │ - Dashboard  │  │ - React      │          │
│  │ - Roles      │  │ - Reports    │  │   Email      │          │
│  │ - Members    │  │ - Metrics    │  │ - Templates  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           WebSocket Server (Native Bun WS)                │   │
│  │  - New messages  - Status updates  - Notifications       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Prisma Client (@onlyjs/db)
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                  DATABASE LAYER (PostgreSQL 16+)                 │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Mevcut Tablolar (Boilerplate)               │   │
│  │  - users (authentication & profiles)                      │   │
│  │  - roles (RBAC system)                                    │   │
│  │  - user_roles (user-role mapping)                         │   │
│  │  - user_permissions (direct permissions)                  │   │
│  │  - companies (multi-tenancy)                              │   │
│  │  - company_members (company memberships)                  │   │
│  │  - sessions (auth sessions)                               │   │
│  │  - accounts (OAuth accounts)                              │   │
│  │  - audit_logs (system logs)                               │   │
│  │  - file_library_assets (file uploads)                     │   │
│  │  - projects, posts, locations (örnek modüller)            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Yeni Tablolar (Ticket System - EKLENECEKLER)    │   │
│  │  - tickets (destek talepleri)                             │   │
│  │  - ticket_messages (ticket mesajları)                     │   │
│  │  - ticket_attachments (dosya ekleri)                      │   │
│  │  - ticket_categories (kategoriler)                        │   │
│  │  - ticket_tags (etiketler)                                │   │
│  │  - ticket_status_history (durum geçmişi)                  │   │
│  │  - notifications (bildirimler)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 API Mimarisi

**Elysia.js Modüler Yapısı:**

Projede her modül kendi controller, service, dto ve formatter dosyalarına sahiptir:

```typescript
// Modül yapısı örneği
apps/api/src/modules/tickets/
├── controller.ts      // Route tanımları
├── service.ts         // Business logic
├── dtos.ts           // Zod validation schemas
├── formatters.ts     // Response formatters
├── types.ts          // TypeScript types
└── index.ts          // Module export
```

**API Endpoints (Mevcut + Yeni Eklenecekler):**

```
Authentication (Better Auth - Mevcut):
POST   /api/sign-up                    - Kullanıcı kaydı
POST   /api/sign-in                    - Giriş
POST   /api/sign-out                   - Çıkış
GET    /api/session                    - Mevcut session
POST   /api/forgot-password            - Şifre sıfırlama
POST   /api/reset-password             - Şifre sıfırlama

Users (Mevcut):
GET    /api/users                      - Kullanıcı listesi (pagination)
GET    /api/users/:uuid                - Kullanıcı detayı
GET    /api/users/me                   - Mevcut kullanıcı
PUT    /api/users/:uuid                - Kullanıcı güncelleme
DELETE /api/users/:uuid                - Kullanıcı silme
POST   /api/users/:uuid/avatar         - Avatar yükleme

Roles & Permissions (Mevcut):
GET    /api/roles                      - Rol listesi
POST   /api/roles                      - Yeni rol (Admin)
GET    /api/roles/:uuid                - Rol detayı
PUT    /api/roles/:uuid                - Rol güncelleme
DELETE /api/roles/:uuid                - Rol silme
GET    /api/permissions                - Permission listesi
POST   /api/user-permissions           - Kullanıcıya permission atama

Companies (Mevcut - Multi-tenancy):
GET    /api/companies                  - Company listesi
POST   /api/companies                  - Yeni company
GET    /api/companies/:uuid            - Company detayı
PUT    /api/companies/:uuid            - Company güncelleme
DELETE /api/companies/:uuid            - Company silme
GET    /api/companies/:uuid/members    - Company üyeleri
POST   /api/companies/:uuid/members    - Üye ekleme

Tickets (YENİ - Eklenecek):
GET    /api/tickets                    - Ticket listesi (filter, sort, pagination)
POST   /api/tickets                    - Yeni ticket
GET    /api/tickets/:uuid              - Ticket detayı
PUT    /api/tickets/:uuid              - Ticket güncelleme
DELETE /api/tickets/:uuid              - Ticket silme (soft delete)
PUT    /api/tickets/:uuid/assign       - Agent atama
PUT    /api/tickets/:uuid/status       - Status güncelleme
PUT    /api/tickets/:uuid/priority     - Priority güncelleme
GET    /api/tickets/:uuid/history      - Status geçmişi

Messages (YENİ - Eklenecek):
GET    /api/tickets/:uuid/messages     - Mesaj listesi
POST   /api/tickets/:uuid/messages     - Yeni mesaj
PUT    /api/messages/:uuid             - Mesaj güncelleme
DELETE /api/messages/:uuid             - Mesaj silme
POST   /api/messages/:uuid/attachments - Dosya ekleme

Categories (YENİ - Eklenecek):
GET    /api/ticket-categories          - Kategori listesi
POST   /api/ticket-categories          - Yeni kategori (Admin)
GET    /api/ticket-categories/:uuid    - Kategori detayı
PUT    /api/ticket-categories/:uuid    - Kategori güncelleme
DELETE /api/ticket-categories/:uuid    - Kategori silme

Notifications (YENİ - Eklenecek):
GET    /api/notifications              - Bildirim listesi
GET    /api/notifications/unread       - Okunmamış bildirimler
PUT    /api/notifications/:uuid/read   - Okundu işaretle
PUT    /api/notifications/mark-all-read - Tümünü okundu işaretle
DELETE /api/notifications/:uuid        - Bildirim silme

Analytics (YENİ - Eklenecek):
GET    /api/analytics/dashboard        - Dashboard istatistikleri
GET    /api/analytics/tickets          - Ticket metrikleri
GET    /api/analytics/agents           - Agent performansı
GET    /api/analytics/response-time    - Yanıt süresi analizi

File Library (Mevcut):
GET    /api/file-library               - Dosya listesi
POST   /api/file-library/upload        - Dosya yükleme
GET    /api/file-library/:uuid         - Dosya detayı
DELETE /api/file-library/:uuid         - Dosya silme

Audit Logs (Mevcut):
GET    /api/audit-logs                 - Audit log listesi
GET    /api/audit-logs/:uuid           - Log detayı
```

**Type-Safe API Client (Eden Treaty):**

```typescript
// Frontend'de type-safe API çağrıları
import { api } from '@/lib/api'

// Otomatik type inference
const { data, error } = await api.tickets.index.get({
  query: {
    page: 1,
    limit: 10,
    status: 'OPEN'
  }
})

// TypeScript tam tip desteği sağlar
const ticket = await api.tickets({ uuid }).get()
```

---

## 3. Veritabanı Tasarımı

### 3.1 Entity Relationship Diagram (ERD)

**Mevcut Boilerplate Yapısı:**

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│     users       │         │     roles       │         │  user_roles     │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │         │ id (PK)         │
│ email           │         │ uuid            │         │ user_id (FK)    │
│ first_name      │         │ name            │         │ role_id (FK)    │
│ last_name       │         │ type            │         │ org_id          │
│ scope           │         │ permissions     │         │ org_type        │
│ claims (cache)  │         │ org_id          │         │ created_at      │
│ roles (cache)   │         │ org_type        │         └─────────────────┘
│ memberships     │         │ order           │
└─────────────────┘         └─────────────────┘
        │                           │
        │                           │
        ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│   companies     │         │ company_members │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ uuid            │         │ user_id (FK)    │
│ name            │         │ company_id (FK) │
│ owner_id (FK)   │         │ is_admin        │
│ members_count   │         │ preferences     │
└─────────────────┘         └─────────────────┘
```

**Ticket System ERD (Yeni Eklenecek):**

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│     users       │         │    tickets      │         │ ticket_messages │
│   (MEVCUT)      │         │     (YENİ)      │         │     (YENİ)      │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄───────┤│ customer_id(FK) │         │ id (PK)         │
│ email           │         │ assigned_id(FK) │◄───────┤│ ticket_id (FK)  │
│ first_name      │         │ category_id(FK) │         │ sender_id (FK)  │
│ last_name       │         │ company_id (FK) │         │ content         │
│ scope           │         │ ticket_number   │         │ is_internal     │
│ ...             │         │ subject         │         │ created_at      │
└─────────────────┘         │ description     │         └─────────────────┘
                            │ status          │                │
                            │ priority        │                │
                            │ created_at      │                ▼
                            │ resolved_at     │         ┌─────────────────┐
                            └─────────────────┘         │ticket_attachments│
                                    │                   │     (YENİ)      │
                                    │                   ├─────────────────┤
                    ┌───────────────┼───────────────┐   │ id (PK)         │
                    │               │               │   │ message_id (FK) │
                    ▼               ▼               ▼   │ file_name       │
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ file_url  │
            │ticket_status│ │ticket_tags  │ │ticket_      │ file_size  │
            │  _history   │ │   (YENİ)    │ │categories   │ mime_type  │
            │   (YENİ)    │ ├─────────────┤ │   (YENİ)    │ uploaded_at│
            ├─────────────┤ │ id (PK)     │ ├─────────────┤ └─────────────┘
            │ id (PK)     │ │ ticket_id   │ │ id (PK)     │
            │ ticket_id   │ │ name        │ │ uuid        │
            │ from_status │ │ color       │ │ name        │
            │ to_status   │ └─────────────┘ │ description │
            │ changed_by  │                 │ color       │
            │ note        │                 │ company_id  │
            │ created_at  │                 └─────────────┘
            └─────────────┘

┌─────────────────┐
│ notifications   │
│     (YENİ)      │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ type            │
│ title           │
│ message         │
│ link            │
│ is_read         │
│ ticket_id       │
│ message_id      │
│ created_at      │
└─────────────────┘
```

### 3.2 Tablo Detayları

#### users (Kullanıcılar - MEVCUT)

**Not:** Boilerplate'te zaten gelişmiş bir User tablosu mevcut. Ticket sistemi için ek alanlar eklenecek.

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique @db.VarChar(255)
  firstName       String    @map("first_name") @db.VarChar(50)
  lastName        String    @map("last_name") @db.VarChar(50)
  name            String    @map("full_name") @db.VarChar(101)
  gender          Gender
  scope           UserScope @default(COMPANY) // SYSTEM | COMPANY
  
  // Auth fields (Better Auth)
  emailVerified   Boolean
  image           String?   @db.VarChar(255)
  isActive        Boolean   @default(true)
  
  // Cached data for performance
  claims          Json?     @db.JsonB  // Permissions cache
  roles           Json?     @db.JsonB  // Roles cache
  memberships     Json?     @db.JsonB  // Memberships cache
  
  // Ticket System için yeni alanlar (EKLENECEK)
  ticketPreferences Json?   @db.JsonB  // Agent tercihleri
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
  // Relations (Mevcut)
  sessions        Session[]
  accounts        Account[]
  userRoles       UserRole[]
  auditLogs       AuditLog[]
  posts           Post[]
  userPermissions UserPermission[]
  company         Company[]
  companyMembers  CompanyMember[]
  projects        Project[]
  
  // Relations (YENİ - Ticket System)
  tickets              Ticket[]              @relation("TicketToCustomer")
  assignedTickets      Ticket[]              @relation("TicketToAgent")
  messages             TicketMessage[]
  statusChanges        TicketStatusHistory[]
  notifications        Notification[]
  
  @@map("users")
}
```

#### tickets (Destek Talepleri - YENİ EKLENECEK)

```prisma
enum TicketStatus {
  OPEN          // Yeni açılmış
  IN_PROGRESS   // Üzerinde çalışılıyor
  PENDING       // Müşteri yanıtı bekleniyor
  RESOLVED      // Çözüldü
  CLOSED        // Kapatıldı
  
  @@map("ticket_status")
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
  
  @@map("ticket_priority")
}

model Ticket {
  id              Int            @id @default(autoincrement())
  uuid            String         @unique @default(uuid())
  
  // Otomatik oluşturulan ticket numarası (örn: TKT-2026-001234)
  ticketNumber    String         @unique @map("ticket_number") @db.VarChar(50)
  
  subject         String         @db.VarChar(500)
  description     String         @db.Text
  
  status          TicketStatus   @default(OPEN)
  priority        TicketPriority @default(MEDIUM)
  
  // Customer (ticket oluşturan)
  customerId      String         @map("customer_id")
  customer        User           @relation("TicketToCustomer", fields: [customerId], references: [id], onDelete: Cascade)
  
  // Assigned Agent (atanan destek temsilcisi)
  assignedAgentId String?        @map("assigned_agent_id")
  assignedAgent   User?          @relation("TicketToAgent", fields: [assignedAgentId], references: [id], onDelete: SetNull)
  
  // Category
  categoryId      Int?           @map("category_id")
  category        TicketCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  
  // Company scope (multi-tenancy desteği)
  companyId       Int?           @map("company_id")
  companyUuid     String?        @map("company_uuid")
  company         Company?       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  // Metadata
  metadata        Json?          @db.JsonB  // Ek bilgiler
  
  // Timestamps
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")
  resolvedAt      DateTime?      @map("resolved_at")
  closedAt        DateTime?      @map("closed_at")
  deletedAt       DateTime?      @map("deleted_at")
  
  // Relations
  messages        TicketMessage[]
  statusHistory   TicketStatusHistory[]
  tags            TicketTag[]
  
  @@index([customerId])
  @@index([assignedAgentId])
  @@index([companyId])
  @@index([status])
  @@index([priority])
  @@index([categoryId])
  @@index([createdAt(sort: Desc)])
  @@index([deletedAt])
  @@map("tickets")
}
```

#### ticket_messages (Mesajlar - YENİ EKLENECEK)

```prisma
model TicketMessage {
  id              Int       @id @default(autoincrement())
  uuid            String    @unique @default(uuid())
  
  // Ticket relation
  ticketId        Int       @map("ticket_id")
  ticket          Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  // Sender (customer veya agent)
  senderId        String    @map("sender_id")
  sender          User      @relation(fields: [senderId], references: [id], onDelete: Cascade)
  
  // Message content
  content         String    @db.Text
  
  // Internal note (sadece agent'lar arası görünür)
  isInternalNote  Boolean   @default(false) @map("is_internal_note")
  
  // Message metadata
  metadata        Json?     @db.JsonB
  
  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")
  
  // Relations
  attachments     TicketAttachment[]
  
  @@index([ticketId])
  @@index([senderId])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("ticket_messages")
}
```

#### ticket_categories (Kategoriler - YENİ EKLENECEK)

```prisma
model TicketCategory {
  id              Int       @id @default(autoincrement())
  uuid            String    @unique @default(uuid())
  
  name            String    @db.VarChar(255)
  description     String?   @db.Text
  color           String    @default("#3B82F6") @db.VarChar(7)
  
  isActive        Boolean   @default(true) @map("is_active")
  
  // Company scope (opsiyonel - global veya company-specific)
  companyId       Int?      @map("company_id")
  companyUuid     String?   @map("company_uuid")
  
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")
  
  // Relations
  tickets         Ticket[]
  
  @@unique([name, companyId])
  @@index([companyId])
  @@index([deletedAt])
  @@map("ticket_categories")
}
```

#### ticket_attachments (Dosya Ekleri - YENİ EKLENECEK)

```prisma
model TicketAttachment {
  id              Int            @id @default(autoincrement())
  uuid            String         @unique @default(uuid())
  
  // Message relation
  messageId       Int            @map("message_id")
  message         TicketMessage  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  
  // File info
  fileName        String         @map("file_name") @db.VarChar(500)
  fileUrl         String         @map("file_url") @db.VarChar(1000)
  fileSize        BigInt         @map("file_size")
  mimeType        String         @map("mime_type") @db.VarChar(255)
  
  // Metadata
  metadata        Json?          @db.JsonB
  
  uploadedAt      DateTime       @default(now()) @map("uploaded_at")
  deletedAt       DateTime?      @map("deleted_at")
  
  @@index([messageId])
  @@index([deletedAt])
  @@map("ticket_attachments")
}
```

#### ticket_tags (Etiketler - YENİ EKLENECEK)

```prisma
model TicketTag {
  id              Int       @id @default(autoincrement())
  uuid            String    @unique @default(uuid())
  
  ticketId        Int       @map("ticket_id")
  ticket          Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  name            String    @db.VarChar(100)
  color           String    @default("#6B7280") @db.VarChar(7)
  
  createdAt       DateTime  @default(now()) @map("created_at")
  
  @@unique([ticketId, name])
  @@index([ticketId])
  @@index([name])
  @@map("ticket_tags")
}
```

#### ticket_status_history (Durum Geçmişi - YENİ EKLENECEK)

```prisma
model TicketStatusHistory {
  id              Int          @id @default(autoincrement())
  uuid            String       @unique @default(uuid())
  
  ticketId        Int          @map("ticket_id")
  ticket          Ticket       @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  fromStatus      TicketStatus @map("from_status")
  toStatus        TicketStatus @map("to_status")
  
  // Status değiştiren kullanıcı
  changedById     String       @map("changed_by_id")
  changedBy       User         @relation(fields: [changedById], references: [id])
  
  note            String?      @db.Text
  
  createdAt       DateTime     @default(now()) @map("created_at")
  
  @@index([ticketId])
  @@index([createdAt])
  @@map("ticket_status_history")
}
```

#### notifications (Bildirimler - YENİ EKLENECEK)

```prisma
enum NotificationType {
  TICKET_CREATED
  TICKET_ASSIGNED
  TICKET_STATUS_CHANGED
  NEW_MESSAGE
  TICKET_RESOLVED
  TICKET_CLOSED
  MENTION
  
  @@map("notification_type")
}

model Notification {
  id              Int              @id @default(autoincrement())
  uuid            String           @unique @default(uuid())
  
  userId          String           @map("user_id")
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type            NotificationType
  title           String           @db.VarChar(500)
  message         String           @db.Text
  link            String?          @db.VarChar(500)
  
  isRead          Boolean          @default(false) @map("is_read")
  readAt          DateTime?        @map("read_at")
  
  // Related entities
  ticketId        Int?             @map("ticket_id")
  messageId       Int?             @map("message_id")
  
  metadata        Json?            @db.JsonB
  
  createdAt       DateTime         @default(now()) @map("created_at")
  deletedAt       DateTime?        @map("deleted_at")
  
  @@index([userId])
  @@index([isRead])
  @@index([ticketId])
  @@index([createdAt(sort: Desc)])
  @@index([deletedAt])
  @@map("notifications")
}
```

---

## 4. Özellikler ve Modüller

### 4.1 Phase 1 - MVP (Minimum Viable Product)

#### Modül 1: Kullanıcı Yönetimi ve Authentication

**Özellikler:**
- Kullanıcı kaydı (email + şifre)
- Giriş yapma (JWT token tabanlı)
- Şifre sıfırlama (email ile)
- Profil yönetimi (bilgi güncelleme, avatar yükleme)
- Rol bazlı yetkilendirme (Admin, Agent, Customer)
- Email doğrulama
- Session yönetimi

**Teknik Gereksinimler:**
- Better Auth kullanımı (mevcut boilerplate'te hazır)
- Session-based authentication (database sessions)
- Email gönderimi (React Email + SMTP)
- Input validasyonu (Zod schemas)
- OAuth desteği (opsiyonel - Better Auth ile hazır)

#### Modül 2: Ticket Yönetim Sistemi

**Özellikler:**
- Ticket oluşturma (başlık, açıklama, öncelik, kategori)
- Ticket listeleme (filtreleme, sıralama, arama, pagination)
- Ticket detay görüntüleme
- Ticket durumu güncelleme (Open → In Progress → Resolved → Closed)
- Ticket öncelik belirleme (Low, Medium, High, Urgent)
- Agent'a ticket atama (manuel/otomatik)
- Ticket numarası otomatik oluşturma (örn: TKT-2026-001234)

**İş Kuralları:**
- Customer sadece kendi ticket'larını görebilir
- Agent atanmış ticket'ları görebilir
- Admin tüm ticket'ları görebilir
- Ticket kapatıldıktan sonra tekrar açılabilir
- Status geçişleri loglanmalı

#### Modül 3: Mesajlaşma Sistemi

**Özellikler:**
- Ticket'a mesaj ekleme
- Mesaj listesi (zaman sıralı)
- Dosya ekleme (resim, PDF, Word, vb.)
- Internal notlar (sadece agent'lar arası)
- Gerçek zamanlı mesaj bildirimleri (Socket.io)
- Mesaj okundu bilgisi

**Teknik Gereksinimler:**
- Dosya boyutu limiti: 5MB (yapılandırılabilir)
- İzin verilen dosya tipleri: image/*, application/pdf, .doc, .docx
- Dosya storage: Elysia Static (local) / S3 (production)
- WebSocket bağlantısı (Native Bun WebSocket - mevcut)
- Mevcut FileLibraryAsset sistemi ile entegrasyon

#### Modül 4: Dashboard ve Raporlama

**Customer Dashboard:**
- Toplam ticket sayısı
- Açık ticket sayısı
- Çözülen ticket sayısı
- Son ticket'lar listesi

**Agent Dashboard:**
- Atanmış ticket'lar
- Bekleyen ticket'lar
- Bugün çözülen ticket'lar
- Ortalama yanıt süresi

**Admin Dashboard:**
- Genel istatistikler (toplam ticket, kullanıcı, vb.)
- Ticket durum dağılımı (pie chart)
- Ticket öncelik dağılımı (bar chart)
- Zaman içinde ticket trendi (line chart)
- Agent performans metrikleri

### 4.2 Phase 2 - Gelişmiş Özellikler

#### Modül 5: Bildirim Sistemi

**Özellikler:**
- Gerçek zamanlı in-app bildirimler
- Email bildirimleri
- Bildirim tercihleri (kullanıcı ayarları)
- Bildirim geçmişi

**Bildirim Tipleri:**
- Yeni ticket oluşturuldu
- Ticket'a yeni mesaj geldi
- Ticket durumu değişti
- Ticket size atandı
- Ticket çözüldü/kapatıldı

#### Modül 6: Gelişmiş Raporlama

**Özellikler:**
- Agent performans raporları
- Yanıt süresi analizi
- Çözüm süresi analizi
- Kategori bazlı istatistikler
- Zaman dilimi bazlı raporlar
- Excel/PDF export

#### Modül 7: Admin Paneli

**Özellikler:**
- Kullanıcı yönetimi (CRUD)
- Rol atama/değiştirme
- Kategori yönetimi
- Sistem ayarları
- Email template yönetimi
- Audit log görüntüleme

### 4.3 Phase 3 - İleri Seviye (Gelecek Versiyonlar)

- Canned responses (hazır yanıt şablonları)
- SLA (Service Level Agreement) takibi
- Bilgi bankası (Knowledge Base)
- Multi-language desteği
- Dark mode (Tailwind CSS ile kolay)
- Gelişmiş arama (Full-text search)
- Webhook entegrasyonları
- API rate limiting (gelişmiş)
- Ticket automation (rules engine)
- Customer satisfaction surveys
- Live chat widget

### 4.4 Permission Sistemi (Mevcut RBAC Üzerine)

**Ticket System için Yeni Permissions:**

```typescript
// apps/api/src/modules/tickets/constants.ts
export const TICKET_PERMISSIONS = {
  // Ticket CRUD
  'tickets:create': 'Ticket oluşturma',
  'tickets:list-all': 'Tüm ticket\'ları listeleme',
  'tickets:list-own': 'Kendi ticket\'larını listeleme',
  'tickets:list-assigned': 'Atanmış ticket\'ları listeleme',
  'tickets:show-all': 'Tüm ticket\'ları görüntüleme',
  'tickets:show-own': 'Kendi ticket\'larını görüntüleme',
  'tickets:show-assigned': 'Atanmış ticket\'ları görüntüleme',
  'tickets:update-all': 'Tüm ticket\'ları güncelleme',
  'tickets:update-own': 'Kendi ticket\'larını güncelleme',
  'tickets:update-assigned': 'Atanmış ticket\'ları güncelleme',
  'tickets:delete-all': 'Tüm ticket\'ları silme',
  'tickets:delete-own': 'Kendi ticket\'larını silme',
  
  // Ticket Operations
  'tickets:assign': 'Ticket atama',
  'tickets:change-status': 'Ticket durumu değiştirme',
  'tickets:change-priority': 'Ticket önceliği değiştirme',
  
  // Messages
  'messages:create': 'Mesaj oluşturma',
  'messages:create-internal': 'Internal note oluşturma',
  'messages:view-internal': 'Internal note\'ları görüntüleme',
  'messages:update-own': 'Kendi mesajlarını güncelleme',
  'messages:delete-own': 'Kendi mesajlarını silme',
  
  // Categories & Tags
  'categories:manage': 'Kategori yönetimi',
  'tags:manage': 'Etiket yönetimi',
  
  // Analytics
  'analytics:view-all': 'Tüm analytics görüntüleme',
  'analytics:view-own': 'Kendi analytics görüntüleme',
} as const

// Rol bazlı permission atamaları
export const ROLE_PERMISSIONS = {
  CUSTOMER: [
    'tickets:create',
    'tickets:list-own',
    'tickets:show-own',
    'tickets:update-own',
    'messages:create',
    'messages:update-own',
    'messages:delete-own',
  ],
  
  AGENT: [
    'tickets:list-assigned',
    'tickets:show-assigned',
    'tickets:update-assigned',
    'tickets:assign',
    'tickets:change-status',
    'tickets:change-priority',
    'messages:create',
    'messages:create-internal',
    'messages:view-internal',
    'messages:update-own',
    'analytics:view-own',
  ],
  
  ADMIN: [
    'tickets:*', // Wildcard - tüm ticket permissions
    'messages:*',
    'categories:manage',
    'tags:manage',
    'analytics:view-all',
  ],
} as const
```

**Permission Check Middleware:**

```typescript
// apps/api/src/modules/tickets/middleware.ts
import { Elysia } from 'elysia'
import { checkPermission } from '@/modules/auth/authorization/permissions'

export const requireTicketPermission = (permission: string) =>
  new Elysia()
    .derive(async ({ user, error }) => {
      if (!user) {
        return error(401, 'Unauthorized')
      }
      
      const hasPermission = await checkPermission(user.id, permission)
      
      if (!hasPermission) {
        return error(403, 'Insufficient permissions')
      }
      
      return { user }
    })

// Kullanım
app.get('/tickets', async ({ user }) => {
  // Permission check yapıldı, güvenli şekilde devam et
  return await ticketService.list(user.id)
}, {
  beforeHandle: requireTicketPermission('tickets:list-all')
})
```

---

## 5. Geliştirme Planı

### 5.1 Geliştirme Metodolojisi

**Agile/Scrum Yaklaşımı:**
- Sprint süresi: 1 hafta
- Toplam sprint sayısı: 10 (Boilerplate mevcut olduğu için daha kısa)
- Sprint planning, daily standup, sprint review, retrospective

### 5.2 Sprint Planı Özeti

**Not:** Boilerplate'te zaten mevcut olan özellikler:
- ✅ Authentication & Authorization (Better Auth + RBAC)
- ✅ User Management
- ✅ Company Management (Multi-tenancy)
- ✅ Role & Permission System
- ✅ File Upload System
- ✅ Audit Logs
- ✅ Dashboard Layout & Navigation
- ✅ WebSocket Infrastructure

| Sprint | Hafta | Frontend Modüller | Backend Modüller | Teslim Edilen Özellikler |
|--------|-------|-------------------|------------------|--------------------------|
| 1 | 1 | Prisma schema güncelleme | Ticket models ekleme | Database schema hazır |
| 2 | 2 | Ticket list sayfası, Filters | Ticket CRUD API, Service | Ticket listeleme ve filtreleme |
| 3 | 3 | Ticket detail sayfası | Ticket detail API, Assignment | Ticket detay ve atama |
| 4 | 4 | Ticket create/edit forms | Ticket validation, Permissions | Ticket oluşturma ve düzenleme |
| 5 | 5 | Message UI component | Message API, Attachment API | Mesajlaşma sistemi |
| 6 | 6 | Real-time message updates | WebSocket integration | Gerçek zamanlı mesajlaşma |
| 7 | 7 | Category & Tag management | Category API, Tag API | Kategori ve etiket sistemi |
| 8 | 8 | Notification UI | Notification API, Email service | Bildirim sistemi |
| 9 | 9 | Analytics dashboard | Analytics API, Reports | İstatistikler ve raporlar |
| 10 | 10 | UI polish, Testing | Performance optimization, Docs | Production deployment |

**Önemli Notlar:**
- Sprint 1-2: Database ve temel CRUD işlemleri
- Sprint 3-4: Ticket yönetimi ve form işlemleri
- Sprint 5-6: Mesajlaşma ve real-time özellikler
- Sprint 7-8: Yardımcı sistemler (kategori, bildirim)
- Sprint 9-10: Analytics ve final optimizasyonlar

### 5.3 Kritik Yol (Critical Path)

```
Proje Başlangıç (Boilerplate Hazır ✅)
    ↓
Database Schema Güncelleme (Hafta 1)
    ↓
Ticket CRUD İşlemleri (Hafta 2-4)
    ↓
Mesajlaşma Sistemi (Hafta 5-6)
    ↓
Real-time İletişim (Hafta 6)
    ↓
Bildirim Sistemi (Hafta 7-8)
    ↓
Dashboard ve Raporlama (Hafta 9)
    ↓
Testing ve Optimizasyon (Hafta 10)
    ↓
Production Deployment
```

**Paralel Geliştirme Fırsatları:**
- Ticket UI ve API aynı anda geliştirilebilir
- Category/Tag sistemi mesajlaşma ile paralel
- Analytics dashboard ticket sistemi tamamlandıktan sonra başlayabilir

### 5.4 Risk Yönetimi

| Risk | Olasılık | Etki | Önlem |
|------|----------|------|-------|
| Teknoloji değişikliği gerekliliği | Orta | Yüksek | Esnek mimari tasarımı |
| Performans sorunları | Düşük | Yüksek | Erken performans testleri |
| Güvenlik açıkları | Orta | Çok Yüksek | Security audit, penetration testing |
| Kapsam genişlemesi | Yüksek | Orta | Sıkı kapsam yönetimi |
| Entegrasyon sorunları | Orta | Orta | Erken entegrasyon testleri |

---

## 6. Teknik Standartlar

### 6.1 Kod Standartları

**İsimlendirme Kuralları:**
- **Değişkenler ve Fonksiyonlar:** camelCase (örn: `getUserById`, `ticketList`)
- **Class ve Component'ler:** PascalCase (örn: `UserService`, `TicketCard`)
- **Sabitler:** UPPER_SNAKE_CASE (örn: `MAX_FILE_SIZE`, `API_BASE_URL`)
- **Dosya adları:** kebab-case (örn: `ticket-service.ts`, `user-card.tsx`)
- **Route dosyaları:** TanStack Router convention (örn: `_authenticated/tickets/$uuid.tsx`)

**Kod Formatı:**
- Indentation: 2 spaces (tab)
- Quotes: Single quotes (') - Biome default
- Semicolons: Opsiyonel (Biome'a göre)
- Max line length: 120 karakter
- Biome kullanımı zorunlu (ESLint + Prettier yerine)

**TypeScript Standartları:**
```typescript
// Type-safe service örneği
import type { Ticket, TicketStatus } from '@onlyjs/db'
import { db } from '@onlyjs/db'

/**
 * Kullanıcı ID'sine göre ticket'ları getirir
 */
export async function getUserTickets(
  userId: string,
  filters: {
    status?: TicketStatus
    page?: number
    limit?: number
  }
): Promise<{ data: Ticket[]; total: number }> {
  const { status, page = 1, limit = 10 } = filters
  
  const where = {
    customerId: userId,
    ...(status && { status }),
    deletedAt: null
  }
  
  const [data, total] = await Promise.all([
    db.ticket.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    db.ticket.count({ where })
  ])
  
  return { data, total }
}
```

**Zod Validation Örneği:**
```typescript
import { t } from 'elysia'

export const createTicketDto = t.Object({
  subject: t.String({ minLength: 5, maxLength: 500 }),
  description: t.String({ minLength: 10 }),
  priority: t.Enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  categoryId: t.Optional(t.Number())
})
```

### 6.2 Git Workflow

**Branch Stratejisi:**
```
main (production)
  └── develop (development)
       ├── feature/ticket-system
       ├── feature/ticket-messages
       ├── feature/ticket-analytics
       ├── bugfix/ticket-assignment
       └── hotfix/critical-security-fix
```

**Branch İsimlendirme:**
- `feature/[feature-name]` - Yeni özellik (örn: `feature/ticket-system`)
- `bugfix/[bug-name]` - Bug düzeltme (örn: `bugfix/message-attachment`)
- `hotfix/[issue]` - Acil düzeltme (örn: `hotfix/auth-bypass`)
- `refactor/[module]` - Refactoring (örn: `refactor/ticket-service`)
- `docs/[topic]` - Dokümantasyon (örn: `docs/api-endpoints`)

**Commit Message Convention (Conventional Commits):**
```
type(scope): subject

[optional body]

[optional footer]
```

**Commit Types:**
- `feat`: Yeni özellik
- `fix`: Bug düzeltme
- `docs`: Dokümantasyon
- `style`: Kod formatı (Biome)
- `refactor`: Refactoring
- `test`: Test ekleme
- `chore`: Build, config, dependencies
- `perf`: Performance iyileştirme

**Scope Örnekleri:**
- `ticket`: Ticket modülü
- `message`: Message modülü
- `auth`: Authentication
- `api`: Backend API
- `web`: Frontend
- `db`: Database/Prisma

**Örnek Commit:**
```
feat(ticket): implement ticket creation and assignment

- Add ticket CRUD endpoints
- Add ticket number generation
- Implement agent assignment logic
- Add permission checks for ticket operations
- Add Zod validation schemas

Closes #45
```

**Monorepo Commit Örnekleri:**
```
feat(api/tickets): add ticket filtering and pagination
fix(web/tickets): resolve ticket list rendering issue
chore(db): add ticket-related Prisma models
docs(api): update ticket API documentation
```

### 6.3 API Standartları

**Response Format (Elysia.js):**

```typescript
// Success Response (Direct return)
return {
  uuid: "123e4567-e89b-12d3-a456-426614174000",
  ticketNumber: "TKT-2026-001234",
  subject: "Test Ticket",
  status: "OPEN"
}

// Error Response (Elysia error handling)
throw new Error('Validation failed')
// veya
return error(400, {
  message: 'Validation failed',
  errors: [
    { field: 'subject', message: 'Subject is required' }
  ]
})

// Paginated Response (Custom utility)
import { paginatedResponse } from '@/utils/pagination'

return paginatedResponse({
  data: tickets,
  page: 1,
  limit: 10,
  total: 100
})

// Output:
{
  data: [...],
  meta: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10,
    hasNextPage: true,
    hasPrevPage: false
  }
}
```

**Elysia Error Handling:**
```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
  .onError(({ code, error, set }) => {
    switch (code) {
      case 'VALIDATION':
        set.status = 400
        return {
          message: 'Validation error',
          errors: error.all
        }
      
      case 'NOT_FOUND':
        set.status = 404
        return { message: 'Resource not found' }
      
      case 'UNAUTHORIZED':
        set.status = 401
        return { message: 'Unauthorized' }
      
      default:
        set.status = 500
        return { message: 'Internal server error' }
    }
  })
```

**HTTP Status Codes:**
- `200 OK` - Başarılı GET, PUT, PATCH
- `201 Created` - Başarılı POST
- `204 No Content` - Başarılı DELETE
- `400 Bad Request` - Validation hatası
- `401 Unauthorized` - Authentication hatası
- `403 Forbidden` - Authorization hatası
- `404 Not Found` - Kaynak bulunamadı
- `409 Conflict` - Çakışma (örn: duplicate email)
- `500 Internal Server Error` - Server hatası

### 6.4 Testing Standartları

**Test Coverage Hedefi:**
- Genel coverage: Minimum %70
- Kritik modüller (auth, tickets, permissions): Minimum %85
- Utility fonksiyonlar: %100
- Services: Minimum %80

**Test Tipleri:**

**Frontend (Bun Test):**
- Unit Tests: Component'ler, hooks, utilities
- Integration Tests: User flows, API integration
- E2E Tests: Critical paths (Playwright/Cypress)

**Backend (Bun Test):**
- Unit Tests: Services, utilities, formatters
- Integration Tests: API endpoints (Elysia test utilities)
- Load Tests: Performance (k6)

**Test Örneği (Bun Test):**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { treaty } from '@elysiajs/eden'
import type { App } from '../src/index'
import { db } from '@onlyjs/db'

describe('TicketService', () => {
  let api: ReturnType<typeof treaty<App>>
  let testUser: any
  
  beforeAll(async () => {
    // Test setup
    testUser = await db.user.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        scope: 'COMPANY'
      }
    })
  })
  
  afterAll(async () => {
    // Cleanup
    await db.user.delete({ where: { id: testUser.id } })
  })
  
  describe('createTicket', () => {
    it('should create a new ticket with valid data', async () => {
      const ticketData = {
        subject: 'Test Ticket',
        description: 'Test Description',
        priority: 'HIGH' as const
      }
      
      const { data, error } = await api.tickets.post(ticketData)
      
      expect(error).toBeNull()
      expect(data).toHaveProperty('uuid')
      expect(data?.subject).toBe(ticketData.subject)
      expect(data?.status).toBe('OPEN')
      expect(data?.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/)
    })

    it('should reject ticket with invalid data', async () => {
      const invalidData = { subject: 'ab' } // Too short
      
      const { data, error } = await api.tickets.post(invalidData as any)
      
      expect(error).toBeDefined()
      expect(error?.status).toBe(400)
      expect(error?.value).toContain('subject')
    })
    
    it('should enforce permission checks', async () => {
      // Test without proper permissions
      const { error } = await api.tickets.post({
        subject: 'Test',
        description: 'Test'
      })
      
      expect(error?.status).toBe(403)
    })
  })
  
  describe('assignTicket', () => {
    it('should assign ticket to agent', async () => {
      const ticket = await createTestTicket()
      const agent = await createTestAgent()
      
      const { data, error } = await api.tickets({ uuid: ticket.uuid })
        .assign.put({ agentId: agent.id })
      
      expect(error).toBeNull()
      expect(data?.assignedAgentId).toBe(agent.id)
    })
  })
})
```

**Elysia Test Utilities:**
```typescript
import { Elysia } from 'elysia'
import { ticketModule } from './modules/tickets'

const app = new Elysia()
  .use(ticketModule)

// Test endpoint
const response = await app.handle(
  new Request('http://localhost/api/tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    body: JSON.stringify({
      subject: 'Test Ticket',
      description: 'Test Description'
    })
  })
)

expect(response.status).toBe(201)
```

---

## 7. Güvenlik ve Performans

### 7.1 Güvenlik Önlemleri

**Authentication & Authorization:**
- Better Auth kullanımı (session-based)
- Database session management
- Şifre hashleme (Better Auth - bcrypt)
- Rate limiting (Elysia middleware)
- CORS yapılandırması (Elysia CORS plugin)
- XSS koruması (input sanitization)
- SQL Injection koruması (Prisma ORM)
- CSRF koruması (Better Auth built-in)
- Role-Based Access Control (RBAC) - mevcut sistem
- Permission-based authorization - mevcut sistem

**Data Protection:**
- HTTPS zorunlu (production)
- Hassas veri şifreleme (database level)
- Input sanitization
- Output encoding
- File upload validasyonu (type, size)

**Security Headers (Elysia):**
```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
  .onBeforeHandle(({ set }) => {
    // Security headers
    set.headers['X-Content-Type-Options'] = 'nosniff'
    set.headers['X-Frame-Options'] = 'DENY'
    set.headers['X-XSS-Protection'] = '1; mode=block'
    set.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    set.headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'",
      "img-src 'self' data: https:",
    ].join('; ')
  })
```

**Rate Limiting:**
```typescript
import { rateLimit } from 'elysia-rate-limit'

const app = new Elysia()
  .use(rateLimit({
    duration: 60000, // 1 dakika
    max: 100, // 100 request
    skip: (request) => {
      // Admin kullanıcıları atla
      return request.headers.get('x-admin-bypass') === 'true'
    }
  }))
```

### 7.2 Performans Optimizasyonu

**Frontend:**
- Code splitting (TanStack Router - automatic)
- Lazy loading (React.lazy, images)
- Memoization (React.memo, useMemo, useCallback)
- Virtual scrolling (TanStack Virtual)
- Image optimization (WebP format, lazy load)
- Bundle size optimization (Vite)
- TanStack Query caching (stale-while-revalidate)
- Optimistic updates (TanStack Query)
- Suspense boundaries (React 19)

**Backend:**
- Database indexing (Prisma)
- Query optimization (Prisma)
- Connection pooling (Prisma - automatic)
- Caching (KvStore model - database-based cache)
- Response compression (Bun - automatic)
- API pagination (default: 10 items/page)
- Async operations (email, notifications)
- Bun runtime performance (3x faster than Node.js)
- Elysia.js performance (type-safe, minimal overhead)

**Database Optimization (Prisma):**

```prisma
// Prisma schema'da index tanımları
model Ticket {
  // ... fields ...
  
  @@index([customerId])
  @@index([assignedAgentId])
  @@index([companyId])
  @@index([status])
  @@index([priority])
  @@index([categoryId])
  @@index([createdAt(sort: Desc)])
  @@index([deletedAt])
}
```

```typescript
// Query optimization örneği
// ❌ Yavaş - N+1 problem
const tickets = await db.ticket.findMany()
for (const ticket of tickets) {
  const customer = await db.user.findUnique({ where: { id: ticket.customerId } })
}

// ✅ Hızlı - Eager loading
const tickets = await db.ticket.findMany({
  where: {
    customerId: userId,
    status: { not: 'CLOSED' },
    deletedAt: null
  },
  select: {
    uuid: true,
    ticketNumber: true,
    subject: true,
    status: true,
    priority: true,
    createdAt: true,
    customer: {
      select: {
        uuid: true,
        name: true,
        email: true
      }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 10
})

// ✅ Pagination with cursor
const tickets = await db.ticket.findMany({
  take: 10,
  skip: 1, // Skip cursor
  cursor: { id: lastTicketId },
  orderBy: { createdAt: 'desc' }
})
```

### 7.3 Monitoring ve Logging

**Logging Stratejisi:**
- Console logging (Bun native)
- Log levels: error, warn, info, debug
- Structured logging (JSON format)
- Request/Response logging (Elysia middleware)
- Error stack traces
- Performance metrics (Bun.nanoseconds())
- Audit logs (database-based - mevcut sistem)

```typescript
// Elysia logging middleware
import { Elysia } from 'elysia'

const app = new Elysia()
  .onRequest(({ request }) => {
    console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`)
  })
  .onError(({ error, code }) => {
    console.error(`[ERROR] ${code}:`, error)
    
    // Audit log'a kaydet
    if (code !== 'NOT_FOUND') {
      await db.auditLog.create({
        data: {
          actionType: 'ERROR',
          entityType: 'SYSTEM',
          description: error.message,
          metadata: { code, stack: error.stack }
        }
      })
    }
  })
```

**Monitoring:**
- Application monitoring (Sentry - opsiyonel)
- Database monitoring (Prisma metrics)
- API response time tracking (Elysia onAfterHandle)
- Error rate tracking (custom middleware)
- User activity tracking (AuditLog model - mevcut)
- WebSocket connection monitoring

---

## 8. Deployment Stratejisi

### 8.1 Deployment Ortamları

**Development:**
- Local development
- Hot reload aktif
- Debug mode aktif
- Test database

**Staging:**
- Production benzeri ortam
- Her PR merge'de otomatik deploy
- Integration testleri
- UAT (User Acceptance Testing)

**Production:**
- Manual approval ile deploy
- Blue-green deployment
- Rollback planı
- Production database

### 8.2 CI/CD Pipeline

**GitHub Actions Workflow (Turborepo + Bun):**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.3.4
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Run Biome (lint & format)
        run: bun run format-and-lint
      
      - name: Run tests
        run: bun test
      
      - name: Check TypeScript
        run: bun run tsc --noEmit

  build:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Build packages
        run: bun run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy API to Railway (Staging)
        run: railway up --service api --environment staging
      
      - name: Deploy Web to Vercel (Staging)
        run: vercel deploy --prebuilt --env staging
      
      - name: Run smoke tests
        run: bun run test:e2e

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy API to Railway (Production)
        run: railway up --service api --environment production
      
      - name: Deploy Web to Vercel (Production)
        run: vercel deploy --prebuilt --prod
      
      - name: Run smoke tests
        run: bun run test:e2e:prod
      
      - name: Notify team (Discord/Slack)
        run: |
          curl -X POST ${{ secrets.DISCORD_WEBHOOK }} \
            -H "Content-Type: application/json" \
            -d '{"content": "✅ Production deployment successful!"}'
```

**Turborepo Cache:**
```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": true
    },
    "test": {
      "cache": true,
      "outputs": ["coverage/**"]
    }
  }
}
```

### 8.3 Environment Variables

**Monorepo Environment Structure:**
```
config/
├── apps/
│   ├── web/.env          # Frontend environment
│   └── api/.env          # Backend environment
└── .env.example          # Example file
```

**Frontend (.env) - config/apps/web/.env:**
```env
# API Configuration
VITE_API_URL=https://api.helpdesk.com
VITE_WS_URL=wss://api.helpdesk.com

# App Configuration
VITE_APP_NAME=HelpDesk Pro
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_WEBSOCKET=true

# File Upload
VITE_MAX_FILE_SIZE=5242880
VITE_ALLOWED_FILE_TYPES=image/*,application/pdf,.doc,.docx
```

**Backend (.env) - config/apps/api/.env:**
```env
# Environment
NODE_ENV=production
PORT=3000

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/helpdesk_db?schema=public&connection_limit=10

# Better Auth
BETTER_AUTH_SECRET=***
BETTER_AUTH_URL=https://api.helpdesk.com

# CORS
CORS_ORIGIN=https://helpdesk.com,https://www.helpdesk.com

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=***
SMTP_PASS=***
SMTP_FROM=noreply@helpdesk.com

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# WebSocket
WS_PORT=3001
WS_PATH=/ws

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_DURATION=60000

# Logging
LOG_LEVEL=info

# Feature Flags
ENABLE_AUDIT_LOGS=true
ENABLE_EMAIL_NOTIFICATIONS=true
```

**dotenvx Kullanımı:**
```bash
# Development
bun --bun dotenvx run --quiet -f ../../config/apps/api/.env -- bun run dev

# Production (encrypted)
dotenvx run --env-file=.env.production -- bun run start
```

### 8.4 Deployment Checklist

**Pre-Deployment:**
- [ ] Tüm testler geçiyor
- [ ] Code review tamamlandı
- [ ] Security audit yapıldı
- [ ] Performance testleri yapıldı
- [ ] Database migration hazır
- [ ] Environment variables ayarlandı
- [ ] Backup alındı

**Deployment:**
- [ ] Database migration çalıştırıldı
- [ ] Frontend deploy edildi
- [ ] Backend deploy edildi
- [ ] Smoke tests geçti
- [ ] Health check OK

**Post-Deployment:**
- [ ] Monitoring aktif
- [ ] Error tracking çalışıyor
- [ ] Performance metrikleri normal
- [ ] Kullanıcı bildirimleri gönderildi
- [ ] Dokümantasyon güncellendi

---

## 9. Ek Bilgiler

### 9.1 Teknik Kısıtlamalar

**Sistem Gereksinimleri:**
- Minimum Bun: v1.3.0
- Minimum PostgreSQL: v16.0
- Minimum RAM: 1GB (development), 2GB (production)
- Disk Space: 5GB (database + uploads)
- CPU: 2 cores minimum (4 cores önerilen)

**Browser Desteği:**
- Chrome: Son 2 versiyon
- Firefox: Son 2 versiyon
- Safari: Son 2 versiyon
- Edge: Son 2 versiyon
- Mobile: iOS Safari 14+, Chrome Android 90+

**API Rate Limits:**
- Authenticated users: 100 requests / 15 dakika
- Unauthenticated: 20 requests / 15 dakika
- File upload: 10 requests / saat

### 9.2 Veri Saklama Politikaları

**Retention Policies:**
- Ticket'lar: Sınırsız (silinmez, arşivlenir)
- Messages: Sınırsız
- Attachments: 2 yıl (sonra arşiv storage)
- Notifications: 30 gün
- Audit logs: 1 yıl
- User data: Hesap silinene kadar

**GDPR Uyumluluğu:**
- Kullanıcı verisi export (JSON format)
- Kullanıcı verisi silme (right to be forgotten)
- Veri işleme onayı
- Privacy policy ve terms of service

### 9.3 Başarı Metrikleri (KPIs)

**Teknik Metrikler:**
- API yanıt süresi: < 200ms (p95)
- Page load time: < 2 saniye
- Uptime: %99.9
- Error rate: < %0.1
- Test coverage: > %70

**İş Metrikleri:**
- Ticket çözüm süresi
- İlk yanıt süresi
- Agent productivity
- Customer satisfaction score
- Ticket volume trends

---

## 10. Sonuç ve Onay

### 10.1 Proje Teslim Kriterleri

Proje aşağıdaki kriterleri karşıladığında tamamlanmış sayılacaktır:

✓ Tüm Phase 1 özellikleri çalışır durumda  
✓ Responsive tasarım tamamlandı  
✓ Test coverage %70'in üzerinde  
✓ API dokümantasyonu tamamlandı  
✓ Security audit geçildi  
✓ Performance testleri başarılı  
✓ Production deployment tamamlandı  
✓ Kullanıcı dokümantasyonu hazır  

### 10.2 Gelecek Planları

**Versiyon 1.1 (3 ay sonra):**
- Canned responses
- Ticket tags
- Advanced search
- Email template editor

**Versiyon 2.0 (6 ay sonra):**
- Knowledge base
- Live chat widget
- Mobile app
- Multi-language support

### 10.3 Döküman Onayları

| Rol | İsim | İmza | Tarih |
|-----|------|------|-------|
| Proje Yöneticisi | [İsim] | | |
| Teknik Lider | [İsim] | | |
| Frontend Lead | [İsim] | | |
| Backend Lead | [İsim] | | |

---

## Ekler

### Ek A: Glossary (Terimler Sözlüğü)

**Proje Terimleri:**
- **Ticket:** Müşteri destek talebi
- **Agent:** Destek temsilcisi
- **Customer:** Müşteri, ticket oluşturan kullanıcı
- **SLA:** Service Level Agreement (Hizmet Seviyesi Anlaşması)
- **Internal Note:** Sadece agent'lar arası görünen mesaj

**Teknik Terimler:**
- **Monorepo:** Tek bir repository'de birden fazla proje/paket barındırma
- **Turborepo:** Monorepo build sistemi ve task orchestrator
- **Bun:** Ultra-hızlı JavaScript runtime ve package manager
- **Elysia.js:** Type-safe web framework (Bun için optimize)
- **Eden Treaty:** Type-safe API client (Elysia için)
- **Better Auth:** Modern authentication library
- **Prisma:** Type-safe ORM (Object-Relational Mapping)
- **Prismabox:** Prisma için TypeBox schema generator
- **TanStack Router:** Type-safe routing library
- **TanStack Query:** Server state management library
- **Zustand:** Lightweight state management
- **RBAC:** Role-Based Access Control
- **CRUD:** Create, Read, Update, Delete
- **MVP:** Minimum Viable Product
- **SSR:** Server-Side Rendering
- **CSR:** Client-Side Rendering
- **WebSocket:** İki yönlü real-time iletişim protokolü
- **Multi-tenancy:** Tek sistemde birden fazla organizasyon desteği

### Ek B: Referanslar

**Framework & Runtime:**
- [Bun Documentation](https://bun.sh/docs)
- [Elysia.js Documentation](https://elysiajs.com)
- [React 19 Documentation](https://react.dev)
- [Turborepo Documentation](https://turbo.build/repo/docs)

**Database & ORM:**
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prismabox Documentation](https://github.com/prisma/prismabox)

**Frontend Libraries:**
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [Radix UI](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://zustand-demo.pmnd.rs)

**Authentication & Authorization:**
- [Better Auth Documentation](https://www.better-auth.com)
- [RBAC Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)

**Development Tools:**
- [Biome Documentation](https://biomejs.dev)
- [Vite Documentation](https://vitejs.dev)

**Best Practices:**
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Monorepo Best Practices](https://monorepo.tools)
- [API Design Best Practices](https://swagger.io/resources/articles/best-practices-in-api-design/)

### Ek C: İletişim

**Proje Ekibi:**
- Email: [proje-email]
- Slack: [kanal]
- GitHub: [repository-link]

---

---

## 11. Geliştirme Başlangıç Kılavuzu

### 11.1 Proje Kurulumu

**Gereksinimler:**
```bash
# Bun kurulumu
curl -fsSL https://bun.sh/install | bash

# PostgreSQL kurulumu (Docker ile)
docker run -d \
  --name helpdesk-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=helpdesk_db \
  -p 5432:5432 \
  postgres:16
```

**Proje Klonlama ve Kurulum:**
```bash
# Repository klonlama
git clone <repository-url>
cd support-ticket-system

# Dependencies kurulumu
bun install

# Environment dosyalarını oluştur
cp config/apps/api/.env.example config/apps/api/.env
cp config/apps/web/.env.example config/apps/web/.env

# Database URL'i güncelle (config/apps/api/.env)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/helpdesk_db"

# Prisma migration
cd packages/database
bun run prisma migrate dev

# Seed data (opsiyonel)
bun run prisma db seed
```

**Development Server:**
```bash
# Tüm servisleri başlat (web + api)
bun run dev

# Sadece frontend
bun run dev:web

# Sadece backend
bun run dev:api
```

**Erişim:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger Docs: http://localhost:3000/swagger

### 11.2 İlk Adımlar (Ticket System Geliştirme)

**1. Prisma Schema Güncelleme:**
```bash
# packages/database/schema.prisma dosyasına ticket modellerini ekle
# Yukarıdaki "3.2 Tablo Detayları" bölümündeki Prisma modellerini kullan

# Migration oluştur
cd packages/database
bun run prisma migrate dev --name add_ticket_system

# Prisma client'ı yeniden oluştur
bun run prisma generate
```

**2. Backend Modül Oluşturma:**
```bash
# Ticket modülü için dizin yapısı
mkdir -p apps/api/src/modules/tickets
cd apps/api/src/modules/tickets

# Dosyaları oluştur
touch controller.ts service.ts dtos.ts formatters.ts types.ts index.ts
```

**3. Modül Yapısı Örneği:**
```typescript
// apps/api/src/modules/tickets/index.ts
import { Elysia } from 'elysia'
import { ticketController } from './controller'

export const ticketModule = new Elysia({ prefix: '/tickets' })
  .use(ticketController)

// apps/api/src/index.ts içine ekle
import { ticketModule } from './modules/tickets'

const app = new Elysia()
  .use(ticketModule)
  // ... diğer modüller
```

**4. Frontend Route Oluşturma:**
```bash
# Ticket routes
mkdir -p apps/web/src/routes/_authenticated/tickets

# Route dosyaları
touch apps/web/src/routes/_authenticated/tickets/index.tsx
touch apps/web/src/routes/_authenticated/tickets/$uuid.tsx
touch apps/web/src/routes/_authenticated/tickets/create.tsx
```

**5. Type-Safe API Client:**
```typescript
// apps/web/src/lib/api.ts içinde otomatik olarak kullanılabilir
import { api } from '@/lib/api'

// Ticket listesi
const { data } = await api.tickets.get()

// Ticket detayı
const ticket = await api.tickets({ uuid }).get()

// Yeni ticket
const newTicket = await api.tickets.post({
  subject: 'Test',
  description: 'Test description',
  priority: 'HIGH'
})
```

### 11.3 Geliştirme Komutları

**Build:**
```bash
# Tüm projeyi build et
bun run build

# Sadece API
bun run build:api

# Sadece Web
bun run build:web
```

**Linting & Formatting:**
```bash
# Biome check
bun run format-and-lint

# Biome fix
bun run format-and-lint:fix
```

**Testing:**
```bash
# Tüm testleri çalıştır
bun test

# Watch mode
bun test --watch

# Coverage
bun test --coverage
```

**Database:**
```bash
# Prisma Studio (database GUI)
cd packages/database
bun run prisma studio

# Migration oluştur
bun run prisma migrate dev --name migration_name

# Migration uygula (production)
bun run prisma migrate deploy

# Reset database
bun run prisma migrate reset
```

### 11.4 Yararlı Kaynaklar

**Dokümantasyon:**
- [Elysia.js Docs](https://elysiajs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [Better Auth](https://www.better-auth.com)
- [Bun Docs](https://bun.sh/docs)

**Boilerplate Örnekleri:**
- Mevcut modüllere bakın: `apps/api/src/modules/users`, `apps/api/src/modules/companies`
- Frontend route örnekleri: `apps/web/src/routes/_authenticated/users`

---

**Döküman Sonu**

*Bu döküman, HelpDesk Pro projesinin teknik spesifikasyonlarını ve geliştirme planını içermektedir. Proje ilerledikçe güncellenecektir.*

**Versiyon:** 2.0.0 (Boilerplate-based)  
**Tarih:** 19 Şubat 2026  
**Hazırlayan:** [İsim]  
**Onaylayan:** [İsim]
