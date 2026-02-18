import { cache } from '#core';
import { InternalServerErrorException } from '../../utils';

export class SystemAdministrationService {
  static resetDatabase() {
    if (process.env.NODE_ENV !== 'development') {
      throw new InternalServerErrorException(
        "Bu işlem sadece development environment'ında kullanılabilir.",
      );
    }

    // Response objesi
    const response = {
      success: true,
      message:
        'Veritabanı sıfırlama işlemi arka planda başlatıldı. İşlem tamamlandığında server otomatik yenilenecek.',
      timestamp: new Date().toISOString(),
    };

    // Background task'i başlat (fire-and-forget)
    void (async () => {
      try {
        // Redis cache'i temizle
        await cache.flushAll();

        const { spawn } = await import('child_process');
        const { join } = await import('path');

        // Root dizine git
        const rootDir = join(process.cwd(), '../..');
        const dbDir = join(rootDir, 'packages/database');

        // Migration, seed ve generate'i sırayla çalıştır
        // seed script'i zaten kendi içinde generate yapıyor
        const child = spawn(
          'sh',
          [
            '-c',
            'bun run prisma migrate reset --force --skip-generate --skip-seed && bun run seed',
          ],
          {
            cwd: dbDir,
            stdio: 'inherit',
            env: process.env,
          },
        );

        // Migration tamamlandığında nodemon'a restart sinyali gönder
        child.on('exit', (code) => {
          if (code === 0 && process.env.NODE_ENV === 'development') {
            // Nodemon tarafından dinlenen SIGUSR2 sinyalini gönder
            // Production'da nodemon olmadığı için bu sinyal zararsızdır
            process.kill(process.pid, 'SIGUSR2');
          }
        });
      } catch (error) {
        // Background işlem hatası - logla ama throw etme
        // biome-ignore lint/suspicious/noConsole: Background task error logging
        console.error('Database reset background task error:', error);
      }
    })();

    // Response'u hemen döndür (sync)
    return response;
  }
}
