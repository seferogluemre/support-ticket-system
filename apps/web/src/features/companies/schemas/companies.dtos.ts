/**
 * Companies Module DTOs
 *
 * Bu dosya backend'teki companies modülünün DTO schema'larını re-export eder.
 * Form validation için bu schema'lar typeboxResolver ile kullanılır.
 */

// Company CRUD DTOs
export {
    companyCreateDto,
    companyUpdateDto
} from '#backend/modules/companies/dtos';
