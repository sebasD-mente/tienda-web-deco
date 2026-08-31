/**
 * middleware/errorHandler.js
 * Manejador de errores centralizado para Express.
 *
 * DEBE registrarse DESPUES de todas las rutas en server.js:
 *   app.use(errorHandler);
 *
 * Express identifica un error-handler por su firma de 4 argumentos: (err, req, res, next).
 */

import { AppError } from '../utils/app-error.js';

const IS_DEV = process.env.NODE_ENV !== 'production';

// ── Normalizadores de errores de terceros ─────────────────────────────────────
// Convierten errores propios de librerias/Node en AppErrors con info util.

function handleJsonParseError(err) {
  return new AppError('JSON malformado en el cuerpo de la peticion.', 400);
}

function handleEntityTooLargeError(err) {
  return new AppError('El cuerpo de la peticion excede el limite permitido (2MB).', 413);
}

function handleJWTError() {
  return new AppError('Token invalido. Por favor inicia sesion de nuevo.', 401);
}

function handleJWTExpiredError() {
  return new AppError('Tu sesion ha expirado. Por favor inicia sesion de nuevo.', 401);
}

function handleValidationError(err) {
  // Compatibilidad con Mongoose / Joi / express-validator
  const messages = Object.values(err.errors || {}).map(e => e.message).join('. ');
  return new AppError(`Datos invalidos: ${messages}`, 422);
}

function handleDuplicateKeyError(err) {
  const field = Object.keys(err.keyValue || {})[0] || 'campo';
  return new AppError(`El valor del campo "${field}" ya existe. Usa un valor diferente.`, 409);
}

// ── Respuesta en desarrollo (verbose) ─────────────────────────────────────────
function sendDevError(err, res) {
  res.status(err.statusCode).json({
    success:        false,
    status:         err.status,
    message:        err.message,
    meta:           err.meta,
    isOperational:  err.isOperational,
    stack:          err.stack,       // Stack trace completo visible solo en DEV
    error:          err              // Objeto de error completo para debugging
  });
}

// ── Respuesta en produccion (limpia, sin detalles internos) ───────────────────
function sendProdError(err, res) {
  if (err.isOperational) {
    // Error conocido y controlado: enviamos el mensaje al cliente
    res.status(err.statusCode).json({
      success:  false,
      status:   err.status,
      message:  err.message,
      ...(Object.keys(err.meta || {}).length > 0 && { meta: err.meta })
    });
  } else {
    // Error de programacion o desconocido: NO filtramos detalles internos
    console.error('ERROR CRITICO NO OPERACIONAL:', err);
    res.status(500).json({
      success:  false,
      status:   'error',
      message:  'Algo salio mal. Por favor intenta mas tarde.'
    });
  }
}

// ── Middleware principal (firma obligatoria de 4 args para Express) ────────────
/**
 * @param {Error} err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function errorHandler(err, req, res, next) {
  // Valores por defecto si el error no es un AppError
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';

  // ── Normalizar errores conocidos de Node / librerías ──────────────────────
  let error = err;

  if (err.type === 'entity.parse.failed')           error = handleJsonParseError(err);
  if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) error = handleEntityTooLargeError(err);
  if (err.name === 'JsonWebTokenError')             error = handleJWTError();
  if (err.name === 'TokenExpiredError')             error = handleJWTExpiredError();
  if (err.name === 'ValidationError')               error = handleValidationError(err);
  if (err.code === 11000)                           error = handleDuplicateKeyError(err);

  // ── Siempre loguear en servidor (nunca silenciar errores) ─────────────────
  const logPrefix = IS_DEV ? '[DEV ERROR]' : '[PROD ERROR]';
  console.error(`${logPrefix} ${req.method} ${req.originalUrl} — ${error.statusCode}: ${error.message}`);
  if (!error.isOperational || IS_DEV) {
    console.error(error.stack);
  }

  // ── Enviar respuesta segun entorno ────────────────────────────────────────
  if (IS_DEV) {
    sendDevError(error, res);
  } else {
    sendProdError(error, res);
  }
}

// ── Handler para rutas no encontradas (404) ───────────────────────────────────
// Registrar ANTES del errorHandler pero DESPUES de todas las rutas.
export function notFoundHandler(req, res, next) {
  next(new AppError(`La ruta ${req.originalUrl} no existe en este servidor.`, 404));
}
