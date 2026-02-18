/**
 * Projects Module DTOs
 *
 * Bu dosya backend'teki projects modülünün DTO schema'larını re-export eder.
 * Form validation için bu schema'lar typeboxResolver ile kullanılır.
 */

// Project CRUD DTOs
export {
    projectCreateDto,
    projectUpdateDto
} from '#backend/modules/projects/dtos';
