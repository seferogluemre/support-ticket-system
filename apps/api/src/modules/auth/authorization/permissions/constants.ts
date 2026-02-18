import { OrganizationType } from '@onlyjs/db/enums';
import type { GenericPermissionObject, PermissionKey } from './types';

const GLOBAL = 'global' as const;

export const PERMISSIONS = {
  // ====================================================================
  // 👤 USER MANAGEMENT GROUPS
  // ====================================================================
  USER_BASIC: {
    LIST: {
      key: 'user-basic:list',
      description: 'Kullanıcıları Listele',
      scopes: [GLOBAL, OrganizationType.COMPANY],
    },
    SHOW: {
      key: 'user-basic:show',
      description: 'Kullanıcı Detayını Görüntüle',
      scopes: [GLOBAL, OrganizationType.COMPANY],
    },
    CREATE: {
      key: 'user-basic:create',
      description: 'Kullanıcı Oluştur',
      scopes: [GLOBAL, OrganizationType.COMPANY],
    },
    UPDATE_PROFILE: {
      key: 'user-basic:update-profile',
      description: 'Kullanıcı Profilini Güncelle (ad, email, vb.)',
      scopes: [GLOBAL, OrganizationType.COMPANY],
      dependsOn: 'user-basic:show',
    },
    UPDATE_PASSWORD: {
      key: 'user-basic:update-password',
      description: 'Kullanıcı Parolasını Güncelle',
      scopes: [GLOBAL, OrganizationType.COMPANY],
      dependsOn: 'user-basic:show',
    },
    UPDATE_STATUS: {
      key: 'user-basic:update-status',
      description: 'Kullanıcı Durumunu Güncelle (aktif/pasif)',
      scopes: [GLOBAL, OrganizationType.COMPANY],
      dependsOn: 'user-basic:show',
    },
  },
  USER_PERMISSIONS: {
    ASSIGN_PERMISSION: {
      key: 'user-permissions:assign',
      description: 'Kullanıcıya Doğrudan Permission Ata/Kaldır',
      scopes: [GLOBAL],
      dependsOn: 'user-basic:show',
    },
  },
  USER_ROLES: {
    ASSIGN_GLOBAL_ROLE: {
      key: 'user-roles:assign-global',
      description: 'Kullanıcıya Global Rol Ata/Kaldır',
      scopes: [GLOBAL],
      dependsOn: ['user-basic:show', 'role-view:show-globals'],
    },
    ASSIGN_ROLE_OWN_ORGANIZATION: {
      key: 'user-roles:assign-own-organization',
      description: 'Kendi Organizasyonundaki Kullanıcılara Rol Ata/Kaldır',
      scopes: [OrganizationType.COMPANY],
      dependsOn: ['user-basic:show'],
    },
    ASSIGN_ROLE_ALL_ORGANIZATIONS: {
      key: 'user-roles:assign-all-organizations',
      description: 'Tüm Organizasyonlardaki Kullanıcılara Rol Ata/Kaldır',
      scopes: [GLOBAL],
      dependsOn: ['user-basic:show', 'role-view:show-all-organizations'],
    },
  },
  USER_MEMBERS: {
    ADD_MEMBERS_OWN_ORGANIZATION: {
      key: 'user-members:add-own-organization',
      description: 'Kendi Organizasyonuna Üye Ekle',
      scopes: [OrganizationType.COMPANY],
    },
    ADD_MEMBERS_ALL_ORGANIZATIONS: {
      key: 'user-members:add-all-organizations',
      description: 'Tüm Organizasyonlara Üye Ekle',
      scopes: [GLOBAL],
      dependsOn: 'user-basic:show',
    },
    REMOVE_MEMBERS_OWN_ORGANIZATION: {
      key: 'user-members:remove-own-organization',
      description: 'Kendi Organizasyonundan Üye Çıkar',
      scopes: [OrganizationType.COMPANY],
      dependsOn: 'user-basic:show',
    },
    REMOVE_MEMBERS_ALL_ORGANIZATIONS: {
      key: 'user-members:remove-all-organizations',
      description: 'Tüm Organizasyonlardan Üye Çıkar',
      scopes: [GLOBAL],
      dependsOn: 'user-basic:show',
    },
  },
  USER_ADMIN: {
    DESTROY: {
      key: 'user-admin:destroy',
      description: 'Kullanıcı Sil',
      scopes: [GLOBAL],
      dependsOn: 'user-basic:show',
    },
    BAN: {
      key: 'user-admin:ban',
      description: 'Kullanıcı Yasakla',
      scopes: [GLOBAL],
      hiddenOn: true,
      dependsOn: 'user-basic:show',
    },
    UNBAN: {
      key: 'user-admin:unban',
      description: 'Kullanıcı Yasağını Kaldır',
      scopes: [GLOBAL],
      hiddenOn: true,
      dependsOn: 'user-basic:show',
    },
    IMPERSONATE: {
      key: 'user-admin:impersonate',
      description: 'Kullanıcıyı Taklit Et',
      scopes: [GLOBAL],
      hiddenOn: true,
      dependsOn: 'user-basic:show',
    },
  },
  USER_SYSTEM: {
    UNLINK_USER: {
      key: 'user-system:unlink',
      description: 'Kullanıcıyı Bağlantıdan Kaldır',
      scopes: [GLOBAL],
      hiddenOn: true,
      dependsOn: 'user-basic:show',
    },
    LINK_USER: {
      key: 'user-system:link',
      description: 'Kullanıcıyı Bağla',
      scopes: [GLOBAL],
      hiddenOn: true,
      dependsOn: 'user-basic:show',
    },
    LIST_SESSIONS: {
      key: 'user-system:list-sessions',
      description: 'Oturumları Listele',
      scopes: [GLOBAL],
      hiddenOn: true,
      dependsOn: ['user-basic:show'],
    },
    REVOKE_SESSIONS: {
      key: 'user-system:revoke-sessions',
      description: 'Oturumları İptal Et',
      scopes: [GLOBAL],
      hiddenOn: true,
      dependsOn: 'user-basic:show',
    },
  },

  // ====================================================================
  // 🎭 ROLE MANAGEMENT GROUPS
  // ====================================================================
  ROLE_VIEW: {
    SHOW_GLOBALS: {
      key: 'role-view:show-globals',
      description: 'Global Rolleri Tekil Görüntüle',
      scopes: [GLOBAL],
    },
    LIST_GLOBALS: {
      key: 'role-view:list-globals',
      description: 'Global Rolleri Listele',
      scopes: [GLOBAL],
    },
    SHOW_ALL_ORGANIZATIONS: {
      key: 'role-view:show-all-organizations',
      description: 'Tüm Organizasyon Rollerini Tekil Görüntüle',
      scopes: [GLOBAL],
    },
    LIST_ALL_ORGANIZATIONS: {
      key: 'role-view:list-all-organizations',
      description: 'Tüm Organizasyon Rollerini Listele',
      scopes: [GLOBAL],
    },
  },
  ROLE_MANAGE_GLOBAL: {
    CREATE_GLOBALS: {
      key: 'role-manage-global:create',
      description: 'Global Rol Oluştur',
      scopes: [GLOBAL],
    },
    UPDATE_GLOBALS: {
      key: 'role-manage-global:update',
      description: 'Global Rolleri Güncelle',
      scopes: [GLOBAL],
    },
    REORDER_GLOBALS: {
      key: 'role-manage-global:reorder',
      description: 'Global Rollerin Sırasını Değiştir (Hierarchy)',
      scopes: [GLOBAL],
    },
    DELETE_GLOBALS: {
      key: 'role-manage-global:delete',
      description: 'Global Rolleri Sil',
      scopes: [GLOBAL],
    },
  },
  ROLE_MANAGE_ORGANIZATION: {
    CREATE_OWN_ORGANIZATION: {
      key: 'role-manage-organization:create',
      description: 'Kendi Organizasyonunda Rol Oluştur',
      scopes: [OrganizationType.COMPANY],
    },
    UPDATE_OWN_ORGANIZATION: {
      key: 'role-manage-organization:update',
      description: 'Kendi Organizasyonunun Rollerini Güncelle',
      scopes: [OrganizationType.COMPANY],
    },
    REORDER_OWN_ORGANIZATION: {
      key: 'role-manage-organization:reorder',
      description: 'Kendi Organizasyonunun Rollerinin Sırasını Değiştir (Hierarchy)',
      scopes: [OrganizationType.COMPANY],
    },
    DELETE_OWN_ORGANIZATION: {
      key: 'role-manage-organization:delete',
      description: 'Kendi Organizasyonunun Rollerini Sil',
      scopes: [OrganizationType.COMPANY],
    },
  },
  ROLE_MANAGE_ALL_ORGANIZATIONS: {
    CREATE_ALL_ORGANIZATIONS: {
      key: 'role-manage-all-organizations:create',
      description: 'Tüm Organizasyonlarda Rol Oluştur',
      scopes: [GLOBAL],
    },
    UPDATE_ALL_ORGANIZATIONS: {
      key: 'role-manage-all-organizations:update',
      description: 'Tüm Organizasyon Rollerini Güncelle',
      scopes: [GLOBAL],
    },
    REORDER_ALL_ORGANIZATIONS: {
      key: 'role-manage-all-organizations:reorder',
      description: 'Tüm Organizasyon Rollerinin Sırasını Değiştir (Hierarchy)',
      scopes: [GLOBAL],
    },
    DELETE_ALL_ORGANIZATIONS: {
      key: 'role-manage-all-organizations:delete',
      description: 'Tüm Organizasyon Rollerini Sil',
      scopes: [GLOBAL],
    },
  },

  // ====================================================================
  // 🔧 SYSTEM ADMINISTRATION
  // ====================================================================
  SYSTEM_ADMINISTRATION: {
    SHOW_LOGS: {
      key: 'system-administration:show-logs',
      description: 'Logları Görüntüle',
      scopes: [GLOBAL],
    },
    RESET_DATABASE: {
      key: 'system-administration:reset-database',
      description: 'Veritabanını Sıfırla',
      scopes: [GLOBAL],
      hiddenOn: true,
    },
    SEED_DATA: {
      key: 'system-administration:seed-data',
      description: "Veritabanını Seed'le",
      scopes: [GLOBAL],
      hiddenOn: true,
    },
  },

  // ====================================================================
  // 📝 CONTENT MANAGEMENT
  // ====================================================================
  POSTS: {
    SHOW: {
      key: 'posts:show',
      description: 'Gönderileri Görüntüle',
      scopes: [GLOBAL],
    },
    CREATE: {
      key: 'posts:create',
      description: 'Gönderi Oluştur',
      scopes: [GLOBAL],
    },
    UPDATE: {
      key: 'posts:update',
      description: 'Gönderi Güncelle',
      scopes: [GLOBAL],
    },
    DESTROY: {
      key: 'posts:destroy',
      description: 'Gönderi Sil',
      scopes: [GLOBAL],
    },
  },

  // ====================================================================
  // 📋 PROJECT MANAGEMENT (Example CRUD with permission-based authorization)
  // ====================================================================
  PROJECTS: {
    // Global scope permissions - Tüm company'lere erişim
    LIST_ALL: {
      key: 'projects:list-all',
      description: 'Tüm Projeleri Listele',
      scopes: [GLOBAL],
    },
    SHOW_ALL: {
      key: 'projects:show-all',
      description: 'Tüm Projeleri Görüntüle',
      scopes: [GLOBAL],
    },
    UPDATE_ALL: {
      key: 'projects:update-all',
      description: 'Tüm Projeleri Güncelle',
      scopes: [GLOBAL],
    },
    DELETE_ALL: {
      key: 'projects:delete-all',
      description: 'Tüm Projeleri Sil',
      scopes: [GLOBAL],
    },

    // Company scope permissions - Sadece üye olunan company'lere erişim
    LIST_OWN_COMPANY: {
      key: 'projects:list-own-company',
      description: 'Üye Olunan Company Projelerini Listele',
      scopes: [OrganizationType.COMPANY],
    },
    SHOW_OWN_COMPANY: {
      key: 'projects:show-own-company',
      description: 'Üye Olunan Company Projelerini Görüntüle',
      scopes: [OrganizationType.COMPANY],
    },
    CREATE: {
      key: 'projects:create',
      description: 'Company\'de Proje Oluştur',
      scopes: [OrganizationType.COMPANY],
    },
    UPDATE_OWN_COMPANY: {
      key: 'projects:update-own-company',
      description: 'Üye Olunan Company Projelerini Güncelle',
      scopes: [OrganizationType.COMPANY],
    },
    DELETE_OWN_COMPANY: {
      key: 'projects:delete-own-company',
      description: 'Üye Olunan Company Projelerini Sil',
      scopes: [OrganizationType.COMPANY],
    },
  },

  // ====================================================================
  // 🌐 COMPANY MANAGEMENT
  // ====================================================================
  COMPANIES: {
    SHOW: {
      key: 'companies:show',
      description: 'Company Görüntüle',
      scopes: [GLOBAL],
    },
    CREATE: {
      key: 'companies:create',
      description: 'Company Oluştur',
      scopes: [GLOBAL],
    },
    UPDATE: {
      key: 'companies:update',
      description: 'Company Güncelle (kendi COMPANY bilgilerini güncellemek için)',
      scopes: [GLOBAL, OrganizationType.COMPANY],
    },
    DESTROY: {
      key: 'companies:destroy',
      description: 'Company Sil',
      scopes: [GLOBAL],
    },
  },
  // ====================================================================
  // 📁 FILE MANAGEMENT
  // ====================================================================
  FILE_LIBRARY_ASSETS: {
    SHOW: {
      key: 'file-library-assets:show',
      description: 'Dosya Görüntüle',
      scopes: [GLOBAL, OrganizationType.COMPANY],
      hiddenOn: true,
    },
    CREATE: {
      key: 'file-library-assets:create',
      description: 'Dosya Oluştur',
      scopes: [GLOBAL, OrganizationType.COMPANY],
      hiddenOn: true,
    },
    UPDATE: {
      key: 'file-library-assets:update',
      description: 'Dosya Güncelle',
      scopes: [GLOBAL, OrganizationType.COMPANY],
      hiddenOn: true,
    },
    DESTROY: {
      key: 'file-library-assets:destroy',
      description: 'Dosya Sil',
      scopes: [GLOBAL, OrganizationType.COMPANY],
      hiddenOn: true,
    },
  },
} as const satisfies Record<string, Record<string, GenericPermissionObject>>;

export const PERMISSION_KEYS = [
  ...new Set(
    Object.values(PERMISSIONS)
      .flatMap((module) => Object.values(module))
      .flatMap((permission) => permission.key),
  ),
] as PermissionKey[];

export const PERMISSION_GROUPS = {
  // ====================================================================
  // 👤 USER MANAGEMENT GROUPS
  // ====================================================================
  USER_BASIC: {
    key: 'user-basic',
    description: 'Kullanıcı Temel İşlemleri',
    permissions: Object.values(PERMISSIONS.USER_BASIC),
  },
  USER_PERMISSIONS: {
    key: 'user-permissions',
    description: 'Kullanıcı Yetki Yönetimi',
    permissions: Object.values(PERMISSIONS.USER_PERMISSIONS),
  },
  USER_ROLES: {
    key: 'user-roles',
    description: 'Kullanıcı Rol Yönetimi',
    permissions: Object.values(PERMISSIONS.USER_ROLES),
  },
  USER_MEMBERS: {
    key: 'user-members',
    description: 'Kullanıcı Üyelik Yönetimi',
    permissions: Object.values(PERMISSIONS.USER_MEMBERS),
  },
  USER_ADMIN: {
    key: 'user-admin',
    description: 'Kullanıcı Admin İşlemleri',
    permissions: Object.values(PERMISSIONS.USER_ADMIN),
  },
  USER_SYSTEM: {
    key: 'user-system',
    description: 'Kullanıcı Sistem İşlemleri',
    permissions: Object.values(PERMISSIONS.USER_SYSTEM),
  },

  // ====================================================================
  // 🎭 ROLE MANAGEMENT GROUPS
  // ====================================================================
  ROLE_VIEW: {
    key: 'role-view',
    description: 'Rol Görüntüleme',
    permissions: Object.values(PERMISSIONS.ROLE_VIEW),
  },
  ROLE_MANAGE_GLOBAL: {
    key: 'role-manage-global',
    description: 'Global Rol Yönetimi',
    permissions: Object.values(PERMISSIONS.ROLE_MANAGE_GLOBAL),
  },
  ROLE_MANAGE_ORGANIZATION: {
    key: 'role-manage-organization',
    description: 'Organizasyon Rol Yönetimi',
    permissions: Object.values(PERMISSIONS.ROLE_MANAGE_ORGANIZATION),
  },
  ROLE_MANAGE_ALL_ORGANIZATIONS: {
    key: 'role-manage-all-organizations',
    description: 'Tüm Organizasyon Rol Yönetimi',
    permissions: Object.values(PERMISSIONS.ROLE_MANAGE_ALL_ORGANIZATIONS),
  },

  // ====================================================================
  // 🔧 SYSTEM ADMINISTRATION
  // ====================================================================
  SYSTEM_ADMINISTRATION: {
    key: 'system-administration',
    description: 'Sistem Yönetimi',
    permissions: Object.values(PERMISSIONS.SYSTEM_ADMINISTRATION),
  },

  // ====================================================================
  // 📝 CONTENT MANAGEMENT
  // ====================================================================
  POSTS: {
    key: 'posts',
    description: 'Gönderiler',
    permissions: Object.values(PERMISSIONS.POSTS),
  },

  // ====================================================================
  // 🌐 COMPANY MANAGEMENT
  // ====================================================================
  COMPANIES: {
    key: 'companies',
    description: 'Company Yönetimi',
    permissions: Object.values(PERMISSIONS.COMPANIES),
  },

  // ====================================================================
  // 📋 PROJECT MANAGEMENT
  // ====================================================================
  PROJECTS: {
    key: 'projects',
    description: 'Proje Yönetimi',
    permissions: Object.values(PERMISSIONS.PROJECTS),
  },

  // ====================================================================
  // 📁 FILE MANAGEMENT
  // ====================================================================
  FILE_LIBRARY_ASSETS: {
    key: 'file-library-assets',
    description: 'Dosya Yönetimi',
    permissions: Object.values(PERMISSIONS.FILE_LIBRARY_ASSETS),
  },
} as const satisfies Record<
  string,
  { key: string; description: string; permissions: Array<{ key: string; description: string }> }
>;

export const PERMISSION_GROUP_KEYS = Object.values(PERMISSION_GROUPS).map(
  (group) => group.key,
);