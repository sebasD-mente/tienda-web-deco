/**
 * utils/AppError.js
 * Clase base para todos los errores operativos de la aplicacion.
 *
 * Uso:
 *   throw new AppError('Producto no encontrado', 404);
 *   throw new AppError('Token invalido', 401);
 *
 * La propiedad `isOperational = true` distingue errores esperados (que el
 * cliente puede manejar) de bugs inesperados del programa.
 */

export class AppError extends Error {
  /**
   * @param {string} message    - Mensaje legible para humanos (puede exponerse al cliente).
   * @param {number} statusCode - Codigo HTTP (400, 401, 403, 404, 422, 500...).
   * @param {object} [meta]     - Datos extra opcionales (campos de validacion, codigos internos, etc.).
   */
  constructor(message, statusCode = 500, meta = {}) {
    super(message);

    // Nombre de la clase para identificar el tipo de error en logs
    this.name = 'AppError';

    // Codigo HTTP que se enviara en la respuesta
    this.statusCode = statusCode;

    // Familia del codigo: "fail" para 4xx (culpa del cliente), "error" para 5xx (culpa del servidor)
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';

    // Marca que distingue errores deliberados de bugs inesperados.
    // Solo los errores con isOperational = true reciben respuesta limpia al cliente.
    this.isOperational = true;

    // Metadatos adicionales (p. ej. lista de campos con errores de validacion)
    this.meta = meta;

    // Capturar el stack trace excluyendo este constructor del traceback
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// ── Helpers de fabrica para los codigos mas comunes ───────────────────────────
// Permiten crear errores de forma expresiva sin recordar el codigo HTTP.

/** 400 - La peticion tiene parametros incorrectos o faltantes. */
AppError.badRequest = (msg, meta) => new AppError(msg, 400, meta);

/** 401 - El cliente no esta autenticado. */
AppError.unauthorized = (msg = 'No autorizado. Inicie sesion para continuar.') =>
  new AppError(msg, 401);

/** 403 - El cliente esta autenticado pero no tiene permisos. */
AppError.forbidden = (msg = 'No tienes permisos para realizar esta accion.') =>
  new AppError(msg, 403);

/** 404 - El recurso solicitado no existe. */
AppError.notFound = (resource = 'Recurso') =>
  new AppError(`${resource} no encontrado.`, 404);

/** 422 - La peticion esta bien formada pero los datos no pasan validacion de negocio. */
AppError.unprocessable = (msg, meta) => new AppError(msg, 422, meta);

/** 500 - Error interno del servidor (generico). */
AppError.internal = (msg = 'Error interno del servidor. Intenta mas tarde.') =>
  new AppError(msg, 500);
