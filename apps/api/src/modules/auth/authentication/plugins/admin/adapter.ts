import prisma from '@onlyjs/db';
import type { AuthContext } from 'better-auth/types';
import { refreshUserClaims } from '../../../authorization/claims';
import { RolesService } from '../../../authorization/roles/service';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getAdminAdapter = (context: AuthContext) => {
  return {
    /**
     * Slug'a göre role bulur
     */
    findRoleBySlug: async (slug: string) => {
      const role = await RolesService.show(slug);
      return role;
    },

    /**
     * Kullanıcıya role atar ve claim'lerini yeniler
     */
    createUserRole: async (userId: string, roleId: number) => {
      // UserRole oluştur
      const userRole = await prisma.userRole.create({
        data: {
          userId,
          roleId,
        },
      });

      // Claim'leri yenile
      await refreshUserClaims(userId);

      return userRole;
    },

    /**
     * Kullanıcının tüm rollerini atar (mevcut rolleri siler)
     */
    setUserRoles: async (userId: string, roleIds: number[]) => {
      await prisma.$transaction(async (tx) => {
        // Mevcut rolleri sil
        await tx.userRole.deleteMany({
          where: { userId },
        });

        // Yeni rolleri ekle
        if (roleIds.length > 0) {
          await tx.userRole.createMany({
            data: roleIds.map((roleId) => ({
              userId,
              roleId,
            })),
          });
        }
      });

      // Claim'leri yenile
      await refreshUserClaims(userId);
    },

    /**
     * Kullanıcının claim'lerini yeniler
     */
    refreshUserClaims: async (userId: string) => {
      await refreshUserClaims(userId);
    },
  };
};
