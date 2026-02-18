import { faker } from '@faker-js/faker';
import { TicketPriority, TicketStatus, type Ticket } from '../types';

const MOCK_COMPANY_UUID = 'mock-company-uuid';

// Seed for consistent data
faker.seed(123);

const statuses = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.PENDING,
  TicketStatus.SOLVED,
  TicketStatus.CLOSED,
];

const priorities = [
  TicketPriority.LOW,
  TicketPriority.NORMAL,
  TicketPriority.HIGH,
  TicketPriority.URGENT,
];

const subjects = [
  'Login sorunu yaşıyorum',
  'Şifre sıfırlama çalışmıyor',
  'Dashboard yüklenmiyor',
  'Ödeme hatası alıyorum',
  'Rapor indirme sorunu',
  'Kullanıcı ekleme hatası',
  'Email bildirimleri gelmiyor',
  'Profil fotoğrafı yüklenmiyor',
  'Sayfa yavaş açılıyor',
  'Mobile uygulamada hata',
  'Veri senkronizasyonu sorunu',
  'API timeout hatası',
  'Dosya upload başarısız',
  'Arama fonksiyonu çalışmıyor',
  'Export işlemi tamamlanmıyor',
];

function generateMockTicket(id: number, daysAgo: number, isToday = false): Ticket {
  let createdAt: Date;
  
  if (isToday) {
    // For today's tickets, create a random time today
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    createdAt = faker.date.between({ from: startOfDay, to: now });
  } else {
    // For older tickets, use the daysAgo parameter (must be >= 1)
    createdAt = faker.date.recent({ days: Math.max(1, daysAgo) });
  }
  
  return {
    id,
    uuid: faker.string.uuid(),
    subject: faker.helpers.arrayElement(subjects),
    description: faker.lorem.paragraphs(2),
    status: faker.helpers.arrayElement(statuses),
    priority: faker.helpers.arrayElement(priorities),
    requesterEmail: faker.internet.email(),
    requesterName: faker.person.fullName(),
    companyUuid: MOCK_COMPANY_UUID,
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
  };
}

// Generate 100 mock tickets
export const mockTickets: Ticket[] = Array.from({ length: 100 }, (_, i) =>
  generateMockTicket(i + 1, 30)
);

// Generate some recent tickets for today
const todayTickets: Ticket[] = Array.from({ length: 8 }, (_, i) =>
  generateMockTicket(100 + i, 0, true) // isToday = true
);

export const allMockTickets = [...mockTickets, ...todayTickets];

// Helper to get tickets by company
export function getTicketsByCompany(companyUuid?: string): Ticket[] {
  if (!companyUuid) return allMockTickets;
  return allMockTickets.filter((ticket) => ticket.companyUuid === companyUuid);
}

// Helper to get recent tickets
export function getRecentTickets(limit = 10, companyUuid?: string): Ticket[] {
  const tickets = getTicketsByCompany(companyUuid);
  return tickets
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

// Helper to get ticket by uuid
export function getTicketByUuid(uuid: string): Ticket | undefined {
  return allMockTickets.find((ticket) => ticket.uuid === uuid);
}
