/**
 * middleware/validate.js
 * Declarative Express middleware factory for validating incoming request payloads using Zod schemas.
 * Standardizes validation error responses to HTTP 400:
 * {
 *   success: false,
 *   error: 'Datos de entrada inválidos.',
 *   details: [
 *     { field: string, message: string, code: string }
 *   ]
 * }
 */

/**
 * Creates an Express middleware that validates req[source] against a Zod schema.
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body' | 'query' | 'params'} [source='body']
 * @returns {import('express').RequestHandler}
 */
export function validate(schema, source = 'body') {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source] || {};
      const result = await schema.safeParseAsync(dataToValidate);

      if (!result.success) {
        const issues = result.error.issues || result.error.errors || [];
        const details = issues.map((issue) => ({
          field: (Array.isArray(issue.path) && issue.path.length > 0) ? issue.path.join('.') : 'unknown',
          message: issue.message,
          code: issue.code
        }));

        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos.',
          details
        });
      }

      // Overwrite target with parsed / validated data
      req[source] = result.data;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

export default validate;
