import { cache } from '#core';
import { generateUserClaims } from '#modules/auth/authorization/claims';
import { UserFormatter } from '#modules/users/formatters.ts';
import prisma from '@onlyjs/db';
import { Gender } from '@onlyjs/db/enums';
import { betterAuth as betterAuthBase } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { customSession, openAPI } from 'better-auth/plugins';
import { NotFoundError } from 'elysia';
import { admin } from './plugins/admin';
import { AuthenticationService } from './service';

export const betterAuth = betterAuthBase({
  database: prismaAdapter(prisma, {
    provider: 'postgresql', // or "mysql", "postgresql", ...etc
  }),
  //
  appName: process.env.APP_NAME,
  basePath: '/auth',
  baseURL: process.env.APP_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  url: process.env.APP_URL,
  trustedOrigins: [
    ...new Set([
      process.env.APP_URL!,
      process.env.API_URL!,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]),
  ],
  domain: process.env.APP_DOMAIN,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 32,
    password: {
      hash: async (password) => {
        return (await AuthenticationService.hashPassword(password))!;
      },
      verify: async ({ hash, password }) => {
        return AuthenticationService.verifyPassword(password, hash);
      },
    },
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      firstName: {
        type: 'string',
        required: true,
        fieldName: 'firstName',
      },
      lastName: {
        type: 'string',
        required: true,
        fieldName: 'lastName',
      },
      name: {
        type: 'string',
        required: false,
        fieldName: 'name',
      },
      gender: {
        type: 'string',
        required: true,
        fieldName: 'gender',
        defaultValue: Gender.MALE,
        input: false,
      },
      isActive: {
        type: 'boolean',
        required: true,
        fieldName: 'isActive',
        defaultValue: true,
        input: false,
      },
      deletedAt: {
        type: 'date',
        required: false,
        fieldName: 'deletedAt',
        input: false,
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: true,
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.APP_DOMAIN,
    },
    cookiePrefix: process.env.APP_SLUG,
  },
  /*secondaryStorage: process.env.REDIS_URL
    ? {
        get: async (key) => {
          const value = (await cache.getPrimitive<string>(key)) as string | null;
          return value ?? null;
        },
        set: async (key, value, ttl) => {
          if (ttl) await cache.set(key, value, ttl);
          else await cache.set(key, value);
        },
        delete: async (key) => {
          await cache.del(key);
        },
      }
    : undefined,*/
  plugins: [
    admin({
      defaultRole: false, // Seeder'da manuel rol ataması yapıyoruz
    }),
    openAPI({
      path: '/swagger',
      disableDefaultReference: true,
    }),
    customSession(async ({ user, session }) => {
      const fullUser = await prisma.user.findUnique({ where: { id: user.id } });

      if (!fullUser) {
        throw new NotFoundError('User not found');
      }

      const formattedUser = UserFormatter.response(fullUser);

      // Kullanıcının claim'lerini oluştur ve session'a ekle
      const claims = await generateUserClaims(user.id);

      return {
        user: {
          ...formattedUser,
          claims, // JWT token'a claim'leri göm
        },
        session,
      };
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // @ts-ignore
          const { firstName, lastName } = user;

          return {
            data: {
              ...user,
              name: `${firstName} ${lastName}`,
            },
          };
        },
      },
    },
  },
});
