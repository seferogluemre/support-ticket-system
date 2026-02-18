/**
 * Posts Module DTOs
 *
 * Bu dosya backend'teki posts modülünün DTO schema'larını re-export eder.
 * Form validation için bu schema'lar typeboxResolver ile kullanılır.
 */

// Post CRUD DTOs
export {
    postCreateDto,
    postUpdateDto
} from '#backend/modules/posts/dtos';