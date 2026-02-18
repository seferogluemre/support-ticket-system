/**
 * Company Roles Module DTOs
 *
 * Bu dosya backend'teki roles modülünün DTO schema'larını re-export eder.
 * Form validation için bu schema'lar typeboxResolver ile kullanılır.
 */

// Company Role CRUD DTOs
export {
    roleStoreBodyDto as companyRoleCreateDto,
    roleUpdateBodyDto as companyRoleUpdateDto
} from '#backend/modules/auth/authorization/roles/dtos';
